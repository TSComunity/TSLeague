const { getActiveSeason } = require('./season.js')

const gameModes = require('../configs/gameModes.json')

/**
 * Selecciona 3 sets aleatorios (modo + mapa) que aún no se han jugado en la temporada activa.
 * Usa los pesos de modos y mapas definidos en el JSON.
 * @returns {Object} sets - los sets elegidos.
 */
const generateRandomSets = async () => {
  const season = await getActiveSeason()

  // Mapas ya usados
  const playedMapIds = new Set()
  for (const division of season.divisions) {
    const round = division.rounds[division.rounds.length - 1]
      if (round.set1?.map) playedMapIds.add(round.set1.map)
      if (round.set2?.map) playedMapIds.add(round.set2.map)
      if (round.set3?.map) playedMapIds.add(round.set3.map)
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

  while (selectedModes.length < 3 && weightedModes.length > 0) {
    const mode = weightedModes[Math.floor(Math.random() * weightedModes.length)]
    if (!usedModeIds.has(mode.id)) {
      selectedModes.push(mode)
      usedModeIds.add(mode.id)
    }
  }

  if (selectedModes.length < 3) {
    throw new Error('No hay suficientes modos distintos disponibles para 3 sets.')
  }

  // Para cada modo, seleccionar un mapa por peso
  const sets = {}
  for (let i = 0; i < 3; i++) {
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

    // Elegir mapa aleatorio entre los disponibles
    const map = weightedMaps[Math.floor(Math.random() * weightedMaps.length)]
    sets[`set${i + 1}`] = {
      mode: mode.id,
      map: map.id
    }
  }

  return sets
}

module.exports = { generateRandomSets }