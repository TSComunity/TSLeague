const { createMatch } = require('./match.js')

/**
 * Genera los partidos para una ronda en una división, evitando repeticiones y permitiendo descansos.
 * - Asegura que cada equipo solo juegue un partido por ronda.
 * - Evita que un equipo juegue contra sí mismo o contra equipos ya eliminados (null).
 * - Registra qué equipos descansan esa ronda.
 *
 * @param {Array} matchesDocs - Partidos ya jugados en la temporada/división.
 * @param {Array} teamsdocs - Equipos que participan.
 * @param {ID} seasonId - ID de la temporada.
 * @param {ID} divisionId - ID de la división.
 * @param {Number} nextRoundIndex - Indice de la ronda a generar.
 * @returns {Array} matches - Lista de nuevos partidos generados.
 * @returns {Array} resting - IDs de los equipos que descansan esta ronda.
 */

const generateMatchmaking = ({ matchesDocs, teamsDocs, seasonId, divisionId, nextRoundIndex }) => {

  // Evitar errores por equipos eliminados/null
  const validTeams = teamsDocs.filter(teamDoc => teamDoc != null)
  const validTeamsIds = validTeams.map(teamDoc => teamDoc._id)

  if (validTeamsIds.length < 2) {
    console.warn('No hay suficientes equipos válidos para generar partidos.')
    return { matches: [], resting: validTeamsIds }
  }

  const alreadyPlayed = new Set()

  // Marcar combinaciones ya jugadas anteriormente
  for (const matchDoc of matchesDocs) {
    if (!matchDoc.teamA || !matchDoc  .teamB) continue
    const key = [matchDoc.teamA.toString(), matchDoc.teamB.toString()].sort().join('-')
    alreadyPlayed.add(key)
  }

  const usedThisRound = new Set()

  const newMatchesDocs = []
  const newRestingTeamsDocs = []

  // Intentar emparejar equipos disponibles
  for (let i = 0; i < validTeamsIds.length; i++) {
    const idA = validTeamsIds[i]
    if (usedThisRound.has(idA)) continue

    for (let j = i + 1; j < validTeamsIds.length; j++) {
      const idB = validTeamsIds[j]
      if (usedThisRound.has(idB)) continue
      if (idA.toString() === idB.toString()) continue // evitar partido contra sí mismo

      const key = [idA.toString(), idB.toString()].sort().join('-')
      if (alreadyPlayed.has(key)) continue // evitar duplicados

      // Emparejamiento válido
      const matchInstance = createMatch({
        teamA: idA, // El ID del primer equipo
        teamB: idB, // El ID del segundo equipo
        season: seasonId, // El ID de la temporada
        division: divisionId, // El ID de la división
        roundIndex: nextRoundIndex, // El índice de la ronda
      })

      newMatchesDocs.push(matchInstance)

      usedThisRound.add(idA)
      usedThisRound.add(idB)
      alreadyPlayed.add(key)

      break // idA ya emparejado, pasamos al siguiente
    }
  }

  // Registrar equipos que no jugaron esta ronda (descansan)
  for (const validTeam of validTeams) {
    const teamId = validTeam._id
    if (!usedThisRound.has(teamId)) {
      newRestingTeamsDocs.push(validTeam)
    }
  }

  return {
    newMatchesDocs,
    newRestingTeamsDocs
  }
}

module.exports = { generateMatchmaking }