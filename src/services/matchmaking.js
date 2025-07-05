const { getNextDayAndHour } = require('../utils/getNextDayAndHour.js')

const { match } = require('../../configs/configs.json')
const { defaultStartDay, defaultStartHour } = match

/**
 * Devuelve información aleatoria para un partido.
 * @return {Object} matchData - Data del partido.
 */

const getRandomMatchData = () => {
  return {
    scheduledAt: getNextDayAndHour(defaultStartDay, defaultStartHour),
    imageURL,
    sets
  }
}

/**
 * Genera los partidos para una ronda en una división, evitando repeticiones y permitiendo descansos.
 * - Asegura que cada equipo solo juegue un partido por ronda.
 * - Evita que un equipo juegue contra sí mismo o contra equipos ya eliminados (null).
 * - Registra qué equipos descansan esa ronda.
 *
 * @param {Object} options
 * @param {Array} options.existingMatches - Partidos ya jugados en la temporada/división.
 * @param {Array<ObjectId>} options.teamsIds - Lista de IDs de equipos activos en la división.
 * @param {ObjectId} options.seasonId - ID de la temporada.
 * @param {String} options.divisionId - ID de la división.
 * @param {Number} options.roundIndex - Número de la ronda actual.
 * @returns {Object} resultado - Resultados de la generación.
 * @returns {Array} resultado.matches - Lista de nuevos partidos generados.
 * @returns {Array} resultado.resting - IDs de los equipos que descansan esta ronda.
 */

const generateMatches = ({ existingMatches, teamsIds, seasonId, divisionId, roundIndex }) => {
  const alreadyPlayed = new Set()
  const matches = []

  if (!Array.isArray(teamsIds) || teamsIds.length < 2) {
    console.warn('⛔ No hay suficientes equipos válidos para generar partidos')
    return { matches: [], resting: teamsIds.filter(Boolean) }
  }

  // Evitar errores por equipos eliminados/null
  const validTeams = teamsIds.filter(id => id != null)

  // Marcar combinaciones ya jugadas anteriormente
  for (const match of existingMatches) {
    if (!match.teamA || !match.teamB) continue
    const key = [match.teamA.toString(), match.teamB.toString()].sort().join('-')
    alreadyPlayed.add(key)
  }

  const usedThisRound = new Set()
  const restingThisRound = []

  // Intentar emparejar equipos disponibles
  for (let i = 0; i < validTeams.length; i++) {
    const idA = validTeams[i]
    if (usedThisRound.has(idA)) continue

    for (let j = i + 1; j < validTeams.length; j++) {
      const idB = validTeams[j]
      if (usedThisRound.has(idB)) continue
      if (idA.toString() === idB.toString()) continue // evitar partido contra sí mismo

      const key = [idA.toString(), idB.toString()].sort().join('-')
      if (alreadyPlayed.has(key)) continue // evitar duplicados

      // Emparejamiento válido
      const { scheduledAt, imageURL, sets } = getRandomMatchData()

      matches.push({
        season: seasonId,
        division: divisionId,
        roundIndex,
        teamA: idA,
        teamB: idB,
        scoreA: 0,
        scoreB: 0,
        scheduledAt,
        status: 'scheduled',
        imageURL,
        sets
      })

      usedThisRound.add(idA)
      usedThisRound.add(idB)
      alreadyPlayed.add(key)

      // TODO: avisar al md y que puedan cambiar horario

      break // idA ya emparejado, pasamos al siguiente
    }
  }

  // Registrar equipos que no jugaron esta ronda (descansan)
  for (const id of validTeams) {
    if (!usedThisRound.has(id)) {
      restingThisRound.push(id)
      // TODO: avisar que les toca descansar
    }
  }

  return {
    matches,
    resting: restingThisRound
  }
}

module.exports = { generateMatches }