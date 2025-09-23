const Season = require('../models/Season.js')
const Division = require('../models/Division.js')
const Team = require('../models/Team.js')
const User = require('../models/User.js')
const ScheduledFunction = require('../models/ScheduledFunction.js')

const { addScheduledFunction } = require('./scheduledFunction.js')

const { getActiveSeason } = require('../utils/season.js')

const { sendAnnouncement } = require('../discord/send/general.js')
const { getSeasonStartedEmbed, getSeasonEndedEmbed } = require('../discord/embeds/season.js')
const { getDivisionEndedEmbed } = require('../discord/embeds/division.js')

const { round, roles, division } = require('../configs/league.js')
const { startDay, startHour } = round
const { maxTeams } = division

const calculatePromotionRelegation = async ({ season, updateDb = true } = {}) => {
  if (!season || !Array.isArray(season.divisions)) {
    throw new Error("season inválido")
  }

  const calcPromotions = count => {
    if (count >= maxTeams) return 3
    if (count >= 10) return 2
    if (count >= 8) return 1
    return 0
  }

  const calcRelegations = count => {
    if (count >= maxTeams) return 3
    if (count >= 10) return 2
    if (count >= 8) return 1
    return 0
  }

  const allDivisions = [...season.divisions].sort(
    (a, b) => (a?.divisionId?.tier ?? 0) - (b?.divisionId?.tier ?? 0)
  )
  const n = allDivisions.length

  const teamsArr = allDivisions.map(d =>
    (d.teams || []).slice().sort((a, b) => (b.points || 0) - (a.points || 0))
  )
  const origCounts = teamsArr.map(a => a.length)

  let promotionsFrom = Array(n).fill(0)
  let relegationsFrom = Array(n).fill(0)

  for (let i = 1; i < n; i++) promotionsFrom[i] = calcPromotions(origCounts[i])
  for (let i = 0; i < n - 1; i++) relegationsFrom[i] = calcRelegations(origCounts[i])

  const adjustCounts = () => {
    const finalCounts = new Array(n).fill(0)
    for (let i = 0; i < n; i++) {
      const incomingFromBelow = (promotionsFrom[i + 1] || 0)
      const incomingFromAbove = (relegationsFrom[i - 1] || 0)
      finalCounts[i] =
        origCounts[i] -
        (promotionsFrom[i] || 0) -
        (relegationsFrom[i] || 0) +
        incomingFromBelow +
        incomingFromAbove
    }
    return finalCounts
  }

  for (let iter = 0; iter < 20; iter++) {
    const finalCounts = adjustCounts()
    let changed = false

    for (let i = 0; i < n; i++) {
      if (finalCounts[i] > maxTeams) {
        if (i < n - 1) {
          relegationsFrom[i]++
          changed = true
        }
      }
    }
    if (!changed) break
  }

  const finalCountsNow = adjustCounts()
  let expulsions = 0
  const lastIdx = n - 1
  if (finalCountsNow[lastIdx] > maxTeams) {
    expulsions = finalCountsNow[lastIdx] - maxTeams
  }

  const arrCopies = teamsArr.map(a => a.slice())
  const result = []

  for (let i = 0; i < n; i++) {
    const arr = arrCopies[i]

    const pCount = promotionsFrom[i] || 0
    const promotedTeams = arr.splice(0, Math.min(pCount, arr.length)).map(t => ({
      teamId: t.teamId,
      points: t.points
    }))

    const relegatedTeams = (i < n - 1 && relegationsFrom[i])
      ? arr.splice(arr.length - relegationsFrom[i], relegationsFrom[i]).map(t => ({
          teamId: t.teamId,
          points: t.points
        }))
      : []

    const expelledTeams = (i === lastIdx && expulsions > 0)
      ? arr.splice(arr.length - expulsions, expulsions).map(t => ({
          teamId: t.teamId,
          points: t.points
        }))
      : []

    let winnerTeams = []
    if (i === 0 && arr.length > 0) {
      const sortedArr = arr.slice().sort((a, b) => (b.points || 0) - (a.points || 0))
      const winnerTeam = sortedArr[0]
      if (winnerTeam) {
        winnerTeams.push({ teamId: winnerTeam.teamId, points: winnerTeam.points })
        const idx = arr.findIndex(t => t.teamId.toString() === winnerTeam.teamId.toString())
        if (idx > -1) arr.splice(idx, 1)
      }
    }

    const stayedTeams = arr.map(t => ({
      teamId: t.teamId,
      points: t.points
    }))

    result.push({
      divisionId: allDivisions[i].divisionId,
      promoted: promotedTeams,
      relegated: relegatedTeams,
      stayed: stayedTeams,
      expelled: expelledTeams,
      winner: winnerTeams
    })
  }

  if (!updateDb) return result

  // === actualizar DB solo si updateDb ===
  for (let i = 0; i < result.length; i++) {
    const r = result[i]
    const divisionId = r.divisionId

    const updateTeamsDivision = async (teams, newDivisionId) => {
      if (!teams.length) return
      for (const t of teams) {
        try {
          await Team.findByIdAndUpdate(t.teamId, { divisionId: newDivisionId })
        } catch (e) {
          console.error("Error actualizando división del team:", e)
        }
      }
    }

    if (r.promoted.length && i > 0) {
      await updateTeamsDivision(r.promoted, allDivisions[i - 1].divisionId)
    }
    if (r.relegated.length && i < n - 1) {
      await updateTeamsDivision(r.relegated, allDivisions[i + 1].divisionId)
    }
    if (r.expelled.length) {
      await updateTeamsDivision(r.expelled, null)
    }

    if (r.winner.length) {
      for (const t of r.winner) {
        try {
          await Team.findByIdAndUpdate(t.teamId, { $inc: { "stats.leaguesWon": 1 } })
          const teamDoc = await Team.findById(t.teamId).lean()
          if (teamDoc?.members) {
            for (const m of teamDoc.members) {
              try {
                await User.findByIdAndUpdate(m.userId, { $inc: { "leagueStats.leaguesWon": 1 } })
              } catch (err) {
                console.error("Error incrementando leagueStats de user:", err)
              }
            }
          }
        } catch (e) {
          console.error("Error procesando ganador:", e)
        }
      }
    }

    const setResult = async (ids, value) => {
      if (!ids.length) return
      try {
        const teamIds = ids.map(t => t.teamId)
        await Season.updateOne(
          { _id: season._id, "divisions.divisionId": divisionId },
          { $set: { "divisions.$.teams.$[t].result": value } },
          { arrayFilters: [{ "t.teamId": { $in: teamIds } }] }
        )
      } catch (err) {
        console.error(`Error guardando result=${value} en Season:`, err)
      }
    }

    await setResult(r.promoted, "promoted")
    await setResult(r.relegated, "relegated")
    await setResult(r.stayed, "stayed")
    await setResult(r.expelled, "expelled")
    await setResult(r.winner, "winner")
  }

  return result
}

/**
 * Crea una nueva temporada con todas las divisiones existentes.
 * @returns {Object} season - La temporada creada.
 */
const startSeason = async ({ name, client }) => {
  // 1. Verifica que no haya una temporada activa
  const active = await Season.findOne({ status: 'active' });
  if (active) throw new Error('Ya hay una temporada activa.');

  // 2. Verifica que el nombre no esté repetido
  const repeatedName = await Season.findOne({ name });
  if (repeatedName) throw new Error('Ya existe una temporada con ese nombre.');

  // 3. Calcula el siguiente índice
  const lastSeason = await Season.findOne({}).sort({ seasonIndex: -1 }).lean();
  const nextIndex = lastSeason ? lastSeason.seasonIndex + 1 : 1;

  const existsIndex = await Season.findOne({ seasonIndex: nextIndex });
if (existsIndex) throw new Error(`El seasonIndex ${nextIndex} ya existe. Intenta de nuevo.`);

  // 4. Obtiene las divisiones y equipos
  const divisions = await Division.find().sort({ tier: 1 });
  if (!divisions.length) throw new Error('No hay divisiones creadas.');

  // 5. Construye el array de divisiones para la temporada
  const divisionsArr = [];
  for (const division of divisions) {
    // Equipos que pertenecen a esta división
    const teams = await Team.find({ divisionId: division._id });
    const divisionTeamsArr = teams.map(team => ({
      teamId: team._id,
      points: 0
    }));

    divisionsArr.push({
      divisionId: division._id,
      status: 'active',
      teams: divisionTeamsArr,
      rounds: []
    });
  }

  // Crear la nueva temporada con las divisiones completas
  const season = new Season({
    seasonIndex: nextIndex,
    name,
    startDate: new Date(),
    status: 'active',
    divisions: divisionsArr
  })

  await season.save()
  await season.populate('divisions.divisionId')

  await sendAnnouncement({
    client,
    content: `<@&${roles.ping.id}>`,
    embeds: [getSeasonStartedEmbed({ season })]
  })

  await addScheduledFunction({
      functionName: 'addRound',
      day: startDay,
      hour: startHour
  })

  return season
}

/**
 * Termina una temporada (solo si esta activa).
 * @returns {Object} season - La temporada terminada.
 */
const endSeason = async ({ client }) => {
  const season = await getActiveSeason()

  season.status = 'ended'
  season.endDate = new Date()

  // Marcar todas las divisiones como terminadas
  for (const division of season.divisions) {
    division.status = 'ended'
  }

  // Calcula y aplica ascensos/descensos
  const promotionData = await calculatePromotionRelegation({ season })

  await sendAnnouncement({
    client,
    content: `<@&${roles.ping.id}>`,
    embeds: [getSeasonEndedEmbed({ season })]
  })

  // Envía embed por división
  for (const divisionData of promotionData) {
    const container = getDivisionEndedEmbed({
      division: divisionData,
      promoted: divisionData.promoted,
      relegated: divisionData.relegated,
      stayed: divisionData.stayed,
      expelled: divisionData.expelled,
      winner: divisionData.winner
    })
    await sendAnnouncement({ client, components: [container], isComponentsV2: true })
  }

  await season.save()
  await ScheduledFunction.deleteMany({ functionName: 'addRound' })

  return season
}

// se podria hacer algo para pausar la temporada (mantenimiento)

module.exports = { calculatePromotionRelegation, startSeason, endSeason }