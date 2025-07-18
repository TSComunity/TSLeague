const { ChannelType, PermissionsBitField } = require('discord.js')

const Season = require('../Esquemas/Season')
const Match = require('../Esquemas/Match')
const Team = require('../Esquemas/Team')

const { getMatchCancelledEmbed } = require('../discord/embeds/match.js')

const { getNextDayAndHour } = require('../utils/getNextDayAndHour.js')

const { guild, categories, channels, match } = require('../configs/league.js')
const { defaultStartDay, defaultStartHour } = match

/**
 * Crea un canal de Discord para un partido.
 * 
 * @param {Object} match - El documento del partido ya guardado en Mongo.
 * @param {Client} client - El cliente de Discord.
 */
const createMatchChannel = async ({ match, client }) => {
  try {
    const teamA = await Team.findById(match.teamAId)
    const teamB = await Team.findById(match.teamBId)

    if (!teamA || !teamB) {
      throw new Error('No se encontraron los equipos del partido')
    }

    // Extraer los IDs de los líderes (supongamos que en members hay un campo role y userId)
    // Ajusta según tu esquema
    const leaderA = teamA.members.find(m => m.role === 'leader')?.userId
    const leaderB = teamB.members.find(m => m.role === 'leader')?.userId

    const channelName = `「🎮」partido-${match.matchIndex}`
    const guildToUse = await client.guilds.fetch(guild.id)
    const categoryId = categories.matches.id

    // Construimos permisos:
    // - everyone: no ver
    // - líderes: enviar mensajes, multimedia, enlaces, reacciones, leer mensajes
    // - miembros normales: solo ver, leer mensajes y añadir reacciones (no enviar)
    // - roles de mod: gestionar mensajes completo

    // Roles de mod desde configuración
    const modRoleIds = channels.perms

    // Para miembros normales, todos los miembros de ambos equipos menos los líderes
    const normalMembersA = teamA.members
      .filter(m => m.role !== 'leader')
      .map(m => m.userId)

    const normalMembersB = teamB.members
      .filter(m => m.role !== 'leader')
      .map(m => m.userId)

    // Define los permisos para líderes (permisos más amplios)
    const leaderPermissions = [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.SendMessagesInThreads,
      PermissionsBitField.Flags.EmbedLinks,
      PermissionsBitField.Flags.AttachFiles,
      PermissionsBitField.Flags.ReadMessageHistory,
      PermissionsBitField.Flags.AddReactions,
      PermissionsBitField.Flags.UseExternalEmojis,
      PermissionsBitField.Flags.UseExternalStickers,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.Speak,
      PermissionsBitField.Flags.Stream,
      PermissionsBitField.Flags.UseApplicationCommands,
      PermissionsBitField.Flags.MentionEveryone
    ]

    // Permisos para miembros normales (solo ver, leer, añadir reacciones)
    const normalPermissions = [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.ReadMessageHistory,
      PermissionsBitField.Flags.AddReactions,
      PermissionsBitField.Flags.UseExternalEmojis,
      PermissionsBitField.Flags.UseExternalStickers
    ]

    // Permisos para moderadores
    const modPermissions = [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.MentionEveryone,
      PermissionsBitField.Flags.ManageChannels,
      PermissionsBitField.Flags.ReadMessageHistory
    ]

    // Construimos los permissionOverwrites
    const permissionOverwrites = [
      {
        id: guildToUse.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      // Líderes de equipo (permisos completos para interactuar)
      ...(leaderA ? [{
        id: leaderA,
        allow: leaderPermissions
      }] : []),
      ...(leaderB && leaderB !== leaderA ? [{
        id: leaderB,
        allow: leaderPermissions
      }] : []),

      // Miembros normales (sin enviar mensajes)
      ...normalMembersA.map(userId => ({
        id: userId,
        allow: normalPermissions,
        deny: [PermissionsBitField.Flags.SendMessages]
      })),
      ...normalMembersB.map(userId => ({
        id: userId,
        allow: normalPermissions,
        deny: [PermissionsBitField.Flags.SendMessages]
      })),

      // Roles de moderación (permisos elevados)
      ...modRoleIds.map(roleId => ({
        id: roleId,
        allow: modPermissions
      }))
    ]

    const channel = await guildToUse.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: categoryId,
      permissionOverwrites
    })

    match.channelId = channel.id
    await match.save()

    await channel.send(`📢 ¡Bienvenidos al partido entre **${teamA.name}** y **${teamB.name}**! Ronda ${match.roundIndex + 1}. ¡Buena suerte!`)

    return match
  } catch (error) {
    console.error('Error al crear canal del partido:', error)
    throw error
  }
}

/**
 * Crea una instancia de partido (Match) sin guardarla.
 * @param {ObjectId} seasonId - ID de la temporada
 * @param {ObjectId} divisionId - ID de la division
 * @param {Number} roundIndex - Numero de la ronda
 * @param {ObjectId} teamAId - ID del equipo A
 * @param {ObjectId} teamBId - ID del equipo B
 * @returns {Match} Instancia de partido (sin guardar)
 */
const createMatch = async ({ client, seasonId, divisionId, roundIndex, teamAId, teamBId }) => {
  // Calcular matchIndex según los partidos existentes en la división y ronda
  const existingMatchesCount = await Match.countDocuments()

  const matchIndex = existingMatchesCount + 1 // siguiente índice

  // Crear el partido
  let match
  try {
    match = await Match.create({
      matchIndex,
      roundIndex,
      seasonId,
      divisionId,
      teamAId,
      teamBId,
      scoreA: 0,
      scoreB: 0,
      scheduledAt: getNextDayAndHour({ day: defaultStartDay, hour: defaultStartHour }),
      status: 'scheduled',
      set1: { winner: null },
      set2: { winner: null },
      set3: { winner: null },
      imageURL: null
    })

    // Crear canal de Discord y actualizar el match con channelId
    const updatedMatch = await createMatchChannel({ match, client })

    return updatedMatch
  } catch (error) {
    // Si hubo error y ya se creó el match, borrarlo para no dejar basura
    if (match && match._id) {
      await Match.findByIdAndDelete(match._id)
    }
    throw error
  }
}

const createMatchMannualy = async ({ client, teamAId, teamBId }) => {
  // Calcular matchIndex según los partidos existentes en la división y ronda
  const existingMatchesCount = await Match.countDocuments()

  const matchIndex = existingMatchesCount + 1 // siguiente índice

  // Crear el partido
  let match
  try {
    match = await Match.create({
      matchIndex,
      roundIndex,
      seasonId,
      divisionId,
      teamAId,
      teamBId,
      scoreA: 0,
      scoreB: 0,
      scheduledAt: getNextDayAndHour({ day: defaultStartDay, hour: defaultStartHour }),
      status: 'scheduled',
      set1: { winner: null },
      set2: { winner: null },
      set3: { winner: null },
      imageURL: null
    })

    // Crear canal de Discord y actualizar el match con channelId
    const updatedMatch = await createMatchChannel({ match, client })

    return updatedMatch
  } catch (error) {
    // Si hubo error y ya se creó el match, borrarlo para no dejar basura
    if (match && match._id) {
      await Match.findByIdAndDelete(match._id)
    }
    throw error
  }
}

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
    .populate('seasonId divisionId')

  if (!match) throw new Error('Partido no encontrado')

  return match
}

/**
 * Busca y devuelve un partido poblado y con sets enriquecidos con modo y mapa.
 * @param {Number} seasonIndex
 * @param {String} teamAName
 * @param {String} teamBName
 * @returns {Promise<Object|null>} Partido con sets enriquecidos
 */
const getMatchInfo = async ({ seasonIndex, teamAName, teamBName }) => {
  const match = await findMatchByNamesAndSeason({ seasonIndex, teamAName, teamBName })
  if (!match) return null

  // 4. Busca la división y ronda de la Season donde está el partido
  const division = season.divisions.find(d =>
    d.divisionId.toString() === (match.divisionId._id || match.divisionId).toString()
  )
  if (!division) throw new Error('División no encontrada en la temporada.')

  const round = division.rounds.find(r =>
    r.roundIndex === match.roundIndex
  )
  if (!round) throw new Error('Ronda no encontrada en la división.')

  // 5. Crea el objeto de sets enriquecidos
  const sets = [1, 2, 3].map(i => ({
    ...match[`set${i}`]?._doc, // Para obtener los datos del subdocumento Mongoose
    mode: round[`set${i}`]?.mode,
    map: round[`set${i}`]?.map
  }))

  // 6. Devuelve el partido poblado y con sets enriquecidos
  return {
    ...match._doc,
    teamA: match.teamAId,
    teamB: match.teamBId,
    season: match.seasonId,
    division: match.divisionId,
    sets
  }
}

/**
 * Cancela un partido (status = "cancelled")
 */
const cancelMatch = async ({ seasonIndex, teamAName, teamBName, reason = 'Partido cancelado', removeTeamId = null }) => {
  const match = await findMatchByNamesAndSeason({ seasonIndex, teamAName, teamBName })
  // Si se quiere remover a un equipo del match
  if (removeTeamId) {
    if (match.teamAId?._id?.equals(removeTeamId)) match.teamAId = null
    if (match.teamBId?._id?.equals(removeTeamId)) match.teamBId = null
  }

  match.status = 'cancelled'
  match.reason = reason

  await match.save()

  return match
}

/**
 * Finaliza un partido (status = "played")
 */
const endMatch = async ({ seasonIndex, teamAName, teamBName }) => {
  const match = await findMatchByNamesAndSeason({ seasonIndex, teamAName, teamBName })

  match.status = 'played'

  // aqui la logica de ganador y eso
  await match.save()
  return match
}

/**
 * cambia la fecha de un partido
 */
const changeMatchScheduledAt = async ({ seasonIndex, teamAName, teamBName, day, hour, minute }) => {
  const match = await findMatchByNamesAndSeason({ seasonIndex, teamAName, teamBName })

  match.scheduledAt = getNextDayAndHour({ day, hour, minute })

  await match.save()
  return match
}

module.exports = {
  createMatchChannel,
  createMatch,
  findMatchByNamesAndSeason,
  getMatchInfo,
  cancelMatch,
  endMatch,
  changeMatchScheduledAt
}