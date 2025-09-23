const { PermissionsBitField, ChannelType } = require('discord.js')

const Season = require('../models/Season.js')
const Division = require('../models/Division.js')
const Match = require('../models/Match.js')
const Team = require('../models/Team.js')
const User = require('../models/User.js')

const { cancelMatch } = require('./match.js')

const { getActiveSeason } = require('../utils/season.js')
const { findTeam } = require('../utils/team.js')

const { getTeamChannelCreatedEmbed } = require('../discord/embeds/team.js')

const colors = require('../configs/colors.json')
const config = require('../configs/league.js')
const maxMembers = config.team.maxMembers

const checkTeamEligibility = (team) => {
  return team.members.length >= 3 || !!team.divisionId
}

const createTeamChannel = async ({ client, team, categoryId }) => {
  try {
    // Asegurarse de que members estén poblados
    if (!team.members || !team.members.length || !team.members[0].userId?.discordId) {
      await team.populate('members.userId')
    }

    const guild = await client.guilds.fetch(config.guild.id)
    const expectedName = `${config.team.channels.prefix}${team.name.toLowerCase()}`

    // 1) Buscar canal existente por name+category en cache
    let existingChannel = guild.channels.cache.find(c => c.name === expectedName && c.parentId === categoryId) || null

    // 2) Si team tiene channelId intentar fetch
    if (!existingChannel && team.channelId) {
      existingChannel = await client.channels.fetch(team.channelId).catch(() => null)
    }

    // 3) Si ya existe un canal -> actualizar channelId y overwrites y retornar
    if (existingChannel) {
      if (team.channelId !== existingChannel.id) {
        team.channelId = existingChannel.id
        await team.save()
      }

      try {
        // reconstruir y aplicar permisos
        const leaderIds = team.members.filter(m => m.role === 'leader').map(m => m.userId?.discordId).filter(Boolean)
        const subLeaderIds = team.members.filter(m => m.role === 'sub-leader').map(m => m.userId?.discordId).filter(Boolean)
        const memberIds = team.members.filter(m => m.role === 'member').map(m => m.userId?.discordId).filter(Boolean)

        const fetchMember = async id => { try { return await guild.members.fetch(id) } catch { return null } }
        const leaderMembers = (await Promise.all([...leaderIds].map(fetchMember))).filter(Boolean)
        const subLeaderMembers = (await Promise.all([...subLeaderIds].map(fetchMember))).filter(Boolean)
        const normalMembers = (await Promise.all(memberIds.map(fetchMember))).filter(Boolean)

        const fetchRole = async id => { try { return await guild.roles.fetch(id) } catch { return null } }
        const staffRolesResolved = (await Promise.all((config.roles.staff || []).map(fetchRole))).filter(Boolean)

        const parsePerms = names => names.map(name => PermissionsBitField.Flags[name])
        const memberPermissions = parsePerms(config.channels.permissions.member)
        const leaderPermissions = [...memberPermissions, ...parsePerms(config.channels.permissions.leader)]
        const subLeaderPermissions = [...memberPermissions, ...parsePerms(config.channels.permissions.subLeader || [])]
        const staffPermissions = [...memberPermissions, ...parsePerms(config.channels.permissions.staff)]

        const permissionOverwrites = [
          { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          ...leaderMembers.map(m => ({ id: m.id, allow: leaderPermissions })),
          ...subLeaderMembers.map(m => ({ id: m.id, allow: subLeaderPermissions })),
          ...normalMembers.map(m => ({ id: m.id, allow: memberPermissions })),
          ...staffRolesResolved.map(r => ({ id: r.id, allow: staffPermissions }))
        ]

        await existingChannel.permissionOverwrites.set(permissionOverwrites)
      } catch (err) {
        throw new Error('No se pudieron aplicar overwrites al canal existente:', err)
      }

      return existingChannel
    }

    // PREVENT RACE: re-lee el team desde DB justo antes de crear
    const freshTeam = await Team.findById(team._id).populate('members.userId')
    if (freshTeam?.channelId) {
      const ch = await client.channels.fetch(freshTeam.channelId).catch(() => null)
      if (ch) {
        // reaplicar perms por si fuera necesario
        try {
          // (reconstruir permisos igual que abajo)
          const leaderIds = freshTeam.members.filter(m => m.role === 'leader').map(m => m.userId?.discordId).filter(Boolean)
          const subLeaderIds = freshTeam.members.filter(m => m.role === 'sub-leader').map(m => m.userId?.discordId).filter(Boolean)
          const memberIds = freshTeam.members.filter(m => m.role === 'member').map(m => m.userId?.discordId).filter(Boolean)

          const fetchMember = async id => { try { return await guild.members.fetch(id) } catch { return null } }
          const leaderMembers = (await Promise.all([...leaderIds].map(fetchMember))).filter(Boolean)
          const subLeaderMembers = (await Promise.all([...subLeaderIds].map(fetchMember))).filter(Boolean)
          const normalMembers = (await Promise.all(memberIds.map(fetchMember))).filter(Boolean)

          const fetchRole = async id => { try { return await guild.roles.fetch(id) } catch { return null } }
          const staffRolesResolved = (await Promise.all((config.roles.staff || []).map(fetchRole))).filter(Boolean)

          const parsePerms = names => names.map(name => PermissionsBitField.Flags[name])
          const memberPermissions = parsePerms(config.channels.permissions.member)
          const leaderPermissions = [...memberPermissions, ...parsePerms(config.channels.permissions.leader)]
          const subLeaderPermissions = [...memberPermissions, ...parsePerms(config.channels.permissions.subLeader || [])]
          const staffPermissions = [...memberPermissions, ...parsePerms(config.channels.permissions.staff)]

          const permissionOverwrites = [
            { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            ...leaderMembers.map(m => ({ id: m.id, allow: leaderPermissions })),
            ...subLeaderMembers.map(m => ({ id: m.id, allow: subLeaderPermissions })),
            ...normalMembers.map(m => ({ id: m.id, allow: memberPermissions })),
            ...staffRolesResolved.map(r => ({ id: r.id, allow: staffPermissions }))
          ]

          await ch.permissionOverwrites.set(permissionOverwrites)
        } catch (err) { /* ignore */ }
        return ch
      }
    }

    // Construir arrays para crear
    const leaderIds2 = team.members.filter(m => m.role === 'leader').map(m => m.userId?.discordId).filter(Boolean)
    const subLeaderIds2 = team.members.filter(m => m.role === 'sub-leader').map(m => m.userId?.discordId).filter(Boolean)
    const memberIds2 = team.members.filter(m => m.role === 'member').map(m => m.userId?.discordId).filter(Boolean)

    const fetchMember2 = async id => { try { return await guild.members.fetch(id) } catch { return null } }
    const leaderMembers2 = (await Promise.all([...leaderIds2].map(fetchMember2))).filter(Boolean)
    const subLeaderMembers2 = (await Promise.all([...subLeaderIds2].map(fetchMember2))).filter(Boolean)
    const normalMembers2 = (await Promise.all(memberIds2.map(fetchMember2))).filter(Boolean)

    const fetchRole2 = async id => { try { return await guild.roles.fetch(id) } catch { return null } }
    const staffRolesResolved2 = (await Promise.all((config.roles.staff || []).map(fetchRole2))).filter(Boolean)

    const parsePerms = names => names.map(name => PermissionsBitField.Flags[name])
    const memberPermissions = parsePerms(config.channels.permissions.member)
    const leaderPermissions = [...memberPermissions, ...parsePerms(config.channels.permissions.leader)]
    const subLeaderPermissions = [...memberPermissions, ...parsePerms(config.channels.permissions.subLeader || [])]
    const staffPermissions = [...memberPermissions, ...parsePerms(config.channels.permissions.staff)]

    const permissionOverwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      ...leaderMembers2.map(m => ({ id: m.id, allow: leaderPermissions })),
      ...subLeaderMembers2.map(m => ({ id: m.id, allow: subLeaderPermissions })),
      ...normalMembers2.map(m => ({ id: m.id, allow: memberPermissions })),
      ...staffRolesResolved2.map(r => ({ id: r.id, allow: staffPermissions }))
    ]

    const channel = await guild.channels.create({
      name: expectedName,
      type: ChannelType.GuildText,
      parent: categoryId,
      permissionOverwrites
    })

    await channel.send({
      content: `<@&${config.roles.ping.id}>`,
      embeds: [getTeamChannelCreatedEmbed({ team })]
    })

    team.channelId = channel.id
    await team.save()
    return channel
  } catch (error) {
    console.error('Error creando canal de equipo:', error)
    if (team.channelId) {
      try {
        const ch = await client.channels.fetch(team.channelId)
        if (ch) await ch.delete('Error creando canal de equipo, limpieza')
      } catch {}
    }
    throw error
  }
}

const checkTeamUserHasPerms = async ({ discordId }) => {
  const team = await findTeam({ discordId })

  const member = team.members.find(m => m.userId.discordId === discordId)
  if (!member) return false

  return (member.role === 'leader' || member.role === 'sub-leader')
}

const checkTeamUserIsLeader = async ({ discordId }) => {
  const team = await findTeam({ discordId })

  const member = team.members.find(m => m.userId.discordId === discordId)
  if (!member) return false

  return (member.role === 'leader')
}

/**
 * Expulsa a un miembro del equipo usando su Discord ID.
 * @param {Object} params
 * @param {String} params.teamName - Nombre del equipo.
 * @param {String} params.discordId - ID de Discord del usuario.
 * @returns {Object} equipo actualizado.
 */
const removeMemberFromTeam = async ({ teamName = null, teamCode = null, discordId }) => {
  const team = await findTeam({ teamName, teamCode, discordId })

  const user = await User.findOne({ discordId })

  const memberToRemove = team.members.find(m => m.userId?.discordId === discordId)
  if (!memberToRemove) throw new Error('El usuario no esta en el equipo.')

  // Si el que se va es el líder, se transfiere el rol
  if (memberToRemove.role === 'leader') {
    const subLeaders = team.members.filter(m => m.role === 'sub-leader' && m.userId?.discordId !== discordId)
    const otherMembers = team.members.filter(m => m.userId?.discordId !== discordId)

    let newLeader
    if (subLeaders.length > 0) {
      newLeader = subLeaders[Math.floor(Math.random() * subLeaders.length)]
      newLeader.role = 'leader'
    } else if (otherMembers.length > 0) {
      newLeader = otherMembers[Math.floor(Math.random() * otherMembers.length)]
      newLeader.role = 'leader'
    }
  }

  // Quitar al usuario del equipo
  team.members = team.members.filter(m => m.userId?.discordId !== discordId)

  if (team.members.length === 0) {
    const teamSnapshot = { ...team.toObject() }
    await Team.findByIdAndDelete(team._id)
    user.teamId = null
    await user.save()
    return teamSnapshot
  } else {
    await team.save()
    user.teamId = null
    await user.save()
    return team
  }
}

/**
 * Elimina todos los equipos vacíos de la base de datos y sus referencias.
 * Un equipo se considera vacío si no tiene miembros.
 */
const deleteAllEmptyTeams = async () => {
  const emptyTeams = await Team.find({ members: { $size: 0 } }).populate('members.userId')

  for (const team of emptyTeams) {
    const teamId = team._id

    // Buscar partidos donde participa el equipo
    const matches = await Match.find({
      $or: [{ teamA: teamId }, { teamB: teamId }]
    })

    for (const match of matches) {
      // Si el partido está programado, cancelarlo y avisar al rival
      if (match.status === 'scheduled') {
        await cancelMatch({
          match,
          reason: 'Un equipo se ha retirado del partido.',
          removeTeamId: teamId
        })
      } else {
        // Para partidos ya jugados o cancelados, solo poner teamA/teamB a null si es necesario
        const update = {}
        if (match.teamAId.equals(teamId)) update.teamA = null
        if (match.teamBId.equals(teamId)) update.teamB = null

        if (Object.keys(update).length) {
          await Match.updateOne({ _id: match._id }, update)
        }
      }
    }

    // Eliminar referencias del equipo en temporadas (teams)
    await Season.updateMany(
      {},
      {
        $pull: {
          'divisions.$[].teams': { teamId: teamId }
        }
      }
    )

    // Eliminar referencias del equipo en descansos de rondas manualmente
    const seasons = await Season.find({})
    for (const season of seasons) {
      let modified = false
      for (const division of season.divisions) {
        for (const round of division.rounds) {
          const originalLength = round.resting?.length || 0
          round.resting = (round.resting || []).filter(id => !id.equals(teamId))
          if (round.resting.length !== originalLength) modified = true
        }
      }
      if (modified) {
        await season.save()
      }
    }

    for (const { userId } of team.members) {
      const discordId = userId.discordId
      await removeMemberFromTeam({ discordId })
    }
    // Finalmente eliminar el equipo
    await Team.deleteOne({ _id: teamId })
  }
}

/**
 * Actualiza los canales de equipos según la división y elegibilidad.
 * @param {Object} client - Cliente de Discord.
 */
const updateTeamsChannels = async ({ client }) => {
  const guild = await client.guilds.fetch(config.guild.id)

  const divisions = await Division.find({})
  const divisionMap = Object.fromEntries(divisions.map(d => [d._id.toString(), d.teamsCategoryId]))

  const teams = await Team.find({}).populate('members.userId')

  for (const team of teams) {
    const eligible = checkTeamEligibility(team)

    if (!eligible && team.channelId) {
      try {
        const ch = await guild.channels.fetch(team.channelId).catch(() => null)
        if (ch) await ch.delete('Equipo no elegible - limpieza de canal')
      } catch (err) { throw new Error('Error eliminando canal no elegible:', err) }
      team.channelId = null
      await team.save()
      continue
    }
    if (!eligible) continue

    const categoryId = team.divisionId
      ? divisionMap[team.divisionId.toString()]
      : config.categories.teams.withOutDivision.id

    const expectedName = `${config.team.channels.prefix}${team.name.toLowerCase()}`

    // Intentar por channelId
    let channel = null
    if (team.channelId) {
      channel = await guild.channels.fetch(team.channelId).catch(() => null)
    }

    // Si no encontrado, buscar por name+category para evitar duplicados
    if (!channel) {
      channel = guild.channels.cache.find(c => c.name === expectedName && c.parentId === categoryId) || null
      if (channel && team.channelId !== channel.id) {
        team.channelId = channel.id
        await team.save()
      }
    }

    if (channel) {
      try {
        if (channel.name !== expectedName) await channel.setName(expectedName)
        if (categoryId && channel.parentId !== categoryId) await channel.setParent(categoryId)

        // REAPLICAR perms
        const leaderIds = team.members.filter(m => m.role === 'leader').map(m => m.userId?.discordId).filter(Boolean)
        const subLeaderIds = team.members.filter(m => m.role === 'sub-leader').map(m => m.userId?.discordId).filter(Boolean)
        const memberIds = team.members.filter(m => m.role === 'member').map(m => m.userId?.discordId).filter(Boolean)

        const fetchMember = async id => { try { return await guild.members.fetch(id) } catch { return null } }
        const leaderMembers = (await Promise.all([...leaderIds].map(fetchMember))).filter(Boolean)
        const subLeaderMembers = (await Promise.all([...subLeaderIds].map(fetchMember))).filter(Boolean)
        const normalMembers = (await Promise.all(memberIds.map(fetchMember))).filter(Boolean)

        const fetchRole = async id => { try { return await guild.roles.fetch(id) } catch { return null } }
        const staffRolesResolved = (await Promise.all((config.roles.staff || []).map(fetchRole))).filter(Boolean)

        const parsePerms = names => names.map(name => PermissionsBitField.Flags[name])
        const memberPermissions = parsePerms(config.channels.permissions.member)
        const leaderPermissions = [...memberPermissions, ...parsePerms(config.channels.permissions.leader)]
        const subLeaderPermissions = [...memberPermissions, ...parsePerms(config.channels.permissions.subLeader || [])]
        const staffPermissions = [...memberPermissions, ...parsePerms(config.channels.permissions.staff)]

        const permissionOverwrites = [
          { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          ...leaderMembers.map(m => ({ id: m.id, allow: leaderPermissions })),
          ...subLeaderMembers.map(m => ({ id: m.id, allow: subLeaderPermissions })),
          ...normalMembers.map(m => ({ id: m.id, allow: memberPermissions })),
          ...staffRolesResolved.map(r => ({ id: r.id, allow: staffPermissions }))
        ]

        await channel.permissionOverwrites.set(permissionOverwrites)
      } catch (err) {
        throw new Error(`Error actualizando canal ${channel?.id}:`, err)
      }
    } else {
      // crear si no existe
      try {
        await createTeamChannel({ client, team, categoryId })
      } catch (err) {
        throw new Error('Error creando canal en updateTeamsChannels:', err)
      }
    }
  }
}

/**
 * Genera un codigo random y unico
 */
const generateTeamCode = async () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

  let code
  let exist = true

  while (exist) {
    code = ''
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    // Buscar si ya existe en la colección Team
    const team = await Team.findOne({ code })
    exist = !!team
  }

  return code
}

/**
 * Cambia el codigo de un equipo por uno random
 */
const updateTeamCode = async ({ teamName = null, teamCode = null, discordId = null }) => {
  const team = await findTeam({ teamName, teamCode, discordId })

  team.code = await generateTeamCode()

  await team.save()
  return team
}

/**
 * Crea un nuevo equipo con un único miembro (presidente).
 * @param {Object} params
 * @param {String} params.name - Nombre del equipo.
 * @param {String} params.iconURL - URL del ícono del equipo.
 * @param {String} params.color - Label del color (ej: "Rojo oscuro").
 * @param {String} params.presidentDiscordId - ID de Discord del presidente.
 * @returns {Object} equipo creado.
 */
const createTeam = async ({ name, iconURL, presidentDiscordId, color = 'Blue' }) => {

  if (!name || !iconURL) {
    throw new Error('Faltan datos: name o iconURL.')
  }
  
  const user = await User.findOne({ discordId: presidentDiscordId })
  if (!user) throw new Error('El usuario no esta verificado.')
  if (user.teamId) {
    throw new Error('El usuario ya se encuentra en un equipo.')
  }

  const team = new Team({
    name,
    iconURL,
    color,
    code: await generateTeamCode(),
    members: [{ userId: user._id, role: 'leader' }],
    isEligible: false
  })

  user.teamId = team._id
  await user.save()
  await team.save()
  await team.populate('members.userId')
  return team
}

/**
 * Actualiza los datos de un equipo.
 * @param {Object} params
 * @param {String} params.oldName - Nombre actual.
 * @param {String} [params.newName] - Nuevo nombre.
 * @param {String} [params.iconURL] - Nuevo icono.
 * @param {String} [params.color] - Nuevo label del color.
 * @returns {Object} equipo actualizado.
 */
const updateTeam = async ({ teamName = null, teamCode = null, discordId = null, name, iconURL, color }) => {
  const team = await findTeam({ teamName, teamCode, discordId })

  if (name) team.name = name
  if (iconURL) team.iconURL = iconURL
  if (color) {
    // Elimina un emoji al principio seguido de espacios (si lo hay)
    const normalizedColor = color.replace(/^\p{Extended_Pictographic}\s*/u, '').trim()

    const colorObj = colors.find(c => c.value === normalizedColor)
    if (!colorObj) throw new Error('Color no válido.')

    team.color = colorObj.value // <--- usar el value, no el label
  }

  await team.save()
  return team
}

/**
 * Añade un equipo a una división, validando límite máximo.
 * Mantiene los puntos previos en la temporada activa.
 * @param {Object} params
 * @param {String} [params.teamName] - Nombre del equipo a añadir.
 * @param {String} [params.teamCode] - Código del equipo.
 * @param {String} [params.discordId] - DiscordId de algún miembro del equipo.
 * @param {String} params.divisionName - Nombre de la división destino.
 * @param {Number} params.maxTeams - Máximo de equipos permitidos por división.
 * @returns {Object} team actualizado.
 */
const addTeamToDivision = async ({ teamName = null, teamCode = null, discordId = null, divisionName, maxTeams }) => {
  // 🔹 Buscar división destino
  const division = await Division.findOne({ name: divisionName })
  if (!division) throw new Error('División no encontrada')

  // 🔹 Buscar equipo
  const team = await findTeam({ teamName, teamCode, discordId })
  if (!team) throw new Error('Equipo no encontrado')

  // 🔹 Si ya estaba en esta división, lanzar error
  if (team.divisionId?.toString() === division._id.toString()) {
    throw new Error('El equipo ya está en esta división')
  }

  // 🔹 Validar límite de equipos en la división
  const teamCount = await Team.countDocuments({ divisionId: division._id })
  if (teamCount >= maxTeams) {
    throw new Error('La división ya tiene el número máximo de equipos')
  }

  // 🔹 Manejar temporada activa
  let previousPoints = 0
  const activeSeason = await Season.findOne({ status: 'active' })
  if (activeSeason) {
    // Buscar si el equipo ya estaba en alguna división
    const currentDivision = activeSeason.divisions.find(d =>
      d.teams.some(t => t.teamId.toString() === team._id.toString())
    )
    if (currentDivision) {
      const existingTeam = currentDivision.teams.find(t => t.teamId.toString() === team._id.toString())
      previousPoints = existingTeam?.points || 0
      // Eliminar al equipo de la división anterior
      currentDivision.teams = currentDivision.teams.filter(t => t.teamId.toString() !== team._id.toString())
      await activeSeason.save()
    }
  }

  // 🔹 Actualizar división del equipo
  team.divisionId = division._id
  await team.save()
  await team.populate('divisionId')

  // 🔹 Añadir a la nueva división en la temporada activa
  if (activeSeason) {
    const seasonDivision = activeSeason.divisions.find(d =>
      d.divisionId.toString() === division._id.toString()
    )
    if (seasonDivision) {
      seasonDivision.teams.push({
        teamId: team._id,
        points: previousPoints
      })
      await activeSeason.save()
    }
  }

  return team
}

/**
 * Elimina a un equipo de su división actual.
 * También lo elimina de la temporada activa si existe.
 */
const removeTeamFromDivision = async ({ teamName = null, teamCode = null, discordId = null }) => {
  const team = await findTeam({ teamName, teamCode, discordId })

  if (!team.divisionId) {
    throw new Error('El equipo no pertenece a ninguna división')
  }

  const divisionId = team.divisionId

  // 🔹 Actualizar Team
  team.divisionId = null
  await team.save()

  // 🔹 Si hay temporada activa, sincronizar
  const activeSeason = await Season.findOne({ status: 'active' })
  if (activeSeason) {
    const seasonDivision = activeSeason.divisions.find(d =>
      d.divisionId.toString() === divisionId.toString()
    )
    if (seasonDivision) {
      seasonDivision.teams = seasonDivision.teams.filter(
        t => t.teamId.toString() !== team._id.toString()
      )
      await activeSeason.save()
    }
  }

  return team
}

/**
 * Añade un miembro al equipo usando su Discord ID.
 * @param {Object} params
 * @param {String} params.discordId - ID de Discord del usuario.
 * @returns {Object} equipo actualizado.
 */
const addMemberToTeam = async ({ client, teamName = null, teamCode = null, discordId }) => {
  if (!discordId) {
    throw new Error('Faltan datos: discordId.')
  }

  const user = await User.findOne({ discordId })
  if (user && user.teamId) throw new Error('El usuario ya se encuentra en un equipo.')
  
  const team = await findTeam({ teamName, teamCode, discordId })

  if (team.members.length >= maxMembers) {
    throw new Error(`El equipo ya tiene el maximo de miembros: \`${maxMembers}\``)
  }

  team.members.push({
    userId: user._id,
    role: 'member'
  })
  await team.save()

  user.team = team._id
  await user.save()

  // Determinar categoría para el canal
  const division = team.divisionId
    ? await Division.findById(team.divisionId)
    : null

  const categoryId = division?.teamsCategoryId
    || config.categories.teams.withOutDivision.id

  // Crear canal inmediatamente si el equipo cumple criterios
  if (checkTeamEligibility(team)) {
    await createTeamChannel({ client, team, categoryId })
  }

  return team
}

/**
 * Cambia el role de un miembro del equipo usando su Discord ID.
 * @param {Object} params
 * @param {String} params.teamName - Nombre del equipo.
 * @param {String} params.discordId - ID de Discord del usuario.
 * @param {'leader'|'sub-leader'|'member'} params.newRol - Nuevo role a asignar.
 * @returns {Object} equipo actualizado.
 */
const changeMemberRole = async ({ teamName = null, teamCode = null, discordId, newRole }) => {
  if (!discordId || !newRole) {
    throw new Error('Faltan datos: discordId o newRole.')
  }

  const team = await findTeam({ teamName, teamCode, discordId })
  if (!team) throw new Error('Equipo no encontrado.')

  const member = team.members.find(m => m.userId?.discordId === discordId)
  if (!member) throw new Error('Miembro no encontrado.')

  const isCurrentLeader = member.role === 'leader'

  // ❌ No se puede quitar el rol de líder directamente
  if (isCurrentLeader && newRole !== 'leader') {
    throw new Error('No se puede quitar el rol de líder. Asigna primero a otro miembro como líder.')
  }

  if (newRole === 'leader') {
    if (isCurrentLeader) {
      throw new Error('Este miembro ya es líder.')
    }

    // Buscar al líder actual
    const currentLeader = team.members.find(m => m.role === 'leader')
    if (currentLeader) {
      currentLeader.role = 'sub-leader'
    }

    // Promocionar a este miembro como líder
    member.role = 'leader'
  } else {
    // Cambiar a cualquier otro rol (member o sub-leader)
    member.role = newRole
  }

  await team.save()
  return team
}

const deleteTeam = async ({ teamName = null, teamCode = null, discordId = null }) => {
  const team = await findTeam({ teamName, teamCode, discordId })

    const teamId = team._id

    // Buscar partidos donde participa el equipo
    const matches = await Match.find({
      $or: [{ teamA: teamId }, { teamB: teamId }]
    })

    for (const match of matches) {
      // Si el partido está programado, cancelarlo y avisar al rival
      if (match.status === 'scheduled') {
        await cancelMatch({
          match,
          reason: 'Un equipo se ha retirado del partido.',
          removeTeamId: teamId
        })
      } else {
        // Para partidos ya jugados o cancelados, solo poner teamA/teamB a null si es necesario
        const update = {}
        if (match.teamAId.equals(teamId)) update.teamA = null
        if (match.teamBId.equals(teamId)) update.teamB = null

        if (Object.keys(update).length) {
          await Match.updateOne({ _id: match._id }, update)
        }
      }
    }

    // Eliminar referencias del equipo en temporadas (teams)
    await Season.updateMany(
      {},
      {
        $pull: {
          'divisions.$[].teams': { teamId: teamId }
        }
      }
    )

    // Eliminar referencias del equipo en descansos de rondas manualmente
    const seasons = await Season.find({})
    for (const season of seasons) {
      let modified = false
      for (const division of season.divisions) {
        for (const round of division.rounds) {
          const originalLength = round.resting?.length || 0
          round.resting = (round.resting || []).filter(id => !id.equals(teamId))
          if (round.resting.length !== originalLength) modified = true
        }
      }
      if (modified) {
        await season.save()
      }
    }
    
    for (const { userId } of team.members) {
      const discordId = userId.discordId
      await removeMemberFromTeam({ discordId })
    }

  return team
}

const addPointsToTeam = async ({ teamName, points }) => {
  const season = await getActiveSeason()
  let finded = false
  for (const division of season.divisions) {
    for (const team of division.teams) {
      if (team.teamId.name === teamName) {
        finded = true
        team.points += parseInt(points)
      }
    }
  }
  if (!finded) {
    throw new Error('No se ha encontrado el equipo.')
  }
  await season.save()
  return season
}

const removePointsFromTeam = async ({ teamName, points }) => {
  const season = await getActiveSeason()
  let finded = false
  for (const division of season.divisions) {
    for (const team of division.teams) {
      if (team.teamId.name === teamName) {
        finded = true
        team.points -= parseInt(points)
      }
    }
  }
  if (!finded) {
    throw new Error('No se ha encontrado el equipo.')
  }
  await season.save()
  return season
}

module.exports = {
  checkTeamUserHasPerms,
  checkTeamUserIsLeader,
  deleteAllEmptyTeams,
  updateTeamsChannels,
  generateTeamCode,
  updateTeamCode,
  createTeam,
  updateTeam,
  addTeamToDivision,
  removeTeamFromDivision,
  addMemberToTeam,
  removeMemberFromTeam,
  changeMemberRole,
  deleteTeam,
  addPointsToTeam,
  removePointsFromTeam
}