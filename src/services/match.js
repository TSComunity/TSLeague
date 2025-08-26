const { ChannelType, PermissionsBitField, MessageFlags } = require('discord.js')

const Match = require('../Esquemas/Match')
const Team = require('../Esquemas/Team')

const { getActiveSeason } = require('../utils/season.js')
const { getCurrentRoundNumber } = require('../utils/round.js')
const { findMatchByNamesAndSeason, findMatchByIndex } = require('../utils/match.js')
const { getDate, checkDeadline } = require('../utils/date.js')
const { generateMatchPreviewImageURL } = require('../utils/canvas.js')

const { getMatchInfoEmbed } = require('../discord/embeds/match.js')

const { guild: guildConfig, categories, channels, match } = require('../configs/league.js')

/**
 * Crea un canal de Discord para un partido.
 * 
 * @param {Object} match - El documento del partido ya guardado en Mongo.
 * @param {Client} client - El cliente de Discord.
 */
const createMatchChannel = async ({ match, client }) => {
  try {
const matchToUpd = await Match.findOne({ _id: match._id })
  .populate({
    path: 'teamAId',             // primero poblamos el equipo completo
    model: 'Team',
    populate: {
      path: 'members.userId',    // luego poblamos los usuarios de los miembros
      model: 'User'
    }
  })
  .populate({
    path: 'teamBId',
    model: 'Team',
    populate: {
      path: 'members.userId',
      model: 'User'
    }
  })

    if (!matchToUpd) throw new Error('No se encontro el partido.')
    // 1. Poblamos equipos con miembros y sus usuarios (para discordId)
    const teamA = matchToUpd.teamAId
    const teamB = matchToUpd.teamBId

    if (!teamA || !teamB) {
      throw new Error('No se encontraron los equipos del partido')
    }

    // 2. Extraer discordId de los líderes
    const leaderA = teamA.members.find(m => m.role === 'leader')?.userId?.discordId
    const leaderB = teamB.members.find(m => m.role === 'leader')?.userId?.discordId

    // 3. Miembros normales (sin incluir líderes), extraer sus discordId
    const normalMembersA = teamA.members
      .filter(m => m.role !== 'leader')
      .map(m => m.userId?.discordId)
      .filter(Boolean)

    const normalMembersB = teamB.members
      .filter(m => m.role !== 'leader')
      .map(m => m.userId?.discordId)
      .filter(Boolean)

    const guild = await client.guilds.fetch(guildConfig.id)

    // 4. Preparar permisos
    const modRoleIds = channels.perms

    const normalPermissions = [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.SendTTSMessages,
      PermissionsBitField.Flags.SendVoiceMessages,
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
      PermissionsBitField.Flags.CreateInstantInvite
    ]

    // Líderes = normales + fijar mensajes
    const leaderPermissions = [
      ...normalPermissions,
      PermissionsBitField.Flags.ManageMessages
    ]

    // Mods = normales + gestionar mensajes y fijar mensajes
    const modPermissions = [
      ...normalPermissions,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.MentionEveryone
    ]

    // 5. Construir permissionOverwrites usando IDs de Discord válidos
    const permissionOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      ...(leaderA ? [{
        id: leaderA,
        allow: leaderPermissions
      }] : []),
      ...(leaderB && leaderB !== leaderA ? [{
        id: leaderB,
        allow: leaderPermissions
      }] : []),
      ...normalMembersA.map(discordId => ({
        id: discordId,
        allow: normalPermissions
      })),
      ...normalMembersB.map(discordId => ({
        id: discordId,
        allow: normalPermissions,
      })),
      ...modRoleIds.map(roleId => ({
        id: roleId,
        allow: modPermissions
      }))
    ]

    // for (const overwrite of permissionOverwrites) {
    //   try { const resolved =  
    //     guild.roles.cache.get(overwrite.id)
    //       || await guild.members.fetch(overwrite.id).catch(() => null)

    //     if (!resolved) {
    //       console.warn(`❌ ID no encontrado: ${overwrite.id}`)
    //     } else {
    //       console.log(`✅ ID válido: ${overwrite.id}`)
    //     }
    //   } catch (err) {
    //     console.error(`💥 Error al verificar ID ${overwrite.id}:`, err)
    //   }
    // }


    // 6. Crear el canal en la categoría indicada
    const guildToUse = await client.guilds.fetch(guild.id)
    const channel = await guildToUse.channels.create({
      name: `「🎮」partido-${matchToUpd.matchIndex}`,
      type: ChannelType.GuildText,
      parent: categories.matches.id,
      topic: `Partido entre ${teamA.name} y ${teamB.name} — Ronda ${matchToUpd.roundIndex + 1}`,
      permissionOverwrites
    })

    matchToUpd.channelId = channel.id
    await matchToUpd.save()

    await channel.send({
      components: [getMatchInfoEmbed({ match: matchToUpd, showButtons: true })],
      flags: MessageFlags.IsComponentsV2
    })

    return matchToUpd
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
const createMatch = async ({ client, seasonId, divisionDoc, roundIndex, teamADoc, teamBDoc, sets }) => {
  // Calcular matchIndex según los partidos existentes en la división y ronda
  const existingMatchesCount = await Match.countDocuments()

  const matchIndex = existingMatchesCount + 1 // siguiente índice

  const previewImageURL = await generateMatchPreviewImageURL({
    divisionDoc,
    roundIndex,
    teamADoc,
    teamBDoc
  })

  // Crear el partido
  let match
  try {
    match = await Match.create({
      matchIndex,
      roundIndex,
      seasonId,
      divisionId: divisionDoc._id,
      teamAId: teamADoc._id,
      teamBId: teamBDoc._id,
      scoreA: 0,
      scoreB: 0,
      status: 'scheduled',
      sets,
      previewImageURL
    })

    // Crear canal de Discord y actualizar el match con channelId
    const updatedMatch = await createMatchChannel({ match, client })
    channelCreated = true; // Marcamos que ya se creó el canal

    return updatedMatch
  } catch (error) {
  // Si hubo error y ya se creó el match, borrarlo
  if (match.channelId) {
    try {
      const channel = await client.channels.fetch(match.channelId);
      if (channel) await channel.delete('Error al crear el partido, limpieza de canal');
    } catch (err) {
      console.error('No se pudo eliminar el canal tras error:', err);
    }
  }

  // Luego eliminar el match de la base de datos
  await Match.findByIdAndDelete(match._id);
  throw error
  }
}

/**
 * Crea un partido manualmente entre dos equipos por nombre, en la última ronda compartida.
 * @param {Object} params
 * @param {string} params.teamAName
 * @param {string} params.teamBName
 * @param {Client} params.client
 */
const createMatchManually = async ({ teamAName, teamBName, client }) => {
  if (teamAName === teamBName) {
    throw new Error('Un equipo no puede jugar contra sí mismo.')
  }

  const teamA = await Team.findOne({ name: teamAName })
  const teamB = await Team.findOne({ name: teamBName })

  if (!teamA) throw new Error(`No se encontró el equipo: ${teamAName}.`)
  if (!teamB) throw new Error(`No se encontró el equipo: ${teamBName}.`)

  const season = await getActiveSeason()
  if (!season) throw new Error('No hay ninguna temporada activa.')

  const activeDivisions = season.divisions.filter(d => d.status === 'active')

  const division = activeDivisions.find(d =>
    d.teams.some(t => t.teamId.equals(teamA._id)) &&
    d.teams.some(t => t.teamId.equals(teamB._id))
  )

  if (!division) {
    throw new Error('Ambos equipos deben estar en la misma división activa.')
  }

  const divisionId = division.divisionId._id
  const divisionDoc = division.divisionId
  const seasonId = season._id

  const roundIndex = getCurrentRoundNumber({ season })

  // Verifica si ya jugaron entre sí esta temporada
  const alreadyPlayed = await Match.exists({
    seasonId,
    divisionId,
    $or: [
      { teamAId: teamA._id, teamBId: teamB._id },
      { teamAId: teamB._id, teamBId: teamA._id }
    ]
  })

  if (alreadyPlayed) {
    throw new Error('Estos equipos ya se enfrentaron esta temporada.')
  }

  const existingMatchesCount = await Match.countDocuments()
  const matchIndex = existingMatchesCount + 1

  const targetDivision = season.divisions.find(d => d.divisionId.equals(divisionId))
  const lastRound = targetDivision.rounds.at(-1)
  if (!lastRound) throw new Error('No hay rondas en esta división aún.')

  const referenceMatchId = lastRound.matches[0]?.matchId
  if (!referenceMatchId) throw new Error('No hay partidos en la última ronda para copiar sets.')

  const referenceMatch = await Match.findById(referenceMatchId)
  if (!referenceMatch || !referenceMatch.sets) throw new Error('El partido de referencia no tiene sets definidos.')

  const sets = referenceMatch.sets.map(set => ({
    mode: set.mode,
    map: set.map,
    winner: null
  }))

  const previewImageURL = await generateMatchPreviewImageURL({
    divisionDoc,
    roundIndex,
    teamADoc,
    teamBDoc
  })

  let match

  try {
    match = await Match.create({
      matchIndex,
      roundIndex,
      seasonId,
      divisionId,
      teamAId: teamA._id,
      teamBId: teamB._id,
      scoreA: 0,
      scoreB: 0,
      status: 'scheduled',
      sets,
      previewImageURL
    })

    // Agregar a la última ronda de la división
    const targetDivision = season.divisions.find(d => d.divisionId.equals(divisionId))
    const lastRound = targetDivision.rounds.at(-1)
    if (!lastRound) throw new Error('No hay rondas en esta división aún.')

    lastRound.matches.push({ matchId: match._id })
    await season.save()

    const updatedMatch = await createMatchChannel({ match, client })
    return updatedMatch

  } catch (error) {
    if (match && match._id) {
      await Match.findByIdAndDelete(match._id)
    }
    throw new Error(`Error al crear el partido: ${error.message}`)
  }
}

/**
 * Cancela un partido (status = "cancelled")
 */
const cancelMatch = async ({ matchIndex, seasonIndex, teamAName, teamBName, reason = 'Partido cancelado', removeTeamId = null }) => {
  let match

  if (matchIndex != null) {
    // Caso 1: Buscar por índice
    match = await findMatchByIndex({ matchIndex })
  } else if (seasonIndex != null && teamAName && teamBName) {
    // Caso 2: Buscar por season + nombres de equipos
    match = await findMatchByNamesAndSeason({ seasonIndex, teamAName, teamBName })
  } else {
    throw new Error('Debes proporcionar matchIndex o bien seasonIndex + teamAName + teamBName.')
  }

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
const endMatch = async ({ matchIndex, seasonIndex, teamAName, teamBName }) => {
  let match

  if (matchIndex != null) {
    // Caso 1: Buscar por índice
    match = await findMatchByIndex({ matchIndex })
  } else if (seasonIndex != null && teamAName && teamBName) {
    // Caso 2: Buscar por season + nombres de equipos
    match = await findMatchByNamesAndSeason({ seasonIndex, teamAName, teamBName })
  } else {
    throw new Error('Debes proporcionar matchIndex o bien seasonIndex + teamAName + teamBName.')
  }

  match.status = 'played'

  // aqui la logica de ganador y eso
  await match.save()
  return match
}

/**
 * cambia la fecha de un partido
 */
const changeMatchScheduledAt = async ({ matchIndex, seasonIndex, teamAName, teamBName, day, hour, minute }) => {
  let match

  if (matchIndex != null) {
    // Caso 1: Buscar por índice
    match = await findMatchByIndex({ matchIndex })
  } else if (seasonIndex != null && teamAName && teamBName) {
    // Caso 2: Buscar por season + nombres de equipos
    match = await findMatchByNamesAndSeason({ seasonIndex, teamAName, teamBName })
  } else {
    throw new Error('Debes proporcionar matchIndex o bien seasonIndex + teamAName + teamBName.')
  }

  match.scheduledAt = getDate({ day, hour, minute })

  await match.save()
  return match
}

const applyDefaultDates = async ({ client }) => {
  const now = new Date()

  // Traer partidos sin fecha programada
  const matches = await Match.find({ scheduledAt: { $exists: false } })
      .populate('teamAId teamBId divisionId seasonId')

  for (const match of matches) {
    const { passed, deadline, defaultDate } = checkDeadline(match, now)

    if (passed) {
      // Aplicar fecha por defecto
      match.scheduledAt = defaultDate
      await match.save()

     let channel = client.channels.cache.get(match.channelId);
     if (!channel) channel = await client.channels.fetch(match.channelId)

      if (channel && channel.isTextBased()) {
        channel.send({
          content: `⚠️ **Fecha asignada automáticamente**\n\n` +
                  `El plazo para modificar el horario ha pasado (<t:${Math.floor(deadline.getTime() / 1000)}:F>), ` +
                  `por lo que se ha aplicado la fecha por defecto.\n` +
                  `**Fecha:** <t:${Math.floor(match.scheduledAt.getTime() / 1000)}:F>\n` +
                  `Revisa el embed para más detalles del partido.`,
          components: [getMatchInfoEmbed({ match })],
        flags: MessageFlags.IsComponentsV2
        })
      }
    }
  }
}

module.exports = {
  createMatchChannel,
  createMatch,
  createMatchManually,
  cancelMatch,
  endMatch,
  changeMatchScheduledAt,
  applyDefaultDates
}