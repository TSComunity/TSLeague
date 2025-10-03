const { ChannelType, PermissionsBitField, MessageFlags } = require('discord.js')

const Division = require('../models/Division')
const Match = require('../models/Match')
const Team = require('../models/Team')
const User = require('../models/User')

const { sendTeamAnnouncement } = require('../discord/send/team.js')

const { getActiveSeason } = require('../utils/season.js')
const { getCurrentRoundNumber } = require('../utils/round.js')
const { findMatch } = require('../utils/match.js')
const { getDate, checkDeadline } = require('../utils/date.js')
const { generateMatchPreviewImageURL, generateMatchResultsImageURL } = require('../utils/canvas.js')

const { getMatchInfoEmbed, getOnGoingMatchEmbed, getMatchResultsEmbed } = require('../discord/embeds/match.js')

const { guild: guildConfig, channels, roles, match: matchConfig } = require('../configs/league.js')
const emojis = require('../configs/emojis.json')

const { BRAWL_STARS_API_KEY } = require('../configs/configs.js')

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
      topic: `Partido entre **${teamA.name}** y **${teamB.name}** — Jornada ${matchToUpd.roundIndex + 1}`,
      permissionOverwrites
    })

    matchToUpd.channelId = channel.id

    await channel.send({ content: `<@&${roles.ping.id}> ¡Canal del partido creado!` })
    const infoMsg = await channel.send({
      components: [await getMatchInfoEmbed({ match: matchToUpd, showButtons: true })],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] }
    })
    await infoMsg.pin().catch(() => null)
    match.infoMessageId = infoMsg.id

    await matchToUpd.save()
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

const endMatch = async ({ matchIndex, seasonIndex, teamAName, teamBName, client }) => {
  // 🔹 obtener match poblado con sets
  const match = await findMatch({ matchIndex, seasonIndex, teamAName, teamBName })
  if (!match) throw new Error('Partido no encontrado.')
  if (match.status === 'cancelled') throw new Error('El partido está cancelado y no se puede finalizar.')
  if (match.status === 'played') throw new Error('El partido ya está finalizado.')

  match.status = 'played'

  // 🔹 contar sets ganados y star players
  let setsWonA = 0, setsWonB = 0
  const starCounts = new Map() // userId => sets como star player

  for (const set of match.sets) {
    if (!set.winner) continue

    if (set.winner._id.toString() === match.teamAId._id.toString()) setsWonA++
    else if (set.winner._id.toString() === match.teamBId._id.toString()) setsWonB++

    if (set.starPlayerId) {
      const id = set.starPlayerId._id.toString()
      starCounts.set(id, (starCounts.get(id) || 0) + 1)
    }
  }

  match.scoreA = setsWonA
  match.scoreB = setsWonB

  // 🔹 obtener equipos con miembros
  const teamA = await Team.findById(match.teamAId._id).populate("members.userId")
  const teamB = await Team.findById(match.teamBId._id).populate("members.userId")

  // 🔹 actualizar stats de equipo y usuarios
  const updateStats = async (team, wonMatch, setsWon, setsLost) => {
    if (wonMatch) team.stats.matchesWon += 1
    else team.stats.matchesLost += 1
    team.stats.setsWon += setsWon
    team.stats.setsLost += setsLost
    await team.save()

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
    await updateStats(teamA, false, setsWonA, setsWonB)
    await updateStats(teamB, false, setsWonB, setsWonA)
  }

  let starPlayerId = null
  let maxCount = 0
  let lastSetIndex = -1

  match.sets.forEach((set, index) => {
    if (!set.starPlayerId) return
    const id = set.starPlayerId._id.toString()
    const count = (starCounts.get(id) || 0)

    // condiciones:
    // 1. más apariciones
    // 2. mismo número, pero apareció en un set más reciente
    if (count > maxCount || (count === maxCount && index > lastSetIndex)) {
      maxCount = count
      starPlayerId = id
      lastSetIndex = index
    }
  })

  if (starPlayerId) {
    const user = await User.findById(starPlayerId)
    if (user) {
      user.leagueStats.matchStarPlayer += 1
      user.leagueStats.setStarPlayer += maxCount
      await user.save()
    }
    match.starPlayerId = starPlayerId
  }

  // 🔹 generar imagen de resultados y guardar
  const resultsImageURL = await generateMatchResultsImageURL({ match })
  match.resultsImageURL = resultsImageURL
  await match.save()
  
  const season = await getActiveSeason()
  const division = season.divisions.find(d => d.divisionId._id.toString() === match.divisionId.toString())
  const teamASeason = division.teams.find(t => t.teamId._id.toString() === match.teamAId._id.toString())
  const teamBSeason = division.teams.find(t => t.teamId._id.toString() === match.teamBId._id.toString())

  teamASeason.points += setsWonA
  teamBSeason.points += setsWonB

  await season.save()

  // 🔹 enviar mensajes a canales
  const guild = await client.guilds.fetch(guildConfig.id)
  const resultsChannel = await guild.channels.fetch(channels.results.id)
  const matchChannel = match.channelId ? await guild.channels.fetch(match.channelId) : null

  // Canal de resultados
  if (resultsChannel) {
    const embed = getMatchResultsEmbed({ match })
    await resultsChannel.send({ components: [embed], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } })
  }

  // Canal del partido
  if (matchChannel) {
    const embed = getMatchResultsEmbed({ match })
    await matchChannel.send({ components: [embed], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } })
    await msg.pin().catch(() => null)
  }

  // Canal de cada equipo
  for (const teamObj of [teamA, teamB]) {
    if (!teamObj.channelId) continue
    const teamChannel = await guild.channels.fetch(teamObj.channelId)
    if (!teamChannel) continue
    const embed = getMatchResultsEmbed({ match, team: teamObj })
    await teamChannel.send({ components: [embed], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } })
  }

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

async function processScheduledMatches({ client }) {
  const now = new Date()

  const matches = await Match.find({
    status: 'scheduled',
    scheduledAt: { $lte: now }
  })

  for (const match of matches) {
    if (!match.channelId) continue
    const channel = await client.channels.fetch(match.channelId).catch(() => null)
    if (!channel) continue

    await channel.send({
      content: `<@&${roles.ping.id}> ¡Es hora de jugar vuestro partido!`,
    })
    const onGoingMsg = await channel.send({
      components: [await getOnGoingMatchEmbed({ match })],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] }
    })

    await onGoingMsg.pin().catch(() => null)
    match.onGoingMessageId = onGoingMsg.id
    match.status = 'onGoing'
    await match.save()
  }
}

async function monitorOnGoingMatches({ client }) {
  const matches = await Match.find({ status: 'onGoing' })
    .populate({
      path: 'teamAId teamBId',
      populate: { path: 'members.userId' }
    })

  for (const match of matches) {
    const teamAMembers = match.teamAId.members.map(m => m.userId).filter(Boolean)
    const teamBMembers = match.teamBId.members.map(m => m.userId).filter(Boolean)

    const teamABrawlIds = teamAMembers.map(u => u.brawlId).filter(Boolean)
    const teamBBrawlIds = teamBMembers.map(u => u.brawlId).filter(Boolean)
    const allPlayerIds = [...new Set([...teamABrawlIds, ...teamBBrawlIds])]
    if (!allPlayerIds.length) continue

    // fetch battlelogs en paralelo
    const battleLogResults = await Promise.allSettled(
      allPlayerIds.map(brawlId =>
        fetch(`https://api.brawlstars.com/v1/players/${encodeURIComponent(brawlId)}/battlelog`, {
          headers: { Authorization: `Bearer ${BRAWL_STARS_API_KEY}` }
        }).then(r => r.ok ? r.json() : null).catch(() => null)
      )
    )

    const battleLogs = battleLogResults
      .filter(r => r.status === 'fulfilled' && r.value)
      .flatMap(r => r.value.items || [])

    for (const battle of battleLogs) {
      if (!battle.battle?.starPlayer) continue // solo definitiva

      const battleTeams = (battle.battle.teams || []).flat()
      const battleTags = battleTeams.map(p => p.tag)

      // verificar que hay 2+ jugadores de cada equipo en la partida
      const teamACount = teamABrawlIds.filter(tag => battleTags.includes(tag)).length
      const teamBCount = teamBBrawlIds.filter(tag => battleTags.includes(tag)).length
      if (teamACount < 2 || teamBCount < 2) continue

      // buscar sets pendientes (map + mode)
      const possibleSets = match.sets.filter(s =>
        s.map === battle.event.map &&
        s.mode === battle.event.mode &&
        !s.winner
      )
      if (!possibleSets.length) continue

      const targetSet = possibleSets[0]

      // determinar ganador según la perspectiva
      let winner = null
      for (const tag of battleTags) {
        if (teamABrawlIds.includes(tag)) {
          if (battle.battle.result === 'victory') winner = match.teamAId._id
          if (battle.battle.result === 'defeat') winner = match.teamBId._id
          break
        }
        if (teamBBrawlIds.includes(tag)) {
          if (battle.battle.result === 'victory') winner = match.teamBId._id
          if (battle.battle.result === 'defeat') winner = match.teamAId._id
          break
        }
      }

      // star player (solo para registrar, no para decidir ganador)
      let starPlayerId = null
      const spTag = battle.battle.starPlayer.tag
      const starUser = [...teamAMembers, ...teamBMembers].find(u => u.brawlId === spTag)
      if (starUser) starPlayerId = starUser._id

      targetSet.winner = winner
      targetSet.starPlayerId = starPlayerId
    }

    await match.save()

    // si todos los sets ya tienen ganador → terminar el match
    const allSetsCompleted = match.sets.every(s => s.winner)
    if (allSetsCompleted) {
      await endMatch({ matchIndex: match.matchIndex, client })
      continue
    }

    // actualizar embed onGoing en Discord
    if (match.onGoingMessageId && match.channelId) {
      try {
        const channel = await client.channels.fetch(match.channelId)
        if (channel?.isTextBased()) {
          const message = await channel.messages.fetch(match.onGoingMessageId).catch(() => null)
          if (message) {
            const embed = await getOnGoingMatchEmbed({ match })
            await message.edit({
              embeds: [embed],
              allowedMentions: { parse: [] }
            })
          }
        }
      } catch (err) {
        console.error(`Error actualizando onGoingMessageId para match ${match._id}:`, err)
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
  applyDefaultDates,
  processScheduledMatches,
  monitorOnGoingMatches
}
