const Season = require('../Esquemas/Season.js')
const Match = require('../Esquemas/Match.js')
const Team = require('../Esquemas/Team.js')

const { sendTeamDM } = require('../discord/send.js')

const { getMatchCancelledEmbeds } = require('../discord/embeds/match.js')

/**
 * Actualiza la elegiblidad de un equipo dependiendo de si tiene mas de 3 miembros o menos y devuelve su elegiblidad.
 * @param {Object} team - Equipo a checkear.
 * @returns {Boolean} isEligible - Si es elegible o no.
 */

const checkTeamEligibility = async ({ team }) => {
  if (!team) {
    throw new Error('Faltan datos: team')
  }

  const isEligible = (team.players && team.players.length >= 3)
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
    const isEligible = (team.players && team.players.length >= 3)
    team.isEligible = isEligible
    await team.save()
  }
}

/**
 * Elimina todos los equipos vacíos de la base de datos y sus referencias.
 * Un equipo se considera vacío si no tiene jugadores.
 */

const deleteEmptyTeams = async () => {
  const emptyTeams = await Team.find({ Jugadores: { $size: 0 } })

  for (const team of emptyTeams) {
    const teamId = team._id

    // Buscar partidos donde participa el equipo
    const matches = await Match.find({
      $or: [{ teamA: teamId }, { teamB: teamId }]
    })

    for (const match of matches) {
      // Si el partido está programado, cancelarlo y avisar al rival
      if (match.status === 'scheduled') {
        // Identificar el equipo rival
        const opponentId = match.teamA.equals(teamId) ? match.teamB : match.teamA

        // Actualizar el partido
        const update = {
          status: 'cancelled'
        }
        if (match.teamA.equals(teamId)) update.teamA = null
        if (match.teamB.equals(teamId)) update.teamB = null

        await Match.updateOne({ _id: match._id }, update)

        // Notificar al equipo rival
        if (opponentId) {
          const opponent = Team.findOne({ _id: opponentId })
          sendTeamDM({
            team: opponent,
            embeds: getMatchCancelledEmbeds({ team: opponent, match })
          })
        }
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
          'divisions.$[].teams': { team: teamId }
        }
      }
    )

    // Eliminar referencias del equipo en descansos de rondas
    // Como MongoDB no soporta dos $[] anidados, haremos esta lógica manualmente:
    const seasons = await Season.find({})
    for (const season of seasons) {
      let modified = false
      for (const division of season.divisions) {
        for (const round of division.rounds) {
          const originalLength = round.resting.length
          round.resting = round.resting.filter(id => !id.equals(teamId))
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