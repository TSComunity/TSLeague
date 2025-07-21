const Season = require('../Esquemas/Season.js')
/**
 * Obtiene la temporada activa de la base de datos con todos sus datos relacionados poblados.
 * Incluye divisiones, equipos, partidos y equipos en descanso.
 * @returns {Object} season - Documento de la temporada activa
 */
const getActiveSeason = async () => {
  const season = await Season.findOne({ status: 'active' })
    .populate('divisions.divisionId')
    .populate('divisions.teams.teamId')
    .populate({
      path: 'divisions.rounds.matches.matchId',
      populate: [
        { path: 'teamA', model: 'Team' },
        { path: 'teamB', model: 'Team' }
      ]
    })
    .populate('divisions.rounds.resting.teamId')

  if (!season) throw new Error('Ninguna temporada activa encontrada.')

  return season
}

/**
 * Obtiene la ultima temporda de la base de datos con todos sus datos relacionados poblados.
 * Incluye divisiones, equipos, partidos y equipos en descanso.
 * @returns {Object} season - Documento de la temporada activa
 */
const getLastSeason = async () => {
  const season = await Season.findOne({})
    .sort({ startDate: -1 })
    .populate('divisions.divisionId')
    .populate('divisions.teams.teamId')
    .populate({
      path: 'divisions.rounds.matches.matchId',
      populate: [
        { path: 'teamA', model: 'Team' },
        { path: 'teamB', model: 'Team' }
      ]
    })
    .populate('divisions.rounds.resting.teamId')

  if (!season) throw new Error('No se ha encontrado ninguna temporada.')
  return season
}

module.exports = { getActiveSeason, getLastSeason }