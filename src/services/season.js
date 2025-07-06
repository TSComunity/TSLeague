const Season = require('../../Esquemas/Season.js')
const Division = require('../../Esquemas/Division.js')
const Team = require('../../Esquemas/Team.js')

const { sendAnnouncement } = require('../discord/send.js')
const { getSeasonCreatedEmbeds, getSeasonEndedEmbeds } = require('../discord/embeds/season.js')

const { getNextDayAndHour } = require('../utils/getNextDayAndHour.js')

const { season } = require('../../configs/league.js')
const { startDay, startHour } = season

/**
 * Crea una nueva temporada con todas las divisiones existentes.
 * @returns {Object} season - La temporada creada.
 */

const createSeason = async () => {
  // Desactivar temporadas y divisiones activas previas
  await Season.updateMany(
    { status: 'active' }, // Condición: busca temporadas con status 'active'
    {
      $set: {
        status: 'ended', // Cambia el status de la temporada a 'ended'
        'divisions.$[].status': 'ended' // Cambia el status de TODAS las divisiones dentro de esas temporadas a 'ended'
      }
    }
  )

  // Obtener la temporada con mayor índice
  const lastSeason = await Season.findOne().sort({ seasonIndex: -1 }).exec()
  const newIndex = lastSeason ? lastSeason.seasonIndex + 1 : 1

  // Obtener todas las divisiones
  const divisions = await Division.find().select('_id')

  // Para cada división, obtener sus equipos y preparar la estructura
  const divisionsData = await Promise.all(
    divisions.map(async (div) => {
      // Equipos que pertenecen a esta división
      const teams = await Team.find({ division: div._id }).select('_id')
      const teamsStats = teams.map((team, index) => ({
        teamId: team._id,
        points: 0,
        rank: index + 1
      }))

      return {
        divisionId: div._id,
        status: 'active',
        teams: teamsStats,
        rounds: []
      }
    })
  )

  // Crear la nueva temporada con las divisiones completas
  const season = new Season({
    seasonIndex: newIndex,
    startDate: getNextDayAndHour({ day: startDay, hour: startHour }),
    active: true,
    divisions: divisionsData
  })

  await season.save()

  await sendAnnouncement({
    content: '@everyone',
    embeds: getSeasonCreatedEmbeds({ season })
  })

  return season
}

/**
 * Termina una temporada (solo si esta activa).
 * @returns {Object} season - La temporada terminada.
 */

const endSeason = async () => {
  const season = await Season.findOne({ status: 'active' })
    .populate([
      { path: 'divisions.divisionId' },
      { path: 'divisions.teams.teamId' },
      { path: 'divisions.rounds.matches.matchId' },
      { path: 'divisions.rounds.resting.teamId' }
    ])

  if (!season || !season._id) throw new Error('Temporada no válida para finalizar.')

  if (!season.active) throw new Error(`La temporada ${season.seasonIndex} ya está finalizada.`)

  season.status = 'ended'
  season.endDate = new Date() 

  for (const division of season.divisions) {
    division.status = 'ended'
  }

  await season.save()

  await sendAnnouncement({
    content: '@everyone',
    embeds: getSeasonEndedEmbeds({ season })
  })

  return season
}

module.exports = { createSeason, endSeason }