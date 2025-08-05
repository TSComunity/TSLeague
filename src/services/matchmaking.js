const { createMatch } = require('./match.js')

const { generateRandomSets } = require('./sets.js')

/**
 * Genera los partidos para una ronda en una división, evitando repeticiones y permitiendo descansos.
 * - Asegura que cada equipo solo juegue un partido por ronda.
 * - Evita que un equipo juegue contra sí mismo o contra equipos ya eliminados (null).
 * - Registra qué equipos descansan esa ronda.
 *
 * @param {Array} matchesDocs - Partidos ya jugados en la temporada/división (array de objetos con teamAId, teamBId poblados).
 * @param {Array} teamsDocs - Equipos que participan (array de Team poblados).
 * @param {Object} season - Objeto Season completo (opcional).
 * @param {Object} division - Objeto Division completo.
 * @param {Number} nextRoundIndex - Índice de la ronda a generar.
 * @param {Object} client - Instancia de Discord.js.
 * @returns {Object} { newMatchesDocs, newRestingTeamsDocs }
 */
const generateMatchmaking = async ({
  client,
  matchesDocs,
  teamsDocs,
  season,
  division,
  nextRoundIndex
}) => {
  // Filtrar equipos válidos (no nulos, con ID)
  const validTeams = Array.isArray(teamsDocs) ? teamsDocs.filter(teamDoc => teamDoc && teamDoc._id) : []
  const validTeamsIds = validTeams.map(teamDoc => teamDoc._id.toString())

  // Mezclar orden aleatorio
  validTeamsIds.sort(() => Math.random() - 0.5)

  // Si hay menos de 2 equipos, nadie puede jugar, todos descansan
  if (validTeamsIds.length < 2) {
    return { newMatchesDocs: [], newRestingTeamsDocs: validTeams }
  }

  // Filtrar partidos no válidos
  const filteredMatchesDocs = Array.isArray(matchesDocs) ? matchesDocs.filter(Boolean) : []
  // Crear set de emparejamientos ya jugados
  const alreadyPlayed = new Set()
  for (const matchDoc of filteredMatchesDocs) {
    if (!matchDoc) continue // PARCHE ANTI UNDEFINED
    let teamA = matchDoc.teamAId
    let teamB = matchDoc.teamBId
    let teamAId = teamA._id
    let teamBId = teamB._id

    if (!teamAId || !teamBId) continue
    const key = [teamAId.toString(), teamBId.toString()].sort().join('-')
    alreadyPlayed.add(key)
  }

  const usedThisRound = new Set()
  const newMatchesDocs = []
  const newRestingTeamsDocs = []

  // Emparejar equipos disponibles, uno por ronda
  for (let i = 0; i < validTeamsIds.length; i++) {
    const teamAId = validTeamsIds[i]
    if (usedThisRound.has(teamAId)) continue

    for (let j = i + 1; j < validTeamsIds.length; j++) {
      const teamBId = validTeamsIds[j]
      if (usedThisRound.has(teamBId)) continue
      if (teamAId === teamBId) continue // evitar partido contra sí mismo

      const key = [teamAId, teamBId].sort().join('-')
      if (alreadyPlayed.has(key)) continue // evitar duplicados

      const sets = await generateRandomSets()

      const teamADoc = validTeams.find(t => t._id.toString() === teamAId)
      const teamBDoc = validTeams.find(t => t._id.toString() === teamBId)

      // Emparejamiento válido, crear partido
      const createdMatch = await createMatch({
        client,
        seasonId: season._id,
        divisionDoc: division.divisionId,
        roundIndex: nextRoundIndex,
        teamADoc,
        teamBDoc,
        sets
      })

      newMatchesDocs.push(createdMatch)
      usedThisRound.add(teamAId.toString())
      usedThisRound.add(teamBId.toString())
      alreadyPlayed.add(key.toString())
      break // teamAId emparejado, pasamos al siguiente
    }
    // Si no se encontró pareja, descansará
// Si no se emparejó en este bucle, descansará
    if (!usedThisRound.has(teamAId)) {
      newRestingTeamsDocs.push(validTeams.find(t => t._id.toString() === teamAId.toString()))
    }
  }
  return { newMatchesDocs, newRestingTeamsDocs }
}

module.exports = { generateMatchmaking }