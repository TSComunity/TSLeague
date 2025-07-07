const Season = require('../Esquemas/Season.js')
const Match = require('../Esquemas/Match.js')
const Team = require('../Esquemas/Team.js')

const { generateMatchmaking } = require('./matchmaking.js')
const { generateRandomSets } = require('./sets.js')
const { getActiveSeason, endSeason } = require('./season.js')

const { sendAnnouncement } = require('../discord/send.js')
const { getRoundAddedEmbeds } = require('../discord/embeds/round.js')
const { getSeasonDivisionEndedEmbeds } = require('../discord/embeds/season.js')

const { season } = require('../configs/league.js')
const { maxRounds } = season


/**
 * Procesa una división dentro de una temporada para generar una nueva ronda o marcarla como finalizada.
 * Si no hay emparejamientos posibles, marca la división como finalizada.
 * @param {Object} division - Objeto división del documento de temporada (poblado)
 * @param {ObjectId} seasonId - ID de la temporada activa
 * @returns {Promise<Object>} Objeto con información sobre si se generó ronda o se terminó la división
 */

const processDivision = async ({ division, seasonId, isSeasonEnding }) => {
  const { divisionId: divisionDoc, status, teams, rounds } = division

  // La termporadas ya esta terminada
  if (status === 'ended') {
    return { ended: true, divisionDoc }
  }

  if (rounds.length >= maxRounds) {
    division.status = 'ended'

    if (!isSeasonEnding) {
      // Se envia cuando se llega al limite de rondas en una division pero no en todas
      await sendAnnouncement({
        content: '@everyone',
        embeds: getSeasonDivisionEndedEmbeds({ division }),
      })
    }

    return { ended: true, divisionDoc }
  }


  // Extraer partidos anteriores y equipos poblados directamente
  const matchesDocs = rounds.flatMap((round) =>
    round.matches.map((match) => match.matchId)
  )

  const teamsDocs = teams.map((team) => team.teamId)

  const nextRoundIndex = rounds.length + 1

  const { newMatchesDocs, newRestingTeamsDocs } = generateMatchmaking({
    matchesDocs,
    teamsDocs,
    seasonId,
    divisionId: division._id,
    nextRoundIndex
  })

  // Si no se han podido generar partidos, termina la división
  if (newMatchesDocs.length === 0) {
    division.status = 'ended'

    if (!isSeasonEnding) {
      // Se envia cuando termina esta division pero no todas
      await sendAnnouncement({
        content: '@everyone',
        embeds: getSeasonDivisionEndedEmbeds({ division }),
      })
    }

    return { ended: true, divisionDoc }
  }

  // Insertar nuevos partidos y sets aleatorios
  const savedMatches = await Match.insertMany(newMatchesDocs)
  const { set1, set2, set3 } = await generateRandomSets()

  // Crear y añadir nueva ronda a la división
  const newRound = {
    roundIndex: nextRoundIndex,
    set1,
    set2,
    set3,
    matches: savedMatches.map((match) => match._id),
    resting: newRestingTeamsDocs.map((team) => team._id),
  }

  division.rounds.push(newRound)

  return {
    ended: false,
    divisionDoc,
    newMatchesDocs,
    newRestingTeamsDocs,
    roundIndex: nextRoundIndex
  }
}

/**
 * Añade una nueva ronda a todas las divisiones activas de la temporada activa.
 * Si todas las divisiones terminan, finaliza la temporada.
 * También envía anuncios según lo que ocurra.
 * @returns {Promise<Object>} Documento actualizado de la temporada
 */

const addRound = async () => {
  const season = await getActiveSeason()
  const seasonId = season._id
  const seasonIndex = season.seasonIndex

  const divisionsSkipped = []
  const divisionsWithNewRounds = []

  for (const division of season.divisions) {

    const activeDivisions = season.divisions.filter(d => d.status !== 'ended')
    const isSeasonEnding = activeDivisions.every(d => d.rounds.length >= maxRounds)

    const result = await processDivision({ division, seasonId, isSeasonEnding })

    if (result.ended) {
      divisionsSkipped.push({ divisionDoc: result.divisionDoc })
    } else {
      divisionsWithNewRounds.push({
        divisionDoc: result.divisionDoc,
        newMatchesDocs: result.newMatchesDocs,
        newRestingTeamsDocs: result.newRestingTeamsDocs,
        roundIndex: result.roundIndex,
      })
    }
  }

  await season.save()

  if (divisionsSkipped.length === season.divisions.length) {
    return endSeason()
  }

  const latestRoundIndex = Math.max(
    ...divisionsWithNewRounds.map((d) => d.roundIndex)
  )

  await sendAnnouncement({
    content: '@everyone',
    embeds: getRoundAddedEmbeds({
      divisionsWithNewRounds,
      seasonIndex,
      nextRoundIndex: latestRoundIndex
    }),
  })

  return season
}