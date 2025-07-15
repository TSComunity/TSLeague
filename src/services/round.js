const { getActiveSeason, endSeason } = require('./season.js')
const { generateMatchmaking } = require('./matchmaking.js')
const { generateRandomSets } = require('./sets.js')
const { addScheduledFunction } = require('./scheduledFunction.js')

const { sendAnnouncement } = require('../discord/send/general.js')
const { getRoundAddedEmbed, getRoundDivisionAddedEmbed } = require('../discord/embeds/round.js')
const { getDivisionEndedEmbed } = require('../discord/embeds/division.js')

const { season, round, roles } = require('../configs/league.js')
const { maxRounds } = season
const { startDay, startHour } = round


const getCurrentRoundNumber = ({ season }) => {
  const roundCounts = season.divisions.map(div => div.rounds?.length || 0)

  if (!roundCounts.length) return 0 // No hay divisiones

  return Math.max(...roundCounts)
}

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

  if (rounds.length >= maxRounds) {
    division.status = 'ended'

    if (!isSeasonEnding) {
      client,
      // Se envia cuando se llega al limite de rondas en una division pero no en todas
      await sendAnnouncement({
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

  const teamsDocs = teams

  const indices = division.rounds.map(r => r.roundIndex || 0)
  const nextRoundIndex = (indices.length ? Math.max(...indices) : 0) + 1

  const { newMatchesDocs, newRestingTeamsDocs } = generateMatchmaking({
    client,
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
      client,
      // Se envia cuando termina esta division pero no todas
      await sendAnnouncement({
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
const addRound = async ({ client }) => {

  const season = await getActiveSeason()
  const seasonId = season._id
  const seasonIndex = season.seasonIndex
  const seasonName = season.name

  const divisionsSkipped = []
  const divisionsWithNewRounds = []

  for (const division of season.divisions) {

    const activeDivisions = season.divisions.filter(d => d.status !== 'ended')
    const isSeasonEnding = activeDivisions.every(d => d.rounds.length >= maxRounds)

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

  if (divisionsSkipped.length === season.divisions.length) {
    return endSeason()
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
        seasonIndex,
        seasonName,
        nextRoundIndex: latestRoundIndex
      })
    ]
  })

  for (const division of divisionWithNewRounds) {
    await sendAnnouncement({
      client,
      embeds: [
        getRoundDivisionAddedEmbed({
          division,
          seasonIndex,
          seasonName,
          nextRoundIndex: latestRoundIndex
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

module.exports = { getCurrentRoundNumber, addRound }