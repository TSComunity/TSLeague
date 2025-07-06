const Match = require('../Esquemas/Match.js')

const { getNextDayAndHour } = require('../utils/getNextDayAndHour.js')

const { match } = require('../configs/league.js')
const { defaultStartDay, defaultStartHour } = match

/**
 * Devuelve información aleatoria para un partido.
 * @return {Object} matchData - Data del partido.
 */

const createMatch = async ({ seasonId, divisionId, roundIndex, idA, idB }) => {

    const match = new Match({
        seasonId,
        divisionId,
        roundIndex,
        teamAId: idA,
        teamBId: idB,
        scoreA: 0,
        scoreB: 0,
        scheduledAt: getNextDayAndHour(defaultStartDay, defaultStartHour),
        status: 'scheduled',
        imageURL,
        set1: null,
        set2: null,
        set3: null
    })

    await match.save()

    return match
}

module.exports = { createMatch }