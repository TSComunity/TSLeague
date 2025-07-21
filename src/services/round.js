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

const processDivision = async ({ division, seasonId, isSeasonEnding, client }) => {
  const { divisionId: divisionDoc, status, teams, rounds } = division

  // Si la división ya está terminada, NO procesar NI anunciar
  if (status === 'ended') return { ended: true, divisionDoc, alreadyEnded: true }

  if (rounds?.length >= maxRounds) {
    division.status = 'ended'
    if (!isSeasonEnding) {
      await sendAnnouncement({
        client,
        content: `<@&${roles.ping.id}>`,
        embeds: [getDivisionEndedEmbed({ division })]
      })
      console.log(`[DEBUG] Terminando división por maxRounds: ${division.divisionId.name} (status: ${division.status})`);
    }
    return { ended: true, divisionDoc, alreadyEnded: false }
  }

  // Poblar equipos correctamente
  const teamsDocs = await Promise.all(teams.map(async t => Team.findById(t.teamId)))
  console.log(`[DEBUG] Equipos en division ${division.divisionId.name}:`, teamsDocs.map(t => t.name));
  const indices = division.rounds?.map(r => r.roundIndex || 0)
  const nextRoundIndex = (indices?.length ? Math.max(...indices) : 0) + 1

  // Llamada asíncrona
  const { newMatchesDocs, newRestingTeamsDocs } = await generateMatchmaking({
    client,
    matchesDocs: rounds.flatMap((round) => round.matches.map((match) => match.matchId)),
    teamsDocs,
    seasonId,
    divisionId: division._id,
    nextRoundIndex
  })

  // Si no se han podido generar partidos, termina la división (solo una vez)
  if (!newMatchesDocs || newMatchesDocs.length === 0) {
    division.status = 'ended'
    if (!isSeasonEnding) {
      await sendAnnouncement({
        client,
        content: `<@&${roles.ping.id}>`,
        embeds: [getDivisionEndedEmbed({ division })]
      })
      console.log(`[DEBUG] Terminando división por no emparejar: ${division.divisionId.name} (status: ${division.status})`);
    }
    return { ended: true, divisionDoc, alreadyEnded: false }
  }

  const { set1, set2, set3 } = await generateRandomSets()
  const newRound = {
    roundIndex: nextRoundIndex,
    set1,
    set2,
    set3,
    matches: newMatchesDocs.map((match) => match._id),
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

const addRound = async ({ client }) => {
  const season = await getActiveSeason()
  const seasonId = season._id

  const divisionsSkipped = []
  const divisionsWithNewRounds = []

  for (const division of season.divisions) {
    // Solo procesar divisiones activas
    if (division.status === 'ended') {
      divisionsSkipped.push({ divisionDoc: division.divisionId })
      continue
    }

    const activeDivisions = season.divisions.filter(d => d.status !== 'ended')
    const isSeasonEnding = activeDivisions.every(d => d.rounds?.length >= maxRounds)

    const result = await processDivision({ division, seasonId, isSeasonEnding, client })

    if (result.ended) {
      // Solo pushear si la división acaba en este ciclo y no estaba ya terminada
      if (!result.alreadyEnded) divisionsSkipped.push({ divisionDoc: result.divisionDoc })
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

  // Si todas las divisiones han sido terminadas, termina la temporada
  if (divisionsSkipped.length === season.divisions.length) {
    await endSeason({ client })
    return season
  }

  // Anuncia la nueva jornada (embed general)
  if (divisionsWithNewRounds.length > 0) {
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

    // Anuncia los partidos de cada división nueva (embed por división)
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