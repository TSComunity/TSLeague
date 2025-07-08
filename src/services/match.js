const Season = require('../Esquemas/Season')
const Match = require('../Esquemas/Match')
const Team = require('../Esquemas/Team')

const { sendTeamDM } = require('../discord/send/team.js')
const { getMatchCancelledEmbed } = require('../discord/embeds/match.js')

const { getNextDayAndHour } = require('../utils/getNextDayAndHour.js')

const { match } = require('../configs/league.js')
const { defaultStartDay, defaultStartHour } = match

/**
 * Crea una instancia de partido (Match) sin guardarla.
 * @param {ObjectId} seasonId - ID de la temporada
 * @param {ObjectId} divisionId - ID de la division
 * @param {Number} roundIndex - Numero de la ronda
 * @param {ObjectId} teamAId - ID del equipo A
 * @param {ObjectId} teamBId - ID del equipo B
 * @returns {Match} Instancia de partido (sin guardar)
 */
const createMatchInstance = async ({ seasonId, divisionId, roundIndex, teamAId, teamBId  }) => {
  const lastIndex = await Match.countDocuments()
  const matchIndex = lastIndex + 1
  
  const match = new Match({
    matchIndex,
    seasonId,
    divisionId,
    roundIndex,
    teamAId,
    teamBId,
    scoreA: 0,
    scoreB: 0,
    scheduledAt: getNextDayAndHour(defaultStartDay, defaultStartHour),
    status: 'scheduled',
    set1: { winner: null },
    set2: { winner: null },
    set3: { winner: null },
    imageURL: null
  })

  return match
}

const findMatchByNamesAndSeason = async ({ seasonIndex, teamAName, teamBName }) => {
  const season = await Season.findOne({ seasonIndex })
  if (!season) throw new Error('Temporada no encontrada')

  const teamA = await Team.findOne({ name: teamAName })
  const teamB = await Team.findOne({ name: teamBName })
  if (!teamA || !teamB) throw new Error('Algún equipo no existe')

  const match = await Match.findOne({
    seasonId: season._id,
    $or: [
      { teamAId: teamA._id, teamBId: teamB._id },
      { teamAId: teamB._id, teamBId: teamA._id }
    ]
  }).populate({
      path: 'teamAId',
      populate: { path: 'members.userId' }
    })
    .populate({
      path: 'teamBId',
      populate: { path: 'members.userId' }
    })
    .populate('seasonId divisionId')

  if (!match) throw new Error('Partido no encontrado')

  return match
}

/**
 * Busca y devuelve un partido poblado y con sets enriquecidos con modo y mapa.
 * @param {Number} seasonIndex
 * @param {String} teamAName
 * @param {String} teamBName
 * @returns {Promise<Object|null>} Partido con sets enriquecidos
 */
const getMatchInfo = async ({ seasonIndex, teamAName, teamBName }) => {
  const match = await findMatchByNamesAndSeason({ seasonIndex, teamAName, teamBName })
  if (!match) return null

  // 4. Busca la división y ronda de la Season donde está el partido
  const division = season.divisions.find(d =>
    d.divisionId.toString() === (match.divisionId._id || match.divisionId).toString()
  )
  if (!division) throw new Error('División no encontrada en la temporada.')

  const round = division.rounds.find(r =>
    r.roundIndex === match.roundIndex
  )
  if (!round) throw new Error('Ronda no encontrada en la división.')

  // 5. Crea el objeto de sets enriquecidos
  const sets = [1, 2, 3].map(i => ({
    ...match[`set${i}`]?._doc, // Para obtener los datos del subdocumento Mongoose
    mode: round[`set${i}`]?.mode,
    map: round[`set${i}`]?.map
  }))

  // 6. Devuelve el partido poblado y con sets enriquecidos
  return {
    ...match._doc,
    teamA: match.teamAId,
    teamB: match.teamBId,
    season: match.seasonId,
    division: match.divisionId,
    sets
  }
}

/**
 * Cancela un partido (status = "cancelled")
 */
const cancelMatch = async ({ match, reason = 'Partido cancelado', removeTeamId = null }) => {
  // Si se quiere remover a un equipo del match
  if (removeTeamId) {
    if (match.teamAId?._id?.equals(removeTeamId)) match.teamAId = null
    if (match.teamBId?._id?.equals(removeTeamId)) match.teamBId = null
  }

  match.status = 'cancelled'
  match.reason = reason

  await match.save()

  // Enviar DM solo si quedan equipos válidos
  if (match.teamAId?.members) {
    await sendTeamDM({
      team: match.teamAId,
      embeds: [getMatchCancelledEmbed({ match })]
    })
  }

  if (match.teamBId?.members) {
    await sendTeamDM({
      team: match.teamBId,
      embeds: [getMatchCancelledEmbed({ match })]
    })
  }

  return match
}

/**
 * cambia la fecha de un partido
 */
const changeMatchScheduledAt = async ({ seasonIndex, teamAName, teamBName, day, hour }) => {
  const match = await findMatchByNamesAndSeason({ seasonIndex, teamAName, teamBName })

  match.scheduledAt = getNextDayAndHour({ day, hour })

  await match.save()
  return match
}

/**
 * Finaliza un partido (status = "played")
 */
const endMatch = async ({ seasonIndex, teamAName, teamBName }) => {
  const match = await findMatchByNamesAndSeason({ seasonIndex, teamAName, teamBName })

  match.status = 'played'

  // aqui la logica de ganador y eso
  await match.save()
  return match
}

module.exports = {
  createMatchInstance,
  findMatchByNamesAndSeason,
  getMatchInfo,
  cancelMatch,
  endMatch
}