const Match = require('../Esquemas/Match.js')

const { getNextDayAndHour } = require('../utils/getNextDayAndHour.js')
const { match } = require('../configs/league.js')
const { defaultStartDay, defaultStartHour } = match

/**
 * Crea una instancia de partido (Match) sin guardarla.
 * @param {Object} params
 * @param {ObjectId} seasonId - ID de la temporada
 * @param {ObjectId} divisionId - ID de la division
 * @param {Number} roundIndex - Numero de la ronda
 * @param {ObjectId} teamAId - ID del equipo A
 * @param {ObjectId} teamBId - ID del equipo B
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

// dpendiendo de como vamos a verificar quien gana crear funciones para q actualizen eso

// luego funciones como para ponerlo en status cancelled o played o igual cambiar equipo, cosas asi

module.exports = { createMatch }