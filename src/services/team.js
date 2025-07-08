const Season = require('../Esquemas/Season.js')
const Match = require('../Esquemas/Match.js')
const Team = require('../Esquemas/Team.js')

const { cancelMatch } = require('./match.js')

const { sendTeamDM } = require('../discord/send.js')
const { getMatchCancelledEmbeds } = require('../discord/embeds/match.js')

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
const deleteEmptyTeams = async () => {
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

module.exports = { checkTeamEligibility, updateAllTeamsEligibility, deleteEmptyTeams }