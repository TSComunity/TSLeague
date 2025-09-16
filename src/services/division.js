const Division = require('../Esquemas/Division.js')
const Team = require('../Esquemas/Team.js')
const { division } = require('../configs/league.js')
const { minTeams, maxTeams } = division

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

/**
 * Calcula ascensos, descensos y expulsiones en todas las divisiones
 * @param {Object} season - Objeto Season con divisiones y equipos
 */
const calculatePromotionRelegation = async ({ season }) => {
  if (!season || !Array.isArray(season.divisions)) throw new Error("season inválido");

  const allDivisions = [...season.divisions].sort(
    (a, b) => (a?.divisionId?.tier ?? 0) - (b?.divisionId?.tier ?? 0)
  );

  const teamCounts = allDivisions.map((division) => (division.teams || []).length);
  const movements = calculateMovements(teamCounts);

  const result = [];

  for (let index = 0; index < allDivisions.length; index++) {
    const division = allDivisions[index];

    // Ordenar por puntos descendente
    const teams = (division.teams || []).sort((a, b) => (b.points || 0) - (a.points || 0));

    const movePromotion = movements[index].promotions;
    const moveRelegation = movements[index].relegations;
    const moveExpulsion = movements[index].expulsions;

    const isFirst = index === 0;
    const isLast = index === allDivisions.length - 1;

    const promoted = !isFirst ? teams.slice(0, movePromotion).map((t) => t.teamId) : [];
    const relegated = !isLast ? teams.slice(-moveRelegation).map((t) => t.teamId) : [];
    const expelled = isLast ? teams.slice(-moveExpulsion).map((t) => t.teamId) : [];
    const stayed = teams
      .map((t) => t.teamId)
      .filter((t) => !promoted.includes(t) && !relegated.includes(t) && !expelled.includes(t));

    // Actualizar DB
    const previousDivision = allDivisions[index - 1];
    const nextDivision = allDivisions[index + 1];

    for (const teamId of promoted) {
      if (previousDivision) {
        await Team.findByIdAndUpdate(teamId, { divisionId: previousDivision.divisionId });
      }
    }
    for (const teamId of relegated) {
      if (nextDivision) {
        await Team.findByIdAndUpdate(teamId, { divisionId: nextDivision.divisionId });
      }
    }
    for (const teamId of expelled) {
      await Team.findByIdAndUpdate(teamId, { divisionId: null });
    }

    result.push({ divisionId: division.divisionId, promoted, relegated, stayed, expelled });
  }

  return result;
};

/**
 * Calcula los movimientos por división
 */
function calculateMovements(teamCounts) {
  const movements = teamCounts.map((count) => ({
    current: count,
    incoming: 0,
    promotions: 0,
    relegations: 0,
    expulsions: 0,
    afterIncoming: count,
  }));

  // Paso 1: movimientos básicos
  for (let i = 0; i < movements.length; i++) {
    const mov = movements[i];
    const isFirst = i === 0;
    const isLast = i === movements.length - 1;

    if (mov.current >= minTeams) {
      mov.promotions = isFirst ? 0 : getBaseMoves(mov.current);
      mov.relegations = isLast ? 0 : getBaseMoves(mov.current);
      mov.expulsions = isLast ? getBaseMoves(mov.current) : 0;

      if (mov.current % 2 !== 0 && !isFirst) {
        mov.promotions += 1;
      }
    }
  }

  // Paso 2: incoming
  for (let i = 0; i < movements.length - 1; i++) {
    movements[i + 1].incoming = movements[i].relegations;
    movements[i + 1].afterIncoming = movements[i + 1].current + movements[i + 1].incoming;
  }

  // Paso 3: recalcular si revive una división
  for (let i = 1; i < movements.length; i++) {
    const mov = movements[i];
    const isLast = i === movements.length - 1;

    if (mov.current < minTeams && mov.afterIncoming >= minTeams) {
      mov.promotions = getBaseMoves(mov.afterIncoming);
      mov.relegations = isLast ? 0 : getBaseMoves(mov.afterIncoming);
      mov.expulsions = isLast ? getBaseMoves(mov.afterIncoming) : 0;

      if (mov.afterIncoming % 2 !== 0) {
        mov.promotions += 1;
      }

      if (i + 1 < movements.length) {
        movements[i + 1].incoming = mov.relegations;
        movements[i + 1].afterIncoming = movements[i + 1].current + movements[i + 1].incoming;
      }
    }
  }

  // Paso 4: balancear
  balanceAndOptimize(movements);

  return movements;
}

/**
 * Ajusta movimientos para no pasar min/max
 */
function balanceAndOptimize(movements) {
  // Ajustar sobrecapacidad
  for (let i = 0; i < movements.length; i++) {
    const mov = movements[i];
    let finalCount = mov.afterIncoming - mov.relegations - mov.expulsions;

    if (finalCount > maxTeams) {
      const excess = finalCount - maxTeams;
      if (i > 0) {
        const prevMov = movements[i - 1];
        prevMov.relegations = Math.max(0, prevMov.relegations - excess);
        mov.incoming = prevMov.relegations;
        mov.afterIncoming = mov.current + mov.incoming;
      }
    }
  }

  // Segunda pasada
  for (let i = 0; i < movements.length; i++) {
    const mov = movements[i];
    let finalCount = mov.afterIncoming - mov.relegations - mov.expulsions;

    if (finalCount > maxTeams) {
      const excess = finalCount - maxTeams;
      if (i === movements.length - 1) {
        mov.expulsions += excess;
      } else {
        mov.relegations += excess;
        if (i + 1 < movements.length) {
          movements[i + 1].incoming = mov.relegations;
          movements[i + 1].afterIncoming = movements[i + 1].current + movements[i + 1].incoming;
        }
      }
    }
  }

  // Optimizar última división
  const lastIndex = movements.length - 1;
  if (lastIndex >= 0) {
    const last = movements[lastIndex];
    const wouldHave = last.afterIncoming;

    if (wouldHave > maxTeams) {
      const toRemove = wouldHave - maxTeams;
      const maxPromotions = Math.min(3, wouldHave - minTeams);
      last.promotions = Math.min(maxPromotions, Math.ceil(toRemove * 0.6));
      last.expulsions = Math.max(0, toRemove - last.promotions);
    }
  }
}

/**
 * Número base de ascensos/descensos según equipos
 */
function getBaseMoves(teamCount) {
  if (teamCount >= 11) return 3;
  if (teamCount >= 9) return 2;
  if (teamCount >= 7) return 1;
  return 0;
}

module.exports = { createDivision, deleteDivision, updateDivision, calculatePromotionRelegation }