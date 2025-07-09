const Season = require('../Esquemas/Season.js')
const Division = require('../Esquemas/Division.js')
const Team = require('../Esquemas/Team.js')

const { sendAnnouncement } = require('../discord/send/general.js')
const { getSeasonCreatedEmbed, getSeasonEndedEmbed, getSeasonSummaryEmbed } = require('../discord/embeds/season.js')
const { getDivisionRankingEmbed } = require('../discord/embeds/division.js')

const { round } = require('../configs/league.js')
const { startDay, startHour } = round

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

  if (!season) throw new Error('No se ha encontrado ninguna temporada finalizada.')
  return season
}

/**
 * Crea una nueva temporada con todas las divisiones existentes.
 * @returns {Object} season - La temporada creada.
 */
const createSeason = async ({ name }) => {
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
    content: '@everyone',
    embeds: [getSeasonCreatedEmbed({ season })]
  })

  await addScheduledFunction({
      functionName: 'addRound',
      day: startDay,
      hour: startHour
  })

  return season
}

/**
 * Termina una temporada (solo si esta activa).
 * @returns {Object} season - La temporada terminada.
 */
const endSeason = async () => {
  const season = await getActiveSeason()

  season.status = 'ended'
  season.endDate = new Date() 

  for (const division of season.divisions) {
    division.status = 'ended'
  }

  await season.save()

  await sendAnnouncement({
    content: '@everyone',
    embeds: [getSeasonEndedEmbed({ season })]
  })

  return season
}

const updateRankingsEmbed = async () => {
  let season
  try {
    season = await getActiveSeason()
  } catch {
    season = await getLastSeason()
  }

  if (!season) {
    throw new Error('No hay temporadas activas ni pasadas.')
  }

  const channel = await client.channels.fetch('ID_DEL_CANAL_CLASIFICACIONES')
  if (!channel || !channel.isTextBased()) {
    throw new Error('Canal no encontrado o no es de texto.')
  }

  const message1 = await channel.messages.fetch('ID_MENSAJE_1')
  if (!message1) {
    throw new Error('Mensaje 1 no encontrado.')
  }

  const message2 = await channel.messages.fetch('ID_MENSAJE_2')
  if (!message1) {
    throw new Error('Mensaje 2 no encontrado.')
  }

  await message1.edit({
    embeds: [getSeasonSummaryEmbed({ season })]
  })

  if (!season.divisions) {
    throw new Error('No se han encontrado divisiones.')
  }

  let divisionsEmbeds = []

  for (const division of season.divisions) {
    divisionsEmbeds.push(getDivisionRankingEmbed({ division }))
  }

  await message2.edit({
    embeds: divisionsEmbeds
  })
}

// se podria hacer algo para pausar la temporada (mantenimiento)

module.exports = { getActiveSeason, getLastSeason, createSeason, endSeason, updateRankingsEmbed }