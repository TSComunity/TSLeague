const Season = require('../Esquemas/Season.js')
const Match = require('../Esquemas/Match.js')
const Team = require('../Esquemas/Team.js')

/**
 * Actualiza la elegiblidad de un equipo dependiendo de si tiene mas de 3 miembros o menos y devuelve su elegiblidad.
 * @returns {Boolean} isEligible - Si es elegible o no.
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
          logMatchInfo(opponentId, `El partido contra el equipo eliminado ha sido cancelado. Descansas esta ronda.`)
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

module.exports = { updateTeamEligibility, updateAllTeamsEligibility, deleteEmptyTeams }