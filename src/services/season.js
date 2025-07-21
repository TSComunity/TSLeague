const Season = require('../Esquemas/Season.js')
const Division = require('../Esquemas/Division.js')
const Team = require('../Esquemas/Team.js')
const ScheduledFunction = require('../Esquemas/ScheduledFunction.js')

const { addScheduledFunction } = require('./scheduledFunction.js')

const { getActiveSeason } = require('../utils/season.js')

const { sendAnnouncement } = require('../discord/send/general.js')
const { getSeasonStartedEmbed, getSeasonEndedEmbed } = require('../discord/embeds/season.js')

const { round, roles } = require('../configs/league.js')
const { startDay, startHour } = round

/**
 * Crea una nueva temporada con todas las divisiones existentes.
 * @returns {Object} season - La temporada creada.
 */
const startSeason = async ({ name, client }) => {

  const checkedSeason = await Season.findOne({ status: 'active' })
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

  if (checkedSeason) {
    throw new Error('No se puede crear una temporada si ya hay una activa.')
  }

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

  if (!divisions.length) throw new Error('No existen divisiones activas para crear una temporada. Agrega divisiones primero.')

  // Para cada división, obtener sus equipos y preparar la estructura
  const divisionsData = await Promise.all(
    divisions.map(async (div) => {
      // Equipos que pertenecen a esta división
      const teams = await Team.find({ divisionId: div._id }).select('_id')
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
    name,
    startDate: new Date(),
    endDate: null,
    status: 'active',
    divisions: divisionsData
  })

  await season.save()

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
  console.log(startDay, startHour)

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

  for (const division of season.divisions) {
    division.status = 'ended'
  }

  await season.save()

  await ScheduledFunction.deleteMany({ functionName: 'addRound' })

  await sendAnnouncement({
    client,
    content: `<@&${roles.ping.id}>`,
    embeds: [getSeasonEndedEmbed({ season })]
  })

  return season
}



// se podria hacer algo para pausar la temporada (mantenimiento)

module.exports = { startSeason, endSeason }