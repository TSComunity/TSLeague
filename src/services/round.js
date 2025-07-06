const Season = require('../Esquemas/Season.js')
const Match = require('../Esquemas/Match.js')
const Team = require('../Esquemas/Team.js')


const { generateMatchmaking } = require('./matchmaking.js')
const { generateRandomSets } = require('./sets.js')
const { endSeason } = require('./season.js')

const { sendAnnouncement } = require('../discord/send.js')
const { getRoundAddedEmbeds } = require('../discord/embeds/round.js') // Recuerda actualizar esta función también

const { season } = require('../configs/league.js')
const { maxRounds } = season

/**
 * Añade una nueva ronda a cada división de la temporada activa con partidos generados automáticamente.
 * Crea documentos Match, los guarda en la base de datos y los vincula a la temporada.
 * Si se ha alcanzado el máximo de rondas permitido en cualquier división, termina la temporada.
 * @returns {Object} season - La temporada actualizada.
 */

const addRound = async () => {
  // 1. Obtener la temporada activa y poblar los datos de las divisiones para acceder a sus nombres
  const season = await Season.findOne({ status: 'active' }).populate('divisions.divisionId')
  if (!season) throw new Error('Ninguna temporada activa encontrada')

  const seasonId = season._id
  // Arrays para almacenar información de las divisiones procesadas para el anuncio de Discord
  const divisionsSkipped = [] // Divisiones que no tendrán una nueva ronda
  const divisionsWithNewRounds = [] // Divisiones a las que se les añadió una nueva ronda

  // 2. Comprobar si alguna división ya ha alcanzado el número máximo de rondas
  const divisionMaxReached = season.divisions.some(
    (division) => division.rounds.length >= maxRounds
  )

  if (divisionMaxReached) {
    // Si alguna división ya alcanzó el máximo, se termina la temporada actual
    return await endSeason()
  }

  // 3. Iterar sobre cada división para añadir una nueva ronda o marcarla como finalizada
  for (const division of season.divisions) {
    // division.divisionId ahora es el objeto completo de la División gracias al populate
    const { divisionId: divisionDoc, status, teams, rounds } = division

    // Si la división ya ha terminado, la contamos y continuamos
    if (status === 'ended') {
      divisionsSkipped.push({
        divisionDoc
      })
      continue
    }

    // 4. Recolectar IDs de partidos existentes para evitar duplicados en la generación
    const matchesIds = rounds.flatMap((round) =>
      round.matches.map((matchObj) => matchObj.matchId)
    )
    const matchesDocs = await Match.find({ _id: { $in: matchesIds } })

    // 5. Obtener los IDs de los equipos y sus documentos completos para el matchmaking
    const teamsIds = teams.map((team) => team.teamId)
    const teamsDocs = await Team.find({ _id: { $in: teamsIds } })

    const nextRoundIndex = rounds.length + 1

    // 6. Generar nuevos partidos y equipos que descansan para la siguiente ronda
    const { newMatchesDocs, newRestingTeamsDocs } = generateMatchmaking({
      matchesDocs,
      teamsDocs,
      seasonId,
      divisionId: divisionDoc._id, // Ese es el id por el populate
      nextRoundIndex,
    })

    // 7. Si no se pudieron generar partidos para esta división, la marcamos como finalizada
    if (newMatchesDocs.length === 0) {
      division.status = 'ended' // Marca la división como terminada en el objeto de la temporada
      divisionsSkipped.push({
        divisionDoc
      })
      continue
    }

    // 8. Guardar los nuevos documentos de partido en la base de datos
    const savedMatches = await Match.insertMany(newMatchesDocs)

    const { set1, set2, set3 } = generateRandomSets()

    // 9. Crear el objeto de la nueva ronda
    const newRound = {
      roundIndex: nextRoundIndex,
      set1,
      set2,
      set3
      matches: savedMatches.map((match) => match._id), // Guarda solo los _id de los partidos
      resting: newRestingTeamsDocs.map(team => team._id),
    }

    // 10. Añadir la nueva ronda al array de rondas de la división
    division.rounds.push(newRound)

    // 11. Acumular datos para el anuncio de Discord
    divisionsWithNewRounds.push({
      divisionDoc,
      newMatchesDocs,
      newRestingTeamsDocs
    })
  }

  // 12. Guardar todos los cambios en el documento de la temporada (nuevas rondas, estados de división)
  // Se ejecuta siempre después de procesar todas las divisiones
  await season.save()

  // 13. Comprobar si la temporada debe terminar después de guardar los cambios
  if (divisionsSkipped.length === season.divisions.length) {
    // Si todas las divisiones se quedaron sin partidos o ya estaban terminadas, la temporada finaliza
    return await endSeason()
  }

  // 14. Enviar un anuncio general a Discord con la información acumulada
  await sendAnnouncement({
    content: '@everyone',
    embeds: getRoundAddedEmbeds({
      divisionsWithNewRounds,
      divisionsSkipped,
      nextRoundIndex
    }),
  })

  // Aqui se podria enviar md a la gente

  return season
}

module.exports = { addRound }