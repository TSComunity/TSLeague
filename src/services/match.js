const { ChannelType, PermissionsBitField, MessageFlags } = require('discord.js')

const Division = require('../models/Division')
const Match = require('../models/Match')
const Team = require('../models/Team')

const { sendTeamAnnouncement } = require('../discord/send/team.js')

const { getActiveSeason } = require('../utils/season.js')
const { getCurrentRoundNumber } = require('../utils/round.js')
const { findMatch } = require('../utils/match.js')
const { getDate, checkDeadline } = require('../utils/date.js')
const { generateMatchPreviewImageURL, generateMatchResultsImageURL } = require('../utils/canvas.js')

const { getMatchInfoEmbed } = require('../discord/embeds/match.js')

const { guild: guildConfig, channels, roles, match: matchConfig } = require('../configs/league.js')
const emojis = require('../configs/emojis.json')
/**
 * Crea un canal de Discord para un partido.
 * 
 * @param {Object} match - El documento del partido ya guardado en Mongo.
 * @param {Client} client - El cliente de Discord.
 */
const createMatchChannel = async ({ match, client }) => {
  try {
    const matchToUpd = await Match.findById(match._id)
      .populate({
        path: 'teamAId',
        model: 'Team',
        populate: { path: 'members.userId', model: 'User' }
      })
      .populate({
        path: 'teamBId',
        model: 'Team',
        populate: { path: 'members.userId', model: 'User' }
      })

    if (!matchToUpd) throw new Error('No se encontró el partido.')

    const teamA = matchToUpd.teamAId
    const teamB = matchToUpd.teamBId
    if (!teamA || !teamB) throw new Error('No se encontraron los equipos del partido')

    // IDs de miembros
    const leaderIds = [teamA, teamB].flatMap(t =>
      t.members.filter(m => m.role === 'leader').map(m => m.userId?.discordId)
    ).filter(Boolean)

    const subLeaderIds = [teamA, teamB].flatMap(t =>
      t.members.filter(m => m.role === 'sub-leader').map(m => m.userId?.discordId)
    ).filter(Boolean)

    const memberIds = [teamA, teamB].flatMap(t =>
      t.members.filter(m => m.role === 'member').map(m => m.userId?.discordId)
    ).filter(Boolean)

    const guild = await client.guilds.fetch(guildConfig.id)

    // Fetch miembros (evita fallo por no-cached)
    const fetchMember = async id => {
      try { return await guild.members.fetch(id) } catch { return null }
    }
    const leaderMembers = (await Promise.all(leaderIds.map(fetchMember))).filter(Boolean)
    const subLeaderMembers = (await Promise.all(subLeaderIds.map(fetchMember))).filter(Boolean)
    const normalMembers = (await Promise.all(memberIds.map(fetchMember))).filter(Boolean)

    // Fetch roles staff
    const fetchRole = async id => {
      try { return await guild.roles.fetch(id) } catch { return null }
    }
    const staffRolesResolved = (await Promise.all((roles.staff || []).map(fetchRole))).filter(Boolean)

    // Permisos: member base + extras
    const parsePerms = names => names.map(name => PermissionsBitField.Flags[name])
    const memberPermissions = parsePerms(channels.permissions.member)
    const leaderPermissions = [...memberPermissions, ...parsePerms(channels.permissions.leader)]
    const subLeaderPermissions = [...memberPermissions, ...parsePerms(channels.permissions.subLeader || [])]
    const staffPermissions = [...memberPermissions, ...parsePerms(channels.permissions.staff)]

    const permissionOverwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      ...leaderMembers.map(m => ({ id: m.id, allow: leaderPermissions })),
      ...subLeaderMembers.map(m => ({ id: m.id, allow: subLeaderPermissions })),
      ...normalMembers.map(m => ({ id: m.id, allow: memberPermissions })),
      ...staffRolesResolved.map(r => ({ id: r.id, allow: staffPermissions }))
    ]

    // Obtener categoría de la división
    const divisionId = teamA.divisionId
    const division = await Division.findById(divisionId)
    if (!division) throw new Error('No se encontró la división del partido')
    const categoryId = division.matchesCategoryId
    if (!categoryId) throw new Error('La división no tiene definida matchesCategoryId')

    // Nombre esperado
    const expectedName = `${matchConfig.channels.prefix}partido-${matchToUpd.matchIndex}`

    // Evitar duplicados: buscar por name+parent en cache
    let existingChannel = guild.channels.cache.find(c => c.name === expectedName && c.parentId === categoryId) || null

    // Si match ya tiene channelId, intentar fetch y usarlo
    if (!existingChannel && matchToUpd.channelId) {
      existingChannel = await client.channels.fetch(matchToUpd.channelId).catch(() => null)
    }

    // Si ya existe, actualizar channelId y overwrites y retornar
    if (existingChannel) {
      if (matchToUpd.channelId !== existingChannel.id) {
        matchToUpd.channelId = existingChannel.id
        await matchToUpd.save()
      }
      try { await existingChannel.permissionOverwrites.set(permissionOverwrites) } catch (err) { console.warn('No se pudieron aplicar overwrites al canal existente:', err) }
      return matchToUpd
    }

    // Antes de crear: re-lectura de match por si otro proceso creó el canal
    const freshMatch = await Match.findById(match._id)
    if (freshMatch?.channelId) {
      // intentar usar ese canal
      const ch = await client.channels.fetch(freshMatch.channelId).catch(() => null)
      if (ch) {
        // reaplicar perms y devolver
        try { await ch.permissionOverwrites.set(permissionOverwrites) } catch {}
        return freshMatch
      }
    }

    // Crear canal
    const channel = await guild.channels.create({
      name: expectedName,
      type: ChannelType.GuildText,
      parent: categoryId,
      topic: `Partido entre ${teamA.name} y ${teamB.name} — Jornada ${matchToUpd.roundIndex + 1}`,
      permissionOverwrites
    })

    matchToUpd.channelId = channel.id
    await matchToUpd.save()

    await channel.send({ content: `<@&${roles.ping.id}>` })
    await channel.send({
      components: [await getMatchInfoEmbed({ match: matchToUpd, showButtons: true })],
      flags: MessageFlags.IsComponentsV2
    })

    return matchToUpd
  } catch (error) {
    // Limpieza en caso de error parcial
    if (match.channelId) {
      try {
        const channel = await client.channels.fetch(match.channelId)
        if (channel) await channel.delete('Error al crear el canal del partido, limpieza de canal')
      } catch (err) { console.error('No se pudo eliminar el canal tras error:', err) }
    }
    await Match.findByIdAndDelete(match._id).catch(() => {})
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
  // Calcular matchIndex según los últimos partidos
  const lastMatch = await Match.findOne({}).sort({ matchIndex: -1 })
  const matchIndex = lastMatch ? lastMatch.matchIndex + 1 : 1

  // Generar preview antes de crear el match
  const previewImageURL = await generateMatchPreviewImageURL({
    divisionDoc,
    roundIndex,
    teamADoc,
    teamBDoc
  })

  let match
  try {
    // Crear el partido
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

    // Anuncios a equipos
    await sendTeamAnnouncement({
      client,
      team: teamADoc,
      content: `### ${emojis.match} Nuevo partido programado\nSe ha programado un partido para vuestro equipo **${teamADoc.name}**. El enfrentamiento será contra **${teamBDoc.name}** en la jornada ${roundIndex}.\n\nPodéis consultar todos los detalles y la información actualizada del partido en el canal <#${updatedMatch.channelId}>.`
    })

    await sendTeamAnnouncement({
      client,
      team: teamBDoc,
      content: `### ${emojis.match} Nuevo partido programado\nSe ha programado un partido para vuestro equipo **${teamBDoc.name}**. El enfrentamiento será contra **${teamADoc.name}** en la jornada ${roundIndex}.\n\nPodéis consultar todos los detalles y la información actualizada del partido en el canal <#${updatedMatch.channelId}>.`
    })

    return updatedMatch
  } catch (error) {
    // Limpieza si hubo error
    if (match?.channelId) {
      try {
        const channel = await client.channels.fetch(match.channelId)
        if (channel) await channel.delete('Error al crear el partido, limpieza de canal')
      } catch (err) {
        console.error('No se pudo eliminar el canal tras error:', err)
      }
    }

    if (match?._id) {
      await Match.findByIdAndDelete(match._id)
    }

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

  const lastMatch = await Match.findOne({}).sort({ matchIndex: -1 })
  const matchIndex = lastMatch ? lastMatch.matchIndex + 1 : 1

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

    await sendTeamAnnouncement({
      client,
      team: teamADoc,
      content: `### ${emojis.match} Nuevo partido programado\nSe ha programado un partido para vuestro equipo **${teamAName}**. El enfrentamiento será contra **${teamBName}** en la jornada ${roundIndex}.\n\nPodéis consultar todos los detalles y la información actualizada del partido en el canal <#${updatedMatch.channelId}>.`
    })

    await sendTeamAnnouncement({
      client,
      team: teamBDoc,
      content: `### ${emojis.match} Nuevo partido programado\nSe ha programado un partido para vuestro equipo **${teamBName}**. El enfrentamiento será contra **${teamAName}** en la jornada ${roundIndex + 1}.\n\nPodéis consultar todos los detalles y la información actualizada del partido en el canal <#${updatedMatch.channelId}>.`
    })

    return updatedMatch

  } catch (error) {
    if (match && match?._id) {
      await Match.findByIdAndDelete(match?._id)
    }
    throw new Error(`Error al crear el partido: ${error.message}`)
  }
}

const cancelMatch = async ({ client, matchIndex, seasonIndex, teamAName, teamBName, reason = 'Partido cancelado' }) => {
  // Buscar el match
  const match = await findMatch({ matchIndex, seasonIndex, teamAName, teamBName })
  if (!match) throw new Error('Partido no encontrado')

  if (match.status === 'cancelled') return
  if (match.status === 'played') throw new Error('El partido ya está finalizado y no se puede cancelar.')

  // Actualizar estado
  match.status = 'cancelled'
  match.reason = reason

  const channel = await client.channels.fetch(match.channelId).catch(() => null)
  if (channel) {
    await channel.delete('Partido cancelado, limpieza de canal').catch(() => null)
  }
  match.channelId = null
  // Guardar cambios
  await match.save()

  // Notificar a equipo A
  if (match.teamAId) {
    const teamADoc = match.teamAId
    await sendTeamAnnouncement({
      client,
      team: teamADoc,
      content: `### ${emojis.canceled} Partido cancelado\nVuestro partido programado contra el equipo **${match.teamBId.name}** ha sido cancelado.\n**Motivo:**\n> ${reason}`
    })
  }

  // Notificar a equipo B
  if (match.teamBId) {
    const teamBDoc = match.teamBId
    await sendTeamAnnouncement({
      client,
      team: teamBDoc,
      content: `### ${emojis.canceled} Partido cancelado\nVuestro partido programado contra el equipo **${match.teamAId.name}** ha sido cancelado.\n**Motivo:**\n> ${reason}`
    })
  }

  return match
}

/**
 * Finaliza un partido, calcula sets, ganador y actualiza stats de equipos.
 * @param {Object} params
 * @param {Number} params.matchIndex - Índice único del partido
 * @param {Number} params.seasonIndex - Índice de la temporada
 * @param {String} params.teamAName - Nombre del equipo A
 * @param {String} params.teamBName - Nombre del equipo B
 * @returns {Promise<Object>} - Match actualizado
 */
const endMatch = async ({ matchIndex, seasonIndex, teamAName, teamBName }) => {
  const match = await findMatch({ matchIndex, seasonIndex, teamAName, teamBName })

  if (!match) throw new Error('Partido no encontrado.')

  if (match.status === 'cancelled') throw new Error('El partido está cancelado y no se puede finalizar.')
  if (match.status === 'played') throw new Error('El partido ya está finalizado.')
    
  match.status = 'played'

  // 🔹 contar sets ganados
  let setsWonA = 0, setsWonB = 0
  for (const set of match.sets) {
    if (!set.winner) continue
    if (set.winner.toString() === match.teamAId.toString()) setsWonA++
    else if (set.winner.toString() === match.teamBId.toString()) setsWonB++
  }

  match.scoreA = setsWonA
  match.scoreB = setsWonB
  await match.save()

  // 🔹 obtener equipos
  const teamA = await Team.findById(match.teamAId).populate("members.userId")
  const teamB = await Team.findById(match.teamBId).populate("members.userId")

  // 🔹 helper para actualizar stats de equipo y usuarios
  const updateStats = async (team, wonMatch, setsWon, setsLost) => {
    if (wonMatch) team.stats.matchesWon += 1
    else team.stats.matchesLost += 1

    team.stats.setsWon += setsWon
    team.stats.setsLost += setsLost
    await team.save()

    // 🔹 actualizar stats de cada jugador
    for (const member of team.members) {
      const user = member.userId
      if (!user) continue

      if (wonMatch) user.leagueStats.matchesWon += 1
      else user.leagueStats.matchesLost += 1

      user.leagueStats.setsWon += setsWon
      user.leagueStats.setsLost += setsLost

      await user.save()
    }
  }

  if (setsWonA > setsWonB) {
    await updateStats(teamA, true, setsWonA, setsWonB)
    await updateStats(teamB, false, setsWonB, setsWonA)
  } else if (setsWonB > setsWonA) {
    await updateStats(teamA, false, setsWonA, setsWonB)
    await updateStats(teamB, true, setsWonB, setsWonA)
  } else {
    // Empate → los dos como perdedores (o podrías hacer empate real con un campo especial)
    await updateStats(teamA, false, setsWonA, setsWonB)
    await updateStats(teamB, false, setsWonB, setsWonA)
  }

  const populatedMatch = await findMatch({ matchIndex, seasonIndex, teamAName, teamBName })

  // 🔹 Generar imagen de resultados
  const resultsImageURL = await generateMatchResultsImageURL({ match: populatedMatch })

  // 🔹 Guardar URL en el partido
  populatedMatch.resultsImageURL = resultsImageURL
  await populatedMatch.save()

  return match
}

/**
 * cambia la fecha de un partido
 */
const changeMatchScheduledAt = async ({ matchIndex, seasonIndex, teamAName, teamBName, day, hour, minute, client }) => {
  const match = await findMatch({ matchIndex, seasonIndex, teamAName, teamBName })
  if (!match) throw new Error('Partido no encontrado')

  if (match.status === 'cancelled') throw new Error('El partido está cancelado y no se puede reprogramar.')
  if (match.status === 'played') throw new Error('El partido ya está finalizado y no se puede reprogramar.')

  match.scheduledAt = getDate({ day, hour, minute })
  await match.save()

  const scheduledTimestamp = Math.floor(match.scheduledAt.getTime() / 1000)
  const teams = [match.teamAId, match.teamBId].filter(Boolean)

  // Enviar anuncio a cada equipo
  for (const team of teams) {
    await sendTeamAnnouncement({
      client,
      team,
      content: `### ${emojis.schedule} Partido reprogramado\n` +
               `Vuestro partido contra el equipo **${team._id.equals(match.teamAId._id) ? match.teamBId.name : match.teamAId.name}** ha sido reprogramado.\n**Nueva fecha:** <t:${scheduledTimestamp}:F>.`
    })
  }

  return match
}

const applyDefaultDates = async ({ client }) => {
  const now = new Date()
  const matches = await Match.find({ scheduledAt: { $exists: false } })
    .populate('teamAId teamBId divisionId seasonId')

  for (const match of matches) {
    const { passed, deadline, defaultDate } = checkDeadline(match, now)
    if (!passed) continue

    // Aplicar fecha por defecto y guardar
    match.scheduledAt = defaultDate
    await match.save()

    const scheduledTimestamp = Math.floor(match.scheduledAt.getTime() / 1000)
    const deadlineTimestamp = deadline ? Math.floor(deadline.getTime() / 1000) : null

    // 1) Mensaje en el canal del partido (SIN ping). Incluye embed de match info.
    try {
      let matchChannel = client.channels.cache.get(match.channelId) || await client.channels.fetch(match.channelId).catch(() => null)
      if (matchChannel && matchChannel.isTextBased()) {
        const content =
          `<@&${config.roles.ping.id}>\n` +
          `### ${emojis.schedule} Fecha asignada automáticamente\n` +
          (deadlineTimestamp ? `El plazo para proponer horario ha expirado (<t:${deadlineTimestamp}:F>), por lo que se ha aplicado la fecha por defecto.\n` :
                               `Se ha aplicado la fecha por defecto.\n`) +
          `**Fecha:** <t:${scheduledTimestamp}:F>`

        await matchChannel.send({ content })
        await matchChannel.send({
          components: [await getMatchInfoEmbed({ match, showButtons: false })],
          flags: MessageFlags.IsComponentsV2
        })
      }
    } catch {}

    // 2) Notificar a cada equipo (sendTeamAnnouncement)
    const teams = [match.teamAId, match.teamBId].filter(Boolean)
    for (const team of teams) {
      try {
        const rivalName = team._id.equals(match.teamAId._id) ? match.teamBId.name : match.teamAId.name
        await sendTeamAnnouncement({
          client,
          team,
          content:
            `### ${emojis.schedule} Fecha asignada automáticamente\n` +
            (deadlineTimestamp ? `El plazo para proponer horario ha expirado (<t:${deadlineTimestamp}:F>), por lo que se ha asignado la fecha por defecto.\n` :
                                 `Se ha asignado la fecha por defecto.\n`) +
            `La fecha del partido de **${team.name}** contra **${rivalName}** ha sido fijada en **<t:${scheduledTimestamp}:F>**.\n\n` +
            `Revisad el canal ${emojis.channel} <#${match.channelId}> para más detalles.`
        })
      } catch {}
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