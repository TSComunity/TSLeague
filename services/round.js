const Season = require('../Esquemas/Season.js')

const { generateMatches } = require('./matchmaking.js')

/**
 * Añade una nueva ronda a cada división de la temporada activa con partidos generados automáticamente.
 * @returns {Object} season - La temporada actualizada.
 */

const addRound = async () => {
  const season = await Season.findOne({ active: true })
  if (!season) throw new Error('No active season found')

  // Iterar sobre cada división en la temporada
  for (const division of season.divisions) {
    const teamsIds = division.teams.map(team => team.team)

    // Recolectar todos los partidos existentes en esta división
    let existingMatches = []
    division.rounds.forEach(round => {
      existingMatches = existingMatches.concat(round.matches)
    })

    // Generar nuevos partidos sin repetir para esta división
    const newMatches = generateMatches({ existingMatches, teamsIds })

    if (newMatches.length === 0) {
      console.log(`No new matches to schedule for division ${division.division}`)
      continue; // Si quieres, puedes lanzar un error aquí en vez de continuar
    }

    // Calcular el nuevo índice de ronda para esta división
    const nextRoundIndex = division.rounds.length + 1

    // Añadir la nueva ronda con partidos generados
    division.rounds.push({
      roundIndex: nextRoundIndex,
      matches: newMatches
    })
  }

  await season.save()
  return season
}

module.exports = { addRound }