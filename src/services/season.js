const Season = require('../../Esquemas/Season.js')
const Division = require('../../Esquemas/Division.js')
const Team = require('../../Esquemas/Team.js')

const { getNextDayAndHour } = require('../utils/getNextDayAndHour.js')

const { season } = require('../../configs/league.js')
const { startDay, startHour } = season

/**
 * Crea una nueva temporada con todas las divisiones existentes.
 * @returns {Object} newSeason - La temporada creada.
 */

const createSeason = async () => {
  // Desactivar temporadas activas previas
  await Season.updateMany({ active: true }, { $set: { active: false } })

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
      const teamsStats = teams.map(team => ({
        team: team._id,
        points: 0,
        playedGames: 0
      }))

      return {
        division: div._id,
        teams: teamsStats,
        rounds: []
      }
    })
  )

  // Crear la nueva temporada con las divisiones completas
  const newSeason = new Season({
    seasonIndex: newIndex,
    startDate: getNextDayAndHour({ day: startDay, hour: startHour }),
    active: true,
    divisions: divisionsData
  })

  await newSeason.save()
  return newSeason
}

/**
 * Termina una temporada (solo si esta activa).
 * @returns {Object} season - La temporada terminada.
 */

const endSeason = async (season) => {
  if (!season || !season._id) {
    throw new Error('❌ Temporada no válida para finalizar')
  }

  if (!season.active) {
    throw new Error(`⚠️ La temporada ${season.seasonIndex} ya está finalizada`)
  }

  season.active = false
  season.endDate = new Date() 

  await season.save()
  return season
}

module.exports = { createSeason, endSeason }