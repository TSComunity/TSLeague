const { createMatch } = require('./match.js')
const { generateRandomSets } = require('./sets.js')

/**
 * Obtiene el historial de descansos de un equipo desde el schema Season
 * @param {String} teamId - ID del equipo
 * @param {Object} season - Objeto Season completo
 * @param {String} divisionId - ID de la división
 * @param {Number} currentRoundIndex - Índice de la ronda actual
 * @returns {Object} { consecutiveRests, totalRests }
 */
const getTeamRestHistory = ({ teamId, season, divisionId, currentRoundIndex }) => {
  const division = season.divisions.find(div => div.divisionId.toString() === divisionId.toString())
  if (!division || !Array.isArray(division.rounds) || division.rounds.length === 0) {
    return { consecutiveRests: 0, totalRests: 0 }
  }

  const rounds = division.rounds
  if (!Array.isArray(rounds) || rounds.length === 0) {
    return { consecutiveRests: 0, totalRests: 0 }
  }

  let consecutiveRests = 0
  let totalRests = 0

  // Ordenar rounds por roundIndex para procesarlos correctamente
  const sortedRounds = rounds
    .filter(round => round.roundIndex < currentRoundIndex)
    .sort((a, b) => b.roundIndex - a.roundIndex) // De mayor a menor (más reciente primero)

  for (const round of sortedRounds) {
    const teamRestedThisRound = round.resting?.some(restingTeam => 
      restingTeam.teamId && restingTeam.teamId.toString() === teamId.toString()
    )

    if (teamRestedThisRound) {
      totalRests++
      // Solo contar como consecutivo si es la ronda inmediatamente anterior
      if (round.roundIndex === currentRoundIndex - consecutiveRests - 1) {
        consecutiveRests++
      }
    } else if (consecutiveRests > 0) {
      // Si no descansó en esta ronda pero sí en rondas más recientes,
      // paramos de contar descansos consecutivos
      break
    }
  }

  return { consecutiveRests, totalRests }
}

/**
 * Prioriza equipos para emparejamiento basado en su historial de descansos
 * @param {Array} validTeamsIds - Array de IDs de equipos válidos
 * @param {Object} season - Objeto Season completo
 * @param {String} divisionId - ID de la división
 * @param {Number} currentRoundIndex - Índice de la ronda actual
 * @returns {Array} Array de equipos ordenados por prioridad
 */
const prioritizeTeamsByRestHistory = ({ validTeamsIds, season, divisionId, currentRoundIndex }) => {
  return validTeamsIds
    .map(teamId => {
      const restHistory = getTeamRestHistory({ teamId, season, divisionId, currentRoundIndex })
      return {
        teamId,
        consecutiveRests: restHistory.consecutiveRests,
        totalRests: restHistory.totalRests,
        // Factor de prioridad: más peso a descansos consecutivos
        priority: restHistory.consecutiveRests * 10 + restHistory.totalRests
      }
    })
    .sort((a, b) => {
      // Primero por descansos consecutivos (descendente)
      if (b.consecutiveRests !== a.consecutiveRests) {
        return b.consecutiveRests - a.consecutiveRests
      }
      // Luego por total de descansos (descendente)
      if (b.totalRests !== a.totalRests) {
        return b.totalRests - a.totalRests
      }
      // Finalmente aleatorio para equipos con mismo historial
      return Math.random() - 0.5
    })
    .map(team => team.teamId)
}

/**
 * Encuentra el mejor oponente para un equipo, considerando historial de descansos
 * @param {String} teamAId - ID del equipo principal
 * @param {Array} availableOpponents - Array de posibles oponentes
 * @param {Set} alreadyPlayed - Set de emparejamientos ya jugados
 * @param {Object} season - Objeto Season completo
 * @param {String} divisionId - ID de la división
 * @param {Number} currentRoundIndex - Índice de la ronda actual
 * @returns {String|null} ID del mejor oponente o null si no hay ninguno válido
 */
const findBestOpponent = ({ teamAId, availableOpponents, alreadyPlayed, season, divisionId, currentRoundIndex }) => {
  const validOpponents = availableOpponents.filter(teamBId => {
    if (teamAId === teamBId) return false
    
    const key = [teamAId, teamBId].sort().join('-')
    if (alreadyPlayed.has(key)) return false
    
    return true
  })

  if (validOpponents.length === 0) return null
  if (validOpponents.length === 1) return validOpponents[0]

  // Priorizar oponentes que también necesiten jugar (han descansado más)
  const opponentsWithPriority = validOpponents
    .map(teamId => {
      const restHistory = getTeamRestHistory({ teamId, season, divisionId, currentRoundIndex })
      return {
        teamId,
        priority: restHistory.consecutiveRests * 10 + restHistory.totalRests
      }
    })
    .sort((a, b) => b.priority - a.priority)

  return opponentsWithPriority[0].teamId
}

/**
 * Genera los partidos para una ronda en una división, evitando repeticiones y balanceando descansos.
 * - Asegura que cada equipo solo juegue un partido por ronda.
 * - Evita que un equipo juegue contra sí mismo o contra equipos ya eliminados (null).
 * - Prioriza equipos que han descansado más para reducir descansos consecutivos.
 * - Registra qué equipos descansan esa ronda.
 *
 * @param {Array} matchesDocs - Partidos ya jugados en la temporada/división.
 * @param {Array} teamsDocs - Equipos que participan.
 * @param {Object} season - Objeto Season completo.
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

  // Si hay menos de 2 equipos, nadie puede jugar, todos descansan
  if (validTeamsIds.length < 2) {
    const restingTeamsDocs = validTeams.map(team => ({
      teamId: team._id
    }))
    return { newMatchesDocs: [], newRestingTeamsDocs: restingTeamsDocs }
  }

  // Filtrar partidos no válidos y crear set de emparejamientos ya jugados
  const filteredMatchesDocs = Array.isArray(matchesDocs) ? matchesDocs.filter(Boolean) : []
  const alreadyPlayed = new Set()
  
  for (const matchDoc of filteredMatchesDocs) {
    if (!matchDoc) continue
    let teamAId = matchDoc.teamAId?._id || matchDoc.teamAId
    let teamBId = matchDoc.teamBId?._id || matchDoc.teamBId

    if (!teamAId || !teamBId) continue
    const key = [teamAId.toString(), teamBId.toString()].sort().join('-')
    alreadyPlayed.add(key)
  }

  // Priorizar equipos basado en su historial de descansos
  const prioritizedTeamsIds = prioritizeTeamsByRestHistory({
    validTeamsIds, 
    season, 
    divisionId: division.divisionId,
    currentRoundIndex: nextRoundIndex
  })

  const usedThisRound = new Set()
  const newMatchesDocs = []
  const newRestingTeamsDocs = []

  // Emparejar equipos disponibles, priorizando los que más han descansado
  for (const teamAId of prioritizedTeamsIds) {
    if (usedThisRound.has(teamAId)) continue

    const availableOpponents = prioritizedTeamsIds.filter(id => 
      !usedThisRound.has(id) && id !== teamAId
    )

    const teamBId = findBestOpponent({
      teamAId, 
      availableOpponents, 
      alreadyPlayed, 
      season, 
      divisionId: division.divisionId,
      currentRoundIndex: nextRoundIndex
    })

    if (teamBId) {
      // Emparejamiento válido encontrado
      const sets = await generateRandomSets()
      const teamADoc = validTeams.find(t => t._id.toString() === teamAId)
      const teamBDoc = validTeams.find(t => t._id.toString() === teamBId)

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
      usedThisRound.add(teamAId)
      usedThisRound.add(teamBId)

      const key = [teamAId, teamBId].sort().join('-')
      alreadyPlayed.add(key)
    }
  }

  // Equipos que no se emparejaron descansan
  for (const teamId of prioritizedTeamsIds) {
    if (!usedThisRound.has(teamId)) {
      const teamDoc = validTeams.find(t => t._id.toString() === teamId)
      
      newRestingTeamsDocs.push({
        teamId: teamDoc._id
      })
    }
  }

  console.log(`Ronda ${nextRoundIndex}: ${newMatchesDocs.length} partidos, ${newRestingTeamsDocs.length} equipos descansan`)

  return { newMatchesDocs, newRestingTeamsDocs }
}

module.exports = { generateMatchmaking }