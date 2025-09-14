const Season = require('../Esquemas/Season.js')
const Division = require('../Esquemas/Division.js')
const Team = require('../Esquemas/Team.js')
const ScheduledFunction = require('../Esquemas/ScheduledFunction.js')

const { calculatePromotionRelegation } = require('./division.js')
const { addScheduledFunction } = require('./scheduledFunction.js')

const { getActiveSeason } = require('../utils/season.js')

const { sendAnnouncement } = require('../discord/send/general.js')
const { getSeasonStartedEmbed, getSeasonEndedEmbed } = require('../discord/embeds/season.js')
const { getDivisionEndedEmbed } = require('../discord/embeds/division.js')

const { round, roles } = require('../configs/league.js')
const { startDay, startHour } = round

/**
 * Crea una nueva temporada con todas las divisiones existentes.
 * @returns {Object} season - La temporada creada.
 */
const startSeason = async ({ name, client }) => {
  // 1. Verifica que no haya una temporada activa
  const active = await Season.findOne({ status: 'active' });
  if (active) throw new Error('Ya hay una temporada activa.');

  // 2. Verifica que el nombre no esté repetido
  const repeatedName = await Season.findOne({ name });
  if (repeatedName) throw new Error('Ya existe una temporada con ese nombre.');

  // 3. Calcula el siguiente índice
  const lastSeason = await Season.findOne({}).sort({ seasonIndex: -1 }).lean();
  const nextIndex = lastSeason ? lastSeason.seasonIndex + 1 : 1;

  const existsIndex = await Season.findOne({ seasonIndex: nextIndex });
if (existsIndex) throw new Error(`El seasonIndex ${nextIndex} ya existe. Intenta de nuevo.`);

  // 4. Obtiene las divisiones y equipos
  const divisions = await Division.find().sort({ tier: 1 });
  if (!divisions.length) throw new Error('No hay divisiones creadas.');

  // 5. Construye el array de divisiones para la temporada
  const divisionsArr = [];
  for (const division of divisions) {
    // Equipos que pertenecen a esta división
    const teams = await Team.find({ divisionId: division._id });
    const divisionTeamsArr = teams.map(team => ({
      teamId: team._id,
      points: 0
    }));

    divisionsArr.push({
      divisionId: division._id,
      status: 'active',
      teams: divisionTeamsArr,
      rounds: []
    });
  }

  // Crear la nueva temporada con las divisiones completas
  const season = new Season({
    seasonIndex: nextIndex,
    name,
    startDate: new Date(),
    status: 'active',
    divisions: divisionsArr
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

  // Marcar todas las divisiones como terminadas
  for (const division of season.divisions) {
    division.status = 'ended'
  }

  // Calcula y aplica ascensos/descensos
  const promotionData = await calculatePromotionRelegation({ season })

  await sendAnnouncement({
    client,
    content: `<@&${roles.ping.id}>`,
    embeds: [getSeasonEndedEmbed({ season })]
  })

  // Envía embed por división
  for (const divisionData of promotionData) {
    const division = season.divisions.find(d => d.divisionId.toString() === divisionData.divisionId.toString())
    const container = getDivisionEndedEmbed({
      division,
      promoted: divisionData.promoted,
      relegated: divisionData.relegated,
      stayed: divisionData.stayed,
      expelled: divisionData.expelled
    })
    await sendAnnouncement({ client, components: [container], isComponentsV2: true })
  }

  await season.save()
  await ScheduledFunction.deleteMany({ functionName: 'addRound' })

  return season
}

// se podria hacer algo para pausar la temporada (mantenimiento)

module.exports = { startSeason, endSeason }