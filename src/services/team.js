const Season = require('../Esquemas/Season.js')
const Division = require('../Esquemas/Division.js')
const Match = require('../Esquemas/Match.js')
const Team = require('../Esquemas/Team.js')
const User = require('../Esquemas/User.js')

const { cancelMatch } = require('./match.js')

const colors = require('../configs/colors.json')
const config = require('../configs/league.js')
const maxTeams = config.division.maxTeams

/**
 * Actualiza la elegibilidad de un equipo dependiendo de si tiene al menos 3 miembros y devuelve su elegibilidad.
 * @param {Object} team - Equipo a checkear.
 * @returns {Boolean} isEligible - Si es elegible o no.
 */
const checkTeamEligibility = async ({ team }) => {
  if (!team) throw new Error('Faltan datos: team.')

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
  const emptyTeams = await Team.find({ members: { $size: 0 } })

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
        if (match.teamA.equals(teamId)) update.teamA = null
        if (match.teamB.equals(teamId)) update.teamB = null

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
const updateTeamCode = async ({ teamName }) => {
  const team = await Team.findOne({ name: teamName })
  if (!team) throw new Error('Equipo no encontrado.')
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
const createTeam = async ({ name, iconURL, color, presidentDiscordId }) => {
  const colorObj = colors.find(c => c.label === color)
  const colorValue = colorObj ? colorObj.value : null

  if (!colorValue) throw new Error('Color no válido.')

  const user = await User.findOne({ discordId: presidentDiscordId })
  if (!user) throw new Error('Usuario no encontrado.')

  const team = await Team.create({
    name,
    iconURL,
    color: colorValue,
    code: generateTeamCode(),
    members: [{ userId: user._id, rol: 'leader' }],
    isEligible: false
  })

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
const updateTeam = async ({ oldName, newName, iconURL, color }) => {
  const team = await Team.findOne({ name: oldName })
  if (!team) throw new Error('Equipo no encontrado.')

  if (newName) team.name = newName
  if (iconURL) team.iconURL = iconURL
  if (color) {
    const colorObj = colors.find(c => c.label === color)
    const colorValue = colorObj ? colorObj.value : null
    if (!colorValue) throw new Error('Color no válido.')
    team.color = colorValue
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
const addTeamToDivision = ({ teamName, divisionName }) => {
  const division = await Division.findOne({ name: divisionName })
  if (!division) throw new Error('División no encontrada.')

  const team = await Team.findOne({ name: teamName })
  if (!team) throw new Error('Equipo no encontrado.')

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
const removeTeamFromDivision = ({ teamName }) => {
  const team = await Team.findOne({ name: teamName })
  if (!team) throw new Error('Equipo no encontrado.')

  team.divisionId = null
  await team.save()
  return team
}

/**
 * Expulsa a un miembro del equipo usando su Discord ID.
 * @param {Object} params
 * @param {String} params.teamName - Nombre del equipo.
 * @param {String} params.discordId - ID de Discord del usuario.
 * @returns {Object} equipo actualizado.
 */
const removeMemberFromTeam = ({ teamName, discordId }) => {
  const team = await Team.findOne({ name: teamName }).populate('members.userId')
  if (!team) throw new Error('Equipo no encontrado.')

  const initialLength = team.members.length
  team.members = team.members.filter(m => m.userId?.discordId !== discordId)

  if (team.members.length === initialLength) {
    throw new Error('El miembro no estaba en el equipo.')
  }

  team.isEligible = team.members.length >= 3
  await team.save()
  return team
}

/**
 * Cambia el rol de un miembro del equipo usando su Discord ID.
 * @param {Object} params
 * @param {String} params.teamName - Nombre del equipo.
 * @param {String} params.discordId - ID de Discord del usuario.
 * @param {'leader'|'sub-leader'|'member'} params.newRol - Nuevo rol a asignar.
 * @returns {Object} equipo actualizado.
 */
const changeMemberRole = ({ teamName, discordId, newRol }) => {
  const team = await Team.findOne({ name: teamName }).populate('members.userId')
  if (!team) throw new Error('Equipo no encontrado.')

  const member = team.members.find(m => m.userId?.discordId === discordId)
  if (!member) throw new Error('Miembro no encontrado.')

  const currentLeaders = team.members.filter(m => m.rol === 'leader')
  const isAlreadyLeader = member.rol === 'leader'

  // Si estamos intentando subir a líder y ya hay 2 líderes, lanzar error
  if (newRol === 'leader' && !isAlreadyLeader && currentLeaders.length >= 2) {
    throw new Error('No puede haber más de 2 líderes en el equipo.')
  }

  member.rol = newRol
  await team.save()
  return team
}

module.exports = {
  checkTeamEligibility,
  updateAllTeamsEligibility,
  deleteAllEmptyTeams,
  generateTeamCode,
  updateTeamCode,
  createTeam,
  updateTeam,
  addTeamToDivision,
  removeTeamFromDivision,
  removeMemberFromTeam,
  changeMemberRole
}