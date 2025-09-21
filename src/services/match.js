const { ChannelType, PermissionsBitField, MessageFlags } = require('discord.js')

const Match = require('../models/Match')
const Team = require('../models/Team')

const { getActiveSeason } = require('../utils/season.js')
const { getCurrentRoundNumber } = require('../utils/round.js')
const { findMatch } = require('../utils/match.js')
const { getDate, checkDeadline } = require('../utils/date.js')
const { generateMatchPreviewImageURL, generateMatchResultsImageURL } = require('../utils/canvas.js')

const { getMatchInfoEmbed } = require('../discord/embeds/match.js')

const { guild: guildConfig, categories, channels, roles, match: matchConfig } = require('../configs/league.js')

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
    const leaderIds = [leaderA, leaderB].filter(Boolean)

    // 3. Miembros normales (sin incluir líderes), extraer sus discordId
    const normalMembersA = teamA.members
      .filter(m => m.role !== 'leader')
      .map(m => m.userId?.discordId)
      .filter(Boolean)

    const normalMembersB = teamB.members
      .filter(m => m.role !== 'leader')
      .map(m => m.userId?.discordId)
      .filter(Boolean)
    
    const memberIds = [...normalMembersA, ...normalMembersB].filter(Boolean)

    const guild = await client.guilds.fetch(guildConfig.id)

    const parsePerms = (names) => names.map(name => PermissionsBitField.Flags[name]);

    const normalPermissions = parsePerms(channels.permissions.member)
    const leaderPermissions = [...normalPermissions, ...parsePerms(channels.permissions.leader)]
    const staffPermissions = [...normalPermissions, ...parsePerms(channels.permissions.staff)]

    const permissionOverwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      ...leaderIds.map(id => ({ id, allow: leaderPermissions })),
      ...memberIds.map(id => ({ id, allow: normalPermissions })),
      ...roles.staff.map(id => ({ id, allow: staffPermissions }))
    ]

    for (const overwrite of permissionOverwrites) {
      try { const resolved =  
        guild.roles.cache.get(overwrite.id)
          || await guild.members.fetch(overwrite.id).catch(() => null)

        if (!resolved) {
          console.warn(`❌ ID no encontrado: ${overwrite.id}`)
        } else {
          console.log(`✅ ID válido: ${overwrite.id}`)
        }
      } catch (err) {
        console.error(`💥 Error al verificar ID ${overwrite.id}:`, err)
      }
    }


    // 6. Crear el canal en la categoría indicada
    const guildToUse = await client.guilds.fetch(guild.id)
    const channel = await guildToUse.channels.create({
      name: `${matchConfig.channels.prefix}partido-${matchToUpd.matchIndex}`,
      type: ChannelType.GuildText,
      parent: categories.matches.id,
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
    if (match.channelId) {
      try {
        const channel = await client.channels.fetch(match.channelId);
        if (channel) await channel.delete('Error al crear el canal del partido, limpieza de canal');
      } catch (err) {
        console.error('No se pudo eliminar el canal tras error:', err);
      }
    }

    await Match.findByIdAndDelete(match._id);

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
  const match = await findMatch({ matchIndex, seasonIndex, teamAName, teamBName })

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
const changeMatchScheduledAt = async ({ matchIndex, seasonIndex, teamAName, teamBName, day, hour, minute }) => {
  const match = await findMatch({ matchIndex, seasonIndex, teamAName, teamBName })

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
          components: [await getMatchInfoEmbed({ match })],
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