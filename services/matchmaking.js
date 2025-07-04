/**
 * Devuelve información aleatoria para un partido.
 * @return {Object} matchData - Data del partido.
 */

const getRandomMatchData = () => {
  return {
    scheduledAt,
    mode,
    map,
  }
}

/**
 * Genera partidos round-robin evitando repeticiones.
 * @param {Array} existingMatches - Partidos ya existentes para evitar repeticiones.
 * @param {Array} teamsIds - IDs de los equipos que participan.
 * @returns {Array} matches - Partidos nuevos generados.
 */

const generateMatches = ({ existingMatches, teamsIds }) => {
  const alreadyPlayed = new Set()

  // Rellenar set con partidos ya jugados o programados (sin importar orden)
  existingMatches.forEach(({ teamA, teamB }) => {
    const key = [teamA.toString(), teamB.toString()].sort().join('-')
    alreadyPlayed.add(key)
  })

  const matches = []

  for (let i = 0; i < teamsIds.length; i++) {
    for (let j = i + 1; j < teamsIds.length; j++) {
      const key = [teamsIds[i].toString(), teamsIds[j].toString()].sort().join('-')
      if (alreadyPlayed.has(key)) continue // evitar repetidos

      const { scheduledAt, mode, map} = getRandomMatchData()

      matches.push({
        teamA: teamsIds[i],
        teamB: teamsIds[j],
        scoreA: 0,
        scoreB: 0,
        scheduledAt,
        status: 'scheduled',
        mode,
        map,
        imageURL // TODO: usar funcion para crear la imagen
      })
    }
  }

  return matches
}

module.exports = { generateMatches }