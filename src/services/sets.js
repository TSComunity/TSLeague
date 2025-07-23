const { getActiveSeason } = require('../utils/season.js')

const gameModes = require('../configs/gameModes.json')
const configs = require('../configs/league.js')

/**
 * Selecciona sets aleatorios (modo + mapa) que aún no se han jugado en la temporada activa.
 * Usa los pesos de modos y mapas definidos en el JSON.
 * @returns {Object} sets - los sets elegidos.
 */
const generateRandomSets = async () => {
  const defaultSetsLength = configs.match.defaultSetsLength
  const season = await getActiveSeason()

  // Mapas ya usados
  const playedMapIds = new Set()
  for (const division of season.divisions) {
    const round = division.rounds[division.rounds.length - 1]
    if (round && round.sets && Array.isArray(round.sets)) {
      for (const set of round.sets) {
        if (set?.map) playedMapIds.add(set.map)
      }
    }
  }


  // Crear lista de modos con pesos (sin repetir modo)
  const availableModes = gameModes

  const weightedModes = []
  for (const mode of availableModes) {
    for (let i = 0; i < mode.weight; i++) {
      weightedModes.push(mode)
    }
  }

  const selectedModes = []
  const usedModeIds = new Set()

  while (selectedModes.length < defaultSetsLength && weightedModes.length > 0) {
    const mode = weightedModes[Math.floor(Math.random() * weightedModes.length)]
    if (!usedModeIds.has(mode.id)) {
      selectedModes.push(mode)
      usedModeIds.add(mode.id)
    }
  }

  if (selectedModes.length < defaultSetsLength) {
    throw new Error(`No hay suficientes modos distintos disponibles para ${defaultSetsLength} sets.`)
  }

  // Para cada modo, seleccionar un mapa por peso
  const sets = []
  for (let i = 0; i < defaultSetsLength; i++) {
    const mode = selectedModes[i]
    const availableMaps = mode.maps.filter(map => !playedMapIds.has(map.id))

    const weightedMaps = []
    for (const map of availableMaps) {
      for (let j = 0; j < map.weight; j++) {
        weightedMaps.push(map)
      }
    }

    if (weightedMaps.length === 0) {
      throw new Error(`No hay mapas disponibles para el modo ${mode.id}`)
    }

    const map = weightedMaps[Math.floor(Math.random() * weightedMaps.length)]

    sets.push({
      mode: mode.id,
      map: map.id,
      winner: null
    })
  }

  return sets
}

module.exports = { generateRandomSets }