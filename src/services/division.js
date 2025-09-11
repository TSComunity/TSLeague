const Division = require('../Esquemas/Division.js')
const Team = require('../Esquemas/Team.js')

/**
 * Crea una nueva división si el nombre y el tier no están en uso.
 * @param {string} name - Nombre de la división.
 * @param {number} tier - Tier numérico (prioridad).
 * @returns {Object} newDivision - La división creada.
 */
const createDivision = async ({ name, tier, emoji, color }) => {
  if (!name || !tier || !emoji || !color) {
    throw new Error('Faltan datos: name, tier, emoji o color.')
  }

  const divisions = await Division.find()
  const divisionsNames = divisions.map(div => div.name)
  const divisionsTiers = divisions.map(div => div.tier)

  if (divisionsNames.includes(name)) {
    throw new Error('Ya existe una división con ese nombre.')
  }

  if (divisionsTiers.includes(tier)) {
    throw new Error('Ya existe una división con ese tier.')
  }

  const newDivision = new Division({ name, tier, emoji, color })

  await newDivision.save()
  return newDivision
}

/**
 * Elimina una división por su nombre.
 * @param {string} name - Nombre de la división.
 * @returns {Object} division - División eliminada.
 */
const deleteDivision = async ({ name }) => {
    if (!name) {
    throw new Error('Debes proporcionar un nombre.')
    }

    const division = await Division.findOne({ name })

    if (!division) {
    throw new Error('No se encontró la división.')
    }

    const teams = await Team.find({ divisionId: division._id })
    for (const team of teams) {
      team.divisionId = null
      await team.save()
    }

    await division.deleteOne()
    return division
}

/**
 * Actualiza una división existente por su nombre.
 * @param {string} name - Nombre actual de la división.
 * @param {string} newName - Nuevo nombre (opcional).
 * @param {number} newTier - Nuevo tier (opcional).
 * @returns {Object} division - División actualizada.
 */
const updateDivision = async ({ name, newName, newTier, newEmoji, newColor }) => {
    if (!name) {
        throw new Error('Debes proporcionar un nombre.')
    }

    const division = await Division.findOne({ name })

    if (!division) {
        throw new Error('No se encontró la división.')
    }

    if (newName) {
        const nameExists = await Division.findOne({ name: newName })
        if (nameExists && nameExists._id.toString() !== division._id.toString()) {
            throw new Error('Ya existe otra división con ese nuevo nombre.')
        }
        division.name = newName
    }

    if (newTier) {
        const tierExists = await Division.findOne({ tier: newTier })
        if (tierExists && tierExists._id.toString() !== division._id.toString()) {
            throw new Error('Ya existe otra división con ese tier.')
        }
        division.tier = newTier
    }

    if (newEmoji) {
        division.emoji = newEmoji
    }
    if (newColor) {
        division.color = newColor
    }

    await division.save()
    return division
}

const calculatePromotionRelegation = async ({ season, divisionId = null }) => {
  const allDivisions = season.divisions.sort((a, b) => a.divisionId.tier - b.divisionId.tier)
  const divisionsToProcess = divisionId
    ? allDivisions.filter(d => d.divisionId.toString() === divisionId.toString())
    : allDivisions

  const allDivisionsEnded = allDivisions.length > 0 && allDivisions.every(d => d.status === 'ended')
  const result = []

  for (const division of divisionsToProcess) {
    const sortedTeams = [...division.teams].sort((a, b) => (b.points || 0) - (a.points || 0))
    const teamCount = sortedTeams.length
    const limit = teamCount >= 12 ? 3 : 2

    const globalIndex = allDivisions.findIndex(d => d.divisionId.toString() === division.divisionId.toString())
    const promoted = globalIndex > 0 ? sortedTeams.slice(0, limit) : []
    const relegated = globalIndex < allDivisions.length - 1 ? sortedTeams.slice(-limit) : []
    const stayed = sortedTeams.filter(t => !promoted.includes(t) && !relegated.includes(t))

    // Aplicar cambios en DB solo si no es divisionId concreto (cuando termina toda la temporada)
    if (!divisionId) {
      // Ascensos
      if (promoted.length && globalIndex > 0) {
        const upperDivision = allDivisions[globalIndex - 1]
        promoted.forEach(t => {
          upperDivision.teams.push(t)
          division.teams = division.teams.filter(team => team.teamId.toString() !== t.teamId.toString())
        })
      }

      // Descensos
      if (relegated.length && globalIndex < allDivisions.length - 1) {
        const lowerDivision = allDivisions[globalIndex + 1]
        relegated.forEach(t => {
          lowerDivision.teams.push(t)
          division.teams = division.teams.filter(team => team.teamId.toString() !== t.teamId.toString())
        })
      }

      // Actualizar Team.divisionId
      for (const t of [...promoted, ...relegated]) {
        let newDivisionId = null
        if (promoted.includes(t) && globalIndex > 0) newDivisionId = allDivisions[globalIndex - 1].divisionId
        if (relegated.includes(t) && globalIndex < allDivisions.length - 1) newDivisionId = allDivisions[globalIndex + 1].divisionId
        if (newDivisionId) await Team.findByIdAndUpdate(t.teamId, { divisionId: newDivisionId })
      }
    }

    result.push({
      divisionId: division.divisionId,
      promoted,
      relegated,
      stayed,
      canExecute: allDivisionsEnded || divisionId !== null,
      pendingExecution: !allDivisionsEnded && divisionId === null
    })
  }

  return result
}

module.exports = { createDivision, deleteDivision, updateDivision, calculatePromotionRelegation }