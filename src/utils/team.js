const Team = require('../models/Team.js')
const User = require('../models/User.js')

const findTeam = async ({ teamName = null, teamCode = null, discordId = null }) => {
  if (!teamName && !teamCode && !discordId) {
    throw new Error('Faltan datos: teamName, teamCode o discordId.')
  }

  let team = null

  // Buscar por nombre de equipo
  if (teamName) {
    team = await Team.findOne({ name: teamName }).populate('members.userId').populate('divisionId')
  }

  // Buscar por código de equipo
  else if (teamCode) {
    team = await Team.findOne({ code: teamCode }).populate('members.userId').populate('divisionId')
  }

  // Buscar por Discord ID
  else if (discordId) {
    const user = await User.findOne({ discordId })

    if (!user) throw new Error('El usuario no esta verificado.')

    // Si el usuario tiene un teamId vinculado
    if (user.teamId) {
      team = await Team.findById(user.teamId).populate('members.userId').populate('divisionId')

      if (!team) {
          user.teamId = null
          await user.save()
      }
    }

    // Si no tiene teamId, buscar por miembro directo en algún equipo
    if (!team) {
      team = await Team.findOne({ 'members.userId': user._id }).populate('members.userId').populate('divisionId')
      if (team) {
        user.teamId = team._id
        await user.save()
      }
    }

    if (!team) throw new Error('El usuario no se encuentra en ningún equipo.')
  }

  if (!team) throw new Error('Equipo no encontrado.')

  return team
}

module.exports = { findTeam }