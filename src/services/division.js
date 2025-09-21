const Division = require('../models/Division.js')
const Team = require('../models/Team.js')
const { division } = require('../configs/league.js')
const { maxTeams } = division

/**
 * Crea una nueva división si el nombre y el tier no están en uso.
 * @param {string} name - Nombre de la división.
 * @param {number} tier - Tier numérico (prioridad).
 * @returns {Object} newDivision - La división creada.
 */
const createDivision = async ({ name, tier, emoji, color }) => {
  if (!name || !tier || !emoji || !color) {
    throw new Error('Faltan datos: name, tier, emoji o color.')
  }

  const divisions = await Division.find()
  const divisionsNames = divisions.map(div => div.name)
  const divisionsTiers = divisions.map(div => div.tier)

  if (divisionsNames.includes(name)) {
    throw new Error('Ya existe una división con ese nombre.')
  }

  if (divisionsTiers.includes(tier)) {
    throw new Error('Ya existe una división con ese tier.')
  }

  const newDivision = new Division({ name, tier, emoji, color })

  await newDivision.save()
  return newDivision
}

/**
 * Elimina una división por su nombre.
 * @param {string} name - Nombre de la división.
 * @returns {Object} division - División eliminada.
 */
const deleteDivision = async ({ name }) => {
    if (!name) {
    throw new Error('Debes proporcionar un nombre.')
    }

    const division = await Division.findOne({ name })

    if (!division) {
    throw new Error('No se encontró la división.')
    }

    const teams = await Team.find({ divisionId: division._id })
    for (const team of teams) {
      team.divisionId = null
      await team.save()
    }

    await division.deleteOne()
    return division
}

/**
 * Actualiza una división existente por su nombre.
 * @param {string} name - Nombre actual de la división.
 * @param {string} newName - Nuevo nombre (opcional).
 * @param {number} newTier - Nuevo tier (opcional).
 * @returns {Object} division - División actualizada.
 */
const updateDivision = async ({ name, newName, newTier, newEmoji, newColor }) => {
    if (!name) {
        throw new Error('Debes proporcionar un nombre.')
    }

    const division = await Division.findOne({ name })

    if (!division) {
        throw new Error('No se encontró la división.')
    }

    if (newName) {
        const nameExists = await Division.findOne({ name: newName })
        if (nameExists && nameExists._id.toString() !== division._id.toString()) {
            throw new Error('Ya existe otra división con ese nuevo nombre.')
        }
        division.name = newName
    }

    if (newTier) {
        const tierExists = await Division.findOne({ tier: newTier })
        if (tierExists && tierExists._id.toString() !== division._id.toString()) {
            throw new Error('Ya existe otra división con ese tier.')
        }
        division.tier = newTier
    }

    if (newEmoji) {
        division.emoji = newEmoji
    }
    if (newColor) {
        division.color = newColor
    }

    await division.save()
    return division
}

const calculatePromotionRelegation = async ({ season, maxTeams = 12 }) => {
  if (!season || !Array.isArray(season.divisions)) {
    throw new Error("season inválido");
  }

  // Orden por tier ascendente (0 = top)
  const allDivisions = [...season.divisions].sort(
    (a, b) => (a?.divisionId?.tier ?? 0) - (b?.divisionId?.tier ?? 0)
  );

  const n = allDivisions.length;
  // equipos ordenados por puntos desc (para seleccionar top/bottom)
  const teamsArr = allDivisions.map(d => ((d.teams || []).slice().sort((a, b) => (b.points || 0) - (a.points || 0))));

  // conteos originales
  const origCounts = teamsArr.map(t => t.length);

  // funciones de regla (ajustadas: máximo 3 ascensos si count >= 12)
  const calcPromotions = (count) => {
    if (count >= 12) return 3;
    if (count >= 10) return 2;
    if (count >= 8) return 1;
    return 0;
  };
  const calcRelegations = (count) => {
    if (count >= 12) return 3;
    if (count >= 10) return 2;
    if (count >= 8) return 1;
    return 0;
  };

  // parámetros de seguridad/tuning
  const minRemainWhenMoving = 2; // intentar dejar al menos 2 equipos en una división (evita vaciados)
  const minExpelSafety = 5; // nunca expulsar si la división original tenía <= 5 equipos

  // vectores que parchearemos hasta convergencia
  let promotionsFrom = Array(n).fill(0); // promos desde i -> i-1
  let relegationsFrom = Array(n).fill(0); // releg desde i -> i+1

  const arraysEqual = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

  // iteramos para que promos/relegs se ajusten mutuamente (bastan pocas iteraciones)
  for (let iter = 0; iter < 10; iter++) {
    const prevProm = promotionsFrom.slice();
    const prevRel = relegationsFrom.slice();

    // cálculo de counts 'instantáneos' dada la última estimación de movimientos
    const currentCounts = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const incomingFromAbove = i > 0 ? relegationsFrom[i - 1] : 0;
      currentCounts[i] = origCounts[i] - promotionsFrom[i] + incomingFromAbove;
    }

    // PROMOCIONES: decidir cuántos subir de cada división (excepto la primera)
    for (let i = 0; i < n; i++) {
      if (i === 0) {
        promotionsFrom[i] = 0; // la primera no puede ascender
        continue;
      }
      const desired = calcPromotions(currentCounts[i]);
      const availablePrev = Math.max(0, maxTeams - currentCounts[i - 1]); // huecos en la división anterior
      const maxByRemain = Math.max(0, currentCounts[i] - minRemainWhenMoving); // no dejar menos que minRemain
      const allowed = Math.min(desired, availablePrev, maxByRemain);
      promotionsFrom[i] = allowed;
    }

    // Recalcular counts tras promociones provisionales
    for (let i = 0; i < n; i++) {
      const incomingFromAbove = i > 0 ? relegationsFrom[i - 1] : 0;
      currentCounts[i] = origCounts[i] - promotionsFrom[i] + incomingFromAbove;
    }

    // RELEGACIONES: decidir cuántos bajar de cada división (excepto la última, que expulsará)
    for (let i = 0; i < n; i++) {
      if (i === n - 1) {
        relegationsFrom[i] = 0; // la última no 'desciende' — expulsiones se calculan al final
        continue;
      }
      const desired = calcRelegations(currentCounts[i]);
      const nextCount = currentCounts[i + 1]; // estado del siguiente ahora
      const availableNext = Math.max(0, maxTeams - nextCount);
      const maxByRemain = Math.max(0, currentCounts[i] - minRemainWhenMoving);
      const allowed = Math.min(desired, availableNext, maxByRemain);
      relegationsFrom[i] = allowed;
    }

    // comprobar convergencia
    if (arraysEqual(prevProm, promotionsFrom) && arraysEqual(prevRel, relegationsFrom)) break;
  }

  // Calcular estado final de conteos (tras promos y relegs calculados)
  const finalCounts = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const incomingFromAbove = i > 0 ? relegationsFrom[i - 1] : 0;
    finalCounts[i] = origCounts[i] - promotionsFrom[i] + incomingFromAbove;
  }

  // Calcular expulsiones para la última división (si sigue excedida)
  const lastIdx = n - 1;
  let expulsions = 0;
  if (finalCounts[lastIdx] > maxTeams) {
    const after = finalCounts[lastIdx];
    if (after <= 9) expulsions = 0;
    else if (after === 10) expulsions = 1;
    else if (after === 11) expulsions = 2;
    else expulsions = 3;
    if (origCounts[lastIdx] <= minExpelSafety) expulsions = 0;
    const overflow = after - maxTeams;
    expulsions = Math.min(expulsions || 0, Math.max(0, overflow));
    if (!expulsions && overflow > 0 && origCounts[lastIdx] > minExpelSafety) {
      expulsions = overflow;
    }
  }

  // Seleccionar equipos: evitar solapamientos (sacamos los promovidos del principio, luego relegados del final, etc.)
  const result = [];

  for (let i = 0; i < n; i++) {
    const division = allDivisions[i];
    const arr = teamsArr[i].slice(); // copia mutada

    // Promovidos (top)
    const pCount = promotionsFrom[i] || 0;
    const promotedIds = pCount > 0 ? arr.splice(0, Math.min(pCount, arr.length)).map(t => t.teamId) : [];

    // Relegados (bottom)
    let relegatedIds = [];
    if (i < n - 1) {
      const rCount = relegationsFrom[i] || 0;
      if (rCount > 0) {
        const take = Math.min(rCount, arr.length);
        relegatedIds = arr.splice(arr.length - take, take).map(t => t.teamId);
      }
    }

    // Expulsados (solo última división)
    let expelledIds = [];
    if (i === lastIdx && expulsions > 0) {
      const take = Math.min(expulsions, arr.length);
      expelledIds = arr.splice(arr.length - take, take).map(t => t.teamId);
    }

    // 🔹 Winner (solo primera división)
    let winnerArr = [];
    if (i === 0 && arr.length > 0) {
      const sortedArr = arr.slice().sort((a, b) => (b.points || 0) - (a.points || 0));
      const winnerTeam = sortedArr[0];
      winnerArr.push({ teamId: winnerTeam.teamId, name: winnerTeam.name });
      // Incrementar stats.leaguesWon
      await Team.findByIdAndUpdate(winnerTeam.teamId, { $inc: { "stats.leaguesWon": 1 } }).catch(() => {});
    }

    // Stayed
    const stayedIds = arr.map(t => t.teamId);

    result.push({
      divisionId: division.divisionId,
      promoted: promotedIds,
      relegated: relegatedIds,
      stayed: stayedIds,
      expelled: expelledIds,
      winner: winnerArr
    });
  }

  // Actualizar DB: promover, relegar, expulsar
  for (let i = 0; i < result.length; i++) {
    const r = result[i];
    if (r.promoted && r.promoted.length) {
      const prevDivision = allDivisions[i - 1];
      if (prevDivision) {
        for (const teamId of r.promoted) {
          await Team.findByIdAndUpdate(teamId, { divisionId: prevDivision.divisionId }).catch(() => {});
        }
      }
    }
  }

  for (let i = 0; i < result.length; i++) {
    const r = result[i];
    if (r.relegated && r.relegated.length) {
      const nextDivision = allDivisions[i + 1];
      if (nextDivision) {
        for (const teamId of r.relegated) {
          await Team.findByIdAndUpdate(teamId, { divisionId: nextDivision.divisionId }).catch(() => {});
        }
      }
    }
  }

  for (let i = 0; i < result.length; i++) {
    const r = result[i];
    if (r.expelled && r.expelled.length) {
      for (const teamId of r.expelled) {
        await Team.findByIdAndUpdate(teamId, { divisionId: null }).catch(() => {});
      }
    }
  }

  return result;
};

module.exports = { createDivision, deleteDivision, updateDivision, calculatePromotionRelegation }