const Match = require('../Esquemas/Match.js')

const { getNextDayAndHour } = require('../utils/getNextDayAndHour.js')
const { match } = require('../configs/league.js')
const { defaultStartDay, defaultStartHour } = match

/**
 * Crea una instancia de partido (Match) sin guardarla.
 * @param {Object} params
 * @param {ObjectId} params.teamA - ID del equipo A
 * @param {ObjectId} params.teamB - ID del equipo B
 * @param {ObjectId} params.season - ID de la temporada
 * @param {ObjectId} params.division - ID de la división
 * @param {Number} params.roundIndex - Número de ronda
 * @returns {Match} Instancia de partido (sin guardar)
 */

const createMatch = ({ seasonId, divisionId, roundIndex, teamAId, teamBId  }) => {
  const match = new Match({
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

module.exports = { createMatch }