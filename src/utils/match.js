const Season = require('../Esquemas/Season.js')
const Match = require('../Esquemas/Match.js')
const Team = require('../Esquemas/Team.js')

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
    .populate('seasonId divisionId starPlayer')

  if (!match) throw new Error('Partido no encontrado.')

  return match
}

const findMatchByIndex = async ({ matchIndex }) => {

  const match = await Match.findOne({ matchIndex }).populate({
      path: 'teamAId',
      populate: { path: 'members.userId' }
    })
    .populate({
      path: 'teamBId',
      populate: { path: 'members.userId' }
    })
    .populate('seasonId divisionId starPlayer')

  if (!match) throw new Error('Partido no encontrado.')

  return match
}

const findMatch = async ({ matchIndex, seasonIndex, teamAName, teamBName }) => {
  let match

    if (matchIndex != null) {
      // Caso 1: Buscar por índice
      match = await findMatchByIndex({ matchIndex })
    } else if (seasonIndex != null && teamAName && teamBName) {
      // Caso 2: Buscar por season + nombres de equipos
      match = await findMatchByNamesAndSeason({ seasonIndex, teamAName, teamBName })
    } else {
      throw new Error('Debes proporcionar matchIndex o bien seasonIndex + teamAName + teamBName.')
    }
    
  return match
}

module.exports = { findMatch }