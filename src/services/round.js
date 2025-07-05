const Season = require('../../Esquemas/Season.js')
const Match = require('../../Esquemas/Match.js')

const { generateMatches } = require('./matchmaking.js')
const { endSeason } = require('./season.js')

const { season } = require('../../configs/league.js')
const { maxRounds } = season

/**
 * Añade una nueva ronda a cada división de la temporada activa con partidos generados automáticamente.
 * Crea documentos Match, los guarda en la base de datos y los vincula a la temporada.
 * Si se ha alcanzado el máximo de rondas permitido en cualquier división, termina la temporada.
 * @returns {Object} season - La temporada actualizada.
 */

const addRound = async () => {
  const season = await Season.findOne({ active: true })
  if (!season) throw new Error('No active season found')

  const seasonId = season._id
  let divisionsWithoutMatches = 0

  // Comprobar si alguna división ya ha alcanzado maxRounds
  const divisionMaxReached = season.divisions.some(division => division.rounds.length >= maxRounds)

  if (divisionMaxReached) {
    // Si alguna división ya tiene maxRounds, terminamos la temporada
    await endSeason(season)
    return season
  }

  // Si no, añadimos la ronda nueva
  for (const division of season.divisions) {
    const divisionId = division.division
    const teamsIds = division.teams.map(team => team.team)

    // Recolectar partidos ya existentes (IDs referenciados)
    const existingMatchIds = division.rounds.flatMap(r => r.matches)

    // Buscar los partidos reales desde la colección Match para evitar duplicados reales
    const existingMatches = await Match.find({ _id: { $in: existingMatchIds } })

    const nextRoundIndex = division.rounds.length + 1

    // Generar nuevos partidos completos (con todos los campos del schema Match)
    const { matches: newMatches, resting} = generateMatches({
      existingMatches,
      teamsIds,
      seasonId,
      divisionId,
      roundIndex: nextRoundIndex
    })

    if (newMatches.length === 0 && resting.length === 0) {
      // Si no se pueden generar partidos nuevos para esta división, contamos
      divisionsWithoutMatches++
      continue
    }

    // Guardar los partidos en el esquema Match
    const savedMatches = await Match.insertMany(newMatches)

    // Añadir nueva ronda al documento Season (solo los ObjectIds de los partidos)
    division.rounds.push({
      roundIndex: nextRoundIndex,
      matches: savedMatches.map(m => m._id),
      resting
    })
  }

  // Si ninguna división pudo generar partidos (ejemplo: todos jugaron todo), terminamos temporada
  if (divisionsWithoutMatches === season.divisions.length) {
    await endSeason(season)
  } else {
    await season.save()
  }

  return season
}

module.exports = { addRound }