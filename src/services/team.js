const Season = require('../Esquemas/Season.js')
const Division = require('../Esquemas/Division.js')
const Match = require('../Esquemas/Match.js')
const Team = require('../Esquemas/Team.js')
const User = require('../Esquemas/User.js')

const { cancelMatch } = require('./match.js')

const colors = require('../configs/colors.json')
const config = require('../configs/league.js')
const maxTeams = config.division.maxTeams
const maxMembers = config.team.maxMembers

const findTeam = async ({ teamName = null, teamCode = null, discordId = null }) => {
  if (!teamName && !teamCode && !discordId) {
    throw new Error('Faltan datos: teamName, teamCode o discordId.')
  }
  let team
  let user
  if (teamName) {
      team = await Team.findOne({ name: teamName }).populate('members.userId')
  } else if (teamCode) {
      team = await Team.findOne({ code: teamCode }).populate('members.userId')
  } else if (discordId) {
      const user = await User.findOne({ discordId })
      if (!user || !user.teamId) throw new Error('El usuario no esta en ningun equipo.')

      team = await Team.findById(user.teamId).populate('members.userId')
  }

  if (!team) throw new Error('Equipo no encontrado.')

  return team
}

const checkTeamUserHasPerms = async ({ discordId }) => {
  const team = await findTeam({ discordId })

  const member = team.members.filter(m => m.userId.discordId === discordId)

  return (member.role === 'leader' || member.role === 'sub-leader')
}

/**
 * Actualiza la elegibilidad de un equipo dependiendo de si tiene al menos 3 miembros y devuelve su elegibilidad.
 * @param {Object} team - Equipo a checkear.
 * @returns {Boolean} isEligible - Si es elegible o no.
 */
const checkTeamEligibility = async ({ teamName = null, teamCode = null, discordId = null }) => {
  const team = await findTeam({ teamName, teamCode, discordId })

  const isEligible = (team.members && team.members.length >= 3)
  team.isEligible = isEligible
  await team.save()
  return isEligible
}

/**
 * Actualiza la elegibilidad de todos los equipos en la base de datos.
 * Recorre todos los equipos, actualiza su propiedad isEligible y guarda los cambios.
 */
const updateAllTeamsEligibility = async () => {
  const teams = await Team.find({})
  for (const team of teams) {
    const isEligible = (team.members && team.members.length >= 3)
    team.isEligible = isEligible
    await team.save()
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

    for (const discordId of team.members.userId.discordId) {
      await removeMemberFromTeam({ discordId })
    }
    // Finalmente eliminar el equipo
    await Team.deleteOne({ _id: teamId })
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
    for (let i = 0; i < 6; i++) {
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

  const team = await Team.create({
    name,
    iconURL,
    color,
    code: await generateTeamCode(),
    members: [{ userId: user._id, role: 'leader' }],
    isEligible: false
  })

  user.teamId = team._id
  await user.save()
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
  if (!team) throw new Error('Equipo no encontrado.')

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
 * @param {Object} params
 * @param {String} params.teamName - Nombre del equipo a añadir.
 * @param {String} params.divisionName - Nombre de la división destino.
 * @param {Number} params.maxTeams - Máximo de equipos permitidos por división.
 * @returns {Object} team actualizado.
 */
const addTeamToDivision = async ({ teamName = null, teamCode = null, discordId = null, divisionName }) => {
  const division = await Division.findOne({ name: divisionName })
  if (!division) throw new Error('División no encontrada.')

  const team = await findTeam({ teamName, teamCode, discordId })

  if (team.divisionId?.toString() === division._id.toString()) {
    throw new Error('El equipo ya está en esta división.')
  }

  const teamCount = await Team.countDocuments({ divisionId: division._id })
  if (teamCount >= maxTeams) {
    throw new Error('La división ya tiene el número máximo de equipos.')
  }

  team.divisionId = division._id
  await team.save()
  await team.populate('divisionId')

  return team
}

/**
 * Elimina a un equipo de su división actual.
 * @param {Object} params
 * @param {String} params.teamName - Nombre del equipo a eliminar de la división.
 * @returns {Object} team actualizado.
 */
const removeTeamFromDivision = async ({ teamName = null, teamCode = null, discordId = null }) => {
  const team = await findTeam({ teamName, teamCode, discordId })
  if (!team) throw new Error('Equipo no encontrado.')

  team.divisionId = null
  await team.save()
  return team
}

/**
 * Añade un miembro al equipo usando su Discord ID.
 * @param {Object} params
 * @param {String} params.discordId - ID de Discord del usuario.
 * @returns {Object} equipo actualizado.
 */
const addMemberToTeam = async ({ teamName = null, teamCode = null, discordId }) => {
  if (!discordId) {
    throw new Error('Faltan datos: discordId.')
  }

  const user = await User.findOne({ discordId })
  if (user && user.teamId) throw new Error('El usuario ya se encuentra en un equipo.')
  
  const team = await findTeam({ teamName, teamCode, discordId})

  if (team.members.length >= maxMembers) {
    throw new Error(`El equipo ya tiene el maximo de miembros: \`${maxMembers}\``)
  }

  team.members.push({
    userId: user._id,
    role: 'Member'
  })
  await team.save()

  user.team = team._id
  await user.save()

  return team
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
    const subLeaders = team.members.filter(m => m.role === 'sub-leader' && m.userId?.discordId !== discordId);
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

  team.isEligible = team.members.length >= 3
  await team.save()

  user.teamId = null
  await user.save()

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
  if (!discordId || !newRol) {
    throw new Error('Faltan datos: discordId o newRole.')
  }

  const team = findTeam({ teamName, teamCode, discordId })

  const member = team.members.find(m => m.userId?.discordId === discordId)
  if (!member) throw new Error('Miembro no encontrado.')

  const isAlreadyLeader = member.role === 'leader'

  if (newRole === 'leader') {
    if (isAlreadyLeader) throw new Error('Este miembro ya es líder.')

    // Baja a sublíder al líder actual (si hay uno distinto)
    const currentLeaders = team.members.filter(m => m.role === 'leader')
    if (currentLeaders.length >= 1) {
      const otherLeader = currentLeaders.find(m => m.userId?.discordId !== discordId)
      if (otherLeader) otherLeader.role = 'subleader'
    }

    // Asigna líder al nuevo miembro
    member.role = 'leader'
  } else {
    // Cambiar a cualquier otro rol (normal)
    member.role = newRole
  }

  await team.save()
  return team
}

const deleteTeam = async ({ teamName, teamCode, discordId }) => {
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

    for (const discordId of team.members.userId.discordId) {
      await removeMemberFromTeam({ discordId })
    }
    // Finalmente eliminar el equipo
    const deletedTeam = await Team.deleteOne({ _id: teamId })

  return deletedTeam
}

module.exports = {
  findTeam,
  checkTeamUserHasPerms,
  checkTeamEligibility,
  updateAllTeamsEligibility,
  deleteAllEmptyTeams,
  generateTeamCode,
  updateTeamCode,
  createTeam,
  updateTeam,
  addTeamToDivision,
  removeTeamFromDivision,
  addMemberToTeam,
  removeMemberFromTeam,
  changeMemberRole,
  deleteTeam
}