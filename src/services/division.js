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

  const allDivisions = [...season.divisions].sort(
    (a, b) => (a?.divisionId?.tier ?? 0) - (b?.divisionId?.tier ?? 0)
  );

  const result = [];

  for (let i = 0; i < allDivisions.length; i++) {
    const division = allDivisions[i];
    const teams = (division.teams || []).sort((a, b) => (b.points || 0) - (a.points || 0));

    const isFirst = i === 0;
    const isLast = i === allDivisions.length - 1;

    const previousResult = result[i - 1];
    const incoming = previousResult ? previousResult.relegated.length : 0;

    // Si no hay equipos y no entran, no hacer nada
    if (teams.length === 0 && incoming === 0) {
      result.push({ divisionId: division.divisionId, promoted: [], relegated: [], stayed: [], expelled: [] });
      continue;
    }

    // Slots disponibles en esta división
    let availableSlots = Math.max(0, maxTeams - (teams.length + incoming));

    // Cálculo de ascensos/descensos según tamaño
    const calcPromotions = (count) => {
      if (count >= 12) return 4;
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

    let promotions = !isFirst ? Math.min(calcPromotions(teams.length), availableSlots) : 0;
    let relegations = !isLast
      ? Math.min(calcRelegations(teams.length - promotions), (allDivisions[i + 1]?.teams?.length ?? 0) < maxTeams ? 3 : 0)
      : 0;

    let expulsions = 0;

    // Última división: expulsar progresivamente si tiene demasiados equipos
    if (isLast) {
      const afterChanges = teams.length - promotions + incoming;
      if (afterChanges > 9) {
        if (afterChanges <= 10) expulsions = 1;
        else if (afterChanges <= 11) expulsions = 2;
        else expulsions = 3;
      }
      // Seguridad: nunca expulsar si hay muy pocos
      if (teams.length <= 5) expulsions = 0;
    }

    const promoted = !isFirst ? teams.slice(0, promotions).map(t => t.teamId) : [];
    const relegated = !isLast ? teams.slice(-relegations).map(t => t.teamId) : [];
    const expelled = isLast ? teams.slice(-expulsions).map(t => t.teamId) : [];
    const stayed = teams
      .map(t => t.teamId)
      .filter(t => !promoted.includes(t) && !relegated.includes(t) && !expelled.includes(t));

    // Actualizar DB
    const previousDivision = allDivisions[i - 1];
    const nextDivision = allDivisions[i + 1];

    for (const teamId of promoted) if (previousDivision) await Team.findByIdAndUpdate(teamId, { divisionId: previousDivision.divisionId });
    for (const teamId of relegated) if (nextDivision) await Team.findByIdAndUpdate(teamId, { divisionId: nextDivision.divisionId });
    for (const teamId of expelled) await Team.findByIdAndUpdate(teamId, { divisionId: null });

    result.push({ divisionId: division.divisionId, promoted, relegated, stayed, expelled });
  }

  return result;
};

module.exports = { createDivision, deleteDivision, updateDivision, calculatePromotionRelegation }