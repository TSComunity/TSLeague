const Team = require('../Esquemas/Team.js')

const { generateMatchmaking } = require('./matchmaking.js')
const { generateRandomSets } = require('./sets.js')
const { addScheduledFunction } = require('./scheduledFunction.js')

const { endSeason } = require('../services/season.js')
const { getActiveSeason } = require('../utils/season.js')

const { sendAnnouncement } = require('../discord/send/general.js')
const { getRoundAddedEmbed } = require('../discord/embeds/round.js')
const { getDivisionEndedEmbed, getDivisionRoundAddedEmbed } = require('../discord/embeds/division.js')

const { season, round, roles } = require('../configs/league.js')
const { maxRounds } = season
const { startDay, startHour } = round

/**
 * Procesa una división dentro de una temporada para generar una nueva ronda o marcarla como finalizada.
 * Si no hay emparejamientos posibles, marca la división como finalizada.
 * @param {Object} division - Objeto división del documento de temporada (poblado)
 * @param {ObjectId} seasonId - ID de la temporada activa
 * @returns {Promise<Object>} Objeto con información sobre si se generó ronda o se terminó la división
 */
const processDivision = async ({ division, seasonId, isSeasonEnding, client }) => {
  const { divisionId: divisionDoc, status, teams, rounds } = division

  // La termporadas ya esta terminada
  if (status === 'ended') {
    return { ended: true, divisionDoc }
  }

  if (rounds?.length >= maxRounds) {
    division.status = 'ended'

    if (!isSeasonEnding) {
      client,
      // Se envia cuando se llega al limite de rondas en una division pero no en todas
      await sendAnnouncement({
        client,
        content: `<@&${roles.ping.id}>`,
        embeds: [getDivisionEndedEmbed({ division })]
      })
    }

    return { ended: true, divisionDoc }
  }


  // Extraer partidos anteriores y equipos poblados directamente
  const matchesDocs = rounds.flatMap((round) =>
    round.matches.map((match) => match.matchId)
  )

  const teamsDocs = await Promise.all(teams.map(async t => {
    return await Team.findById(t.teamId)
  }))

  const indices = division.rounds?.map(r => r.roundIndex || 0)
  const nextRoundIndex = (indices?.length ? Math.max(...indices) : 0) + 1

  const { newMatchesDocs, newRestingTeamsDocs } = generateMatchmaking({
    client,
    matchesDocs,
    teamsDocs,
    seasonId,
    divisionId: division._id,
    nextRoundIndex
  })

  // Si no se han podido generar partidos, termina la división
  if (newMatchesDocs?.length === 0 || !newMatchesDocs || !newMatchesDocs?.length) {
    division.status = 'ended'

    if (!isSeasonEnding) {
      client,
      // Se envia cuando termina esta division pero no todas
      await sendAnnouncement({
        client,
        content: `<@&${roles.ping.id}>`,
        embeds: [getDivisionEndedEmbed({ division })]
      })
    }

    return { ended: true, divisionDoc }
  }

  const { set1, set2, set3 } = await generateRandomSets()

  // Crear y añadir nueva ronda a la división
  const newRound = {
    roundIndex: nextRoundIndex,
    set1,
    set2,
    set3,
    matches: newMatchesDocs?.map((match) => match._id),
    resting: newRestingTeamsDocs?.map((team) => team._id),
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
const addRound = async ({ client }) => {
  const season = await getActiveSeason()
  const seasonId = season._id

  const divisionsSkipped = []
  const divisionsWithNewRounds = []

  for (const division of season.divisions) {

    const activeDivisions = season.divisions.filter(d => d.status !== 'ended')
    const isSeasonEnding = activeDivisions.every(d => d.rounds?.length >= maxRounds)

    const result = await processDivision({ division, seasonId, isSeasonEnding, client })

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

  if (divisionsSkipped?.length === season.divisions.length) {
    return endSeason({ client })
  }

  const latestRoundIndex = Math.max(
    ...divisionsWithNewRounds.map((d) => d.roundIndex)
  )

  await sendAnnouncement({
    client,
    content: `<@&${roles.ping.id}>`,
    embeds: [
      getRoundAddedEmbed({
        divisionsWithNewRounds,
        season,
        nextRoundIndex: latestRoundIndex
      })
    ]
  })

  for (const division of divisionsWithNewRounds) {
    await sendAnnouncement({
      client,
      embeds: [
        getDivisionRoundAddedEmbed({
          division,
          season
        })
      ]
    })
  }

  await addScheduledFunction({
    functionName: 'addRound',
    day: startDay,
    hour: startHour
  })

  return season
}

module.exports = { addRound }