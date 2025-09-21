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

// calculatePromotionRelegation (versión final, lista para copiar/pegar)
// - Asume en scope: Team, User y tu variable global de config maxTeams.
// - Devuelve únicamente `result` (array por división con promoted/relegated/stayed/expelled/winner).

const calculatePromotionRelegation = async ({ season } = {}) => {
  if (!season || !Array.isArray(season.divisions)) {
    throw new Error("season inválido");
  }

  // Funciones de cálculo dinámico (máximo movimiento posible)
  const calcPromotions = (count) => {
    if (count >= maxTeams) return 3;
    if (count >= 10) return 2;
    if (count >= 8) return 1;
    return 0;
  };
  const calcRelegations = (count) => {
    if (count >= maxTeams) return 3;
    if (count >= 10) return 2;
    if (count >= 8) return 1;
    return 0;
  };

  // ordenar divisiones (tier ascendente, 0 = primera)
  const allDivisions = [...season.divisions].sort(
    (a, b) => (a?.divisionId?.tier ?? 0) - (b?.divisionId?.tier ?? 0)
  );
  const n = allDivisions.length;

  // equipos por división ordenados por puntos
  const teamsArr = allDivisions.map(d =>
    (d.teams || []).slice().sort((a, b) => (b.points || 0) - (a.points || 0))
  );
  const origCounts = teamsArr.map(a => a.length);

  // vectores de movimiento
  let promotionsFrom = Array(n).fill(0);
  let relegationsFrom = Array(n).fill(0);

  // aplicar reglas base
  for (let i = 1; i < n; i++) promotionsFrom[i] = calcPromotions(origCounts[i]);
  for (let i = 0; i < n - 1; i++) relegationsFrom[i] = calcRelegations(origCounts[i]);

  // ajustar movimientos para no sobrepasar maxTeams
  const adjustCounts = () => {
    const finalCounts = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const incomingFromBelow = (promotionsFrom[i + 1] || 0);
      const incomingFromAbove = (relegationsFrom[i - 1] || 0);
      finalCounts[i] =
        origCounts[i] -
        (promotionsFrom[i] || 0) -
        (relegationsFrom[i] || 0) +
        incomingFromBelow +
        incomingFromAbove;
    }
    return finalCounts;
  };

  for (let iter = 0; iter < 20; iter++) {
    const finalCounts = adjustCounts();
    let changed = false;

    for (let i = 0; i < n; i++) {
      if (finalCounts[i] > maxTeams) {
        if (i < n - 1) {
          relegationsFrom[i]++;
          changed = true;
        } else {
          // última división: no puede pasar del límite → expulsiones después
        }
      }
    }
    if (!changed) break;
  }

  // expulsiones en la última división si sigue llena
  const finalCountsNow = adjustCounts();
  let expulsions = 0;
  const lastIdx = n - 1;
  if (finalCountsNow[lastIdx] > maxTeams) {
    expulsions = finalCountsNow[lastIdx] - maxTeams;
  }

  // seleccionar equipos concretos
  const arrCopies = teamsArr.map(a => a.slice());
  const result = [];

  for (let i = 0; i < n; i++) {
    const arr = arrCopies[i];

    // Promovidos
    const pCount = promotionsFrom[i] || 0;
    const promotedIds =
      pCount > 0 ? arr.splice(0, Math.min(pCount, arr.length)).map(t => t.teamId) : [];

    // Relegados
    let relegatedIds = [];
    if (i < n - 1) {
      const rCount = relegationsFrom[i] || 0;
      if (rCount > 0) {
        const take = Math.min(rCount, arr.length);
        relegatedIds = arr.splice(arr.length - take, take).map(t => t.teamId);
      }
    }

    // Expulsados
    let expelledIds = [];
    if (i === lastIdx && expulsions > 0) {
      const take = Math.min(expulsions, arr.length);
      expelledIds = arr.splice(arr.length - take, take).map(t => t.teamId);
    }

    // Ganador (solo primera división)
    let winnerArr = [];
    if (i === 0 && arr.length > 0) {
      const sortedArr = arr.slice().sort((a, b) => (b.points || 0) - (a.points || 0));
      const winnerTeam = sortedArr[0];
      if (winnerTeam) {
        winnerArr.push(winnerTeam.teamId);
        const idx = arr.findIndex(t => t.teamId.toString() === winnerTeam.teamId.toString());
        if (idx > -1) arr.splice(idx, 1);
      }
    }

    const stayedIds = arr.map(t => t.teamId);

    result.push({
      divisionId: allDivisions[i].divisionId,
      promoted: promotedIds,
      relegated: relegatedIds,
      stayed: stayedIds,
      expelled: expelledIds,
      winner: winnerArr
    });
  }

  // aplicar cambios a la DB (promoted, relegated, expelled, winners)
  for (let i = 0; i < result.length; i++) {
    const r = result[i];
    if (r.promoted.length && i > 0) {
      const prevDivision = allDivisions[i - 1];
      for (const teamId of r.promoted) {
        try { await Team.findByIdAndUpdate(teamId, { divisionId: prevDivision.divisionId }); } catch {}
      }
    }
    if (r.relegated.length && i < n - 1) {
      const nextDivision = allDivisions[i + 1];
      for (const teamId of r.relegated) {
        try { await Team.findByIdAndUpdate(teamId, { divisionId: nextDivision.divisionId }); } catch {}
      }
    }
    if (r.expelled.length) {
      for (const teamId of r.expelled) {
        try { await Team.findByIdAndUpdate(teamId, { divisionId: null }); } catch {}
      }
    }
    if (r.winner.length) {
      for (const teamId of r.winner) {
        try {
          await Team.findByIdAndUpdate(teamId, { $inc: { "stats.leaguesWon": 1 } });
          const teamDoc = await Team.findById(teamId).lean();
          if (teamDoc?.members) {
            for (const m of teamDoc.members) {
              try { await User.findByIdAndUpdate(m.userId, { $inc: { "leagueStats.leaguesWon": 1 } }); } catch {}
            }
          }
        } catch {}
      }
    }
  }

  return result;
};

module.exports = { createDivision, deleteDivision, updateDivision, calculatePromotionRelegation }