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

/**
 * Calcula ascensos, descensos, expulsiones y equipos que se mantienen
 * para todas las divisiones de una temporada.
 *
 * @param {Object} season - documento season con .divisions[] y cada división con .divisionId y .teams[]
 * @returns {Promise<Array>} - array con resultado por división:
 *  [{ divisionId, promoted, relegated, stayed, expelled }]
 */
const calculatePromotionRelegation = async (season) => {
  if (!season || !Array.isArray(season.divisions)) {
    throw new Error("season inválido: necesita season.divisions[]");
  }

  const allDivisions = [...season.divisions].sort(
    (a, b) => (a?.divisionId?.tier ?? 0) - (b?.divisionId?.tier ?? 0)
  );

  const result = [];

  for (const division of allDivisions) {
    const teams = Array.isArray(division.teams) ? [...division.teams] : [];
    const sorted = teams
      .map(t => typeof t === "string" || typeof t === "number" ? { teamId: t } : t)
      .filter(Boolean)
      .sort((a, b) => (b.points || 0) - (a.points || 0));

    const teamCount = sorted.length;

    // Calcular moveCount según tamaño y limitarlo
    let moveCount = 0;
    if (teamCount >= 12) moveCount = 3;
    else if (teamCount >= 6) moveCount = 2;
    else if (teamCount >= 3) moveCount = 1;
    moveCount = Math.min(moveCount, Math.max(0, teamCount - 1));

    const globalIndex = allDivisions.findIndex(d => d.divisionId?.toString?.() === division.divisionId?.toString?.());
    const isFirst = globalIndex === 0;
    const isLast = globalIndex === allDivisions.length - 1;

    const promoted = !isFirst ? sorted.slice(0, moveCount) : [];
    const relegated = !isLast ? sorted.slice(-moveCount) : [];
    const expelled = isLast ? sorted.slice(-moveCount) : [];
    const stayed = sorted.filter(t => !promoted.includes(t) && !relegated.includes(t) && !expelled.includes(t));

    result.push({
      divisionId: division.divisionId,
      promoted,
      relegated,
      stayed,
      expelled
    });
  }

  return result;
};

module.exports = { createDivision, deleteDivision, updateDivision, calculatePromotionRelegation }