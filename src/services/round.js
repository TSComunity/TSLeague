const Team = require('../Esquemas/Team.js')
const { generateMatchmaking } = require('./matchmaking.js')
const { addScheduledFunction } = require('./scheduledFunction.js')
const { endSeason } = require('./season.js')
const { getActiveSeason } = require('../utils/season.js')
const { sendAnnouncement } = require('../discord/send/general.js')
const { getRoundAddedEmbed } = require('../discord/embeds/round.js')
const { getDivisionEndedEmbed, getDivisionRoundAddedEmbed } = require('../discord/embeds/division.js')

const { season, round, roles } = require('../configs/league.js')
const { maxRounds } = season
const { startDay, startHour } = round

const addRound = async ({ client }) => {
  let season = await getActiveSeason()

  const divisionsSkipped = []
  const divisionsWithNewRounds = []

  // Procesar todas las divisiones
  for (const division of season.divisions) {
    const { divisionId, status, teams, rounds } = division

    // Estado previo para etiquetas
    const wasEnded = status === 'ended'
    const roundsBefore = rounds?.length || 0

    let endedJustNow = false
    let alreadyEnded = false
    let newMatchesDocs = []
    let newRestingTeamsDocs = []
    let nextRoundIndex = roundsBefore + 1

    // Si la división ya estaba terminada
    if (wasEnded) {
      alreadyEnded = true
      endedJustNow = false
      divisionsSkipped.push({ divisionDoc: divisionId, alreadyEnded, endedJustNow })
      continue
    }

    // Si ya llegó al máximo de rondas
    if (roundsBefore >= maxRounds) {
      division.status = 'ended'
      endedJustNow = true
      alreadyEnded = false
      divisionsSkipped.push({ divisionDoc: divisionId, alreadyEnded, endedJustNow })
      continue
    }

    const matchesDocs = rounds.flatMap(r => r.matches.map(m => m.matchId))
    const teamsDocs = teams.map(t => t.teamId);

    // Generar emparejamientos
    const matchmakingResult = await generateMatchmaking({
      client,
      matchesDocs,
      teamsDocs,
      season,
      division,
      nextRoundIndex
    })

    newMatchesDocs = matchmakingResult.newMatchesDocs || []
    newRestingTeamsDocs = matchmakingResult.newRestingTeamsDocs || []
    console.log('newMatchesDocs', newMatchesDocs)
    console.log('newRestingTeamsDocs', newRestingTeamsDocs)
    // Si no hay partidos posibles, terminar la división
    if (!newMatchesDocs.length) {
      division.status = 'ended'
      endedJustNow = true
      alreadyEnded = false
      divisionsSkipped.push({ divisionDoc: divisionId, alreadyEnded, endedJustNow })
      continue
    }

    const newRound = {
      roundIndex: nextRoundIndex,
      matches: newMatchesDocs.map((match) => ({ matchId: match._id })),
      resting: newRestingTeamsDocs.map((team) => ({ teamId: team._id }))
    }

    division.rounds.push(newRound)

    // Añadir a divisiones con nueva ronda
    divisionsWithNewRounds.push({
      divisionDoc: divisionId,
      newMatchesDocs,
      newRestingTeamsDocs,
      roundIndex: nextRoundIndex,
      alreadyEnded: false,
      endedJustNow: false
    })
  }

  await season.save()
  season = await getActiveSeason()
  console.log('season')
  console.log(JSON.stringify(season, null, 2));

  // Si todas las divisiones están terminadas, termina la temporada
  if (divisionsSkipped.length === season.divisions.length) {
    await endSeason({ client })
    return season
  }

  // 1. Ordena las divisiones por tier
  const orderedDivisions = [...season.divisions].sort((a, b) => a.divisionId.tier - b.divisionId.tier)

  // 2. Si hay al menos una con nueva ronda, envía embed general
  if (divisionsWithNewRounds.length > 0) {
    const latestRoundIndex = Math.max(
      ...divisionsWithNewRounds.map((d) => d.roundIndex)
    )

    await sendAnnouncement({
      client,
      content: `<@&${roles.ping.id}>`,
      embeds: [
        getRoundAddedEmbed({ divisionsWithNewRounds, season, nextRoundIndex: latestRoundIndex })
      ]
    })
  }

  // 3. Por cada división en orden por tier
  for (const division of orderedDivisions) {
    const divisionId = division.divisionId

    // Si terminó justo ahora, embed de fin de división
    const ended = divisionsSkipped.find(d => String(d.divisionDoc._id) === String(divisionId._id) && d.endedJustNow)
    if (ended) {
      await sendAnnouncement({
        client,
        embeds: [getDivisionEndedEmbed({ division })]
      })
      continue
    }
    
    const hasRounds = divisionsWithNewRounds.find(d => String(d.divisionDoc._id) === String(divisionId._id))
    if (hasRounds) {
    await sendAnnouncement({
      client,
      embeds: [getDivisionRoundAddedEmbed({ division, season })]
    })
    continue
    }
  }

  // Programar la función para la siguiente ronda
  await addScheduledFunction({
    functionName: 'addRound',
    day: startDay,
    hour: startHour
  })

  return season
}

module.exports = { addRound }