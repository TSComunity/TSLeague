const Season = require('../models/Season.js')
const Match = require('../models/Match.js')
const Team = require('../models/Team.js')

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
  })
    .populate({
      path: 'teamAId',
      populate: { path: 'members.userId' }
    })
    .populate({
      path: 'teamBId',
      populate: { path: 'members.userId' }
    })
    .populate('seasonId divisionId starPlayerId')
    .populate({
      path: 'sets.winner',
      model: 'Team'
    })
    .populate({
      path: 'sets.starPlayerId',
      model: 'User'
    })

  if (!match) throw new Error('Partido no encontrado.')

  return match
}

const findMatchByIndex = async ({ matchIndex }) => {
  const match = await Match.findOne({ matchIndex })
    .populate({
      path: 'teamAId',
      populate: { path: 'members.userId' }
    })
    .populate({
      path: 'teamBId',
      populate: { path: 'members.userId' }
    })
    .populate('seasonId divisionId starPlayerId')
    .populate({
      path: 'sets.winner',
      model: 'Team'
    })
    .populate({
      path: 'sets.starPlayerId',
      model: 'User'
    })

  if (!match) throw new Error('Partido no encontrado.')

  return match
}

const findMatch = async ({ matchIndex, seasonIndex, teamAName, teamBName }) => {
  if (matchIndex != null) {
    return await findMatchByIndex({ matchIndex })
  } else if (seasonIndex != null && teamAName && teamBName) {
    return await findMatchByNamesAndSeason({ seasonIndex, teamAName, teamBName })
  } else {
    throw new Error('Debes proporcionar matchIndex o bien seasonIndex + teamAName + teamBName.')
  }
}

module.exports = { findMatch }