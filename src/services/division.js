const Division = require('../Esquemas/Division.js')
const Team = require('../Esquemas/Team.js')
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

/**
 * Calcula ascensos, descensos y expulsiones en todas las divisiones
 * @param {Object} season - Objeto Season con divisiones y equipos
*/
const calculatePromotionRelegationFinal = async ({ season }) => {
  if (!season || !Array.isArray(season.divisions)) throw new Error("season inválido");

  const allDivisions = [...season.divisions].sort(
    (a, b) => (a?.divisionId?.tier ?? 0) - (b?.divisionId?.tier ?? 0)
  );

  const result = [];

  for (let i = 0; i < allDivisions.length; i++) {
    const division = allDivisions[i];
    const teams = (division.teams || []).sort((a, b) => (b.points || 0) - (a.points || 0));

    const isFirst = i === 0;
    const isLast = i === allDivisions.length - 1;

    const incoming = i > 0 ? result[i - 1].relegated.length : 0;
    let availableSlots = maxTeams - (teams.length + incoming);

    // Calculamos movimientos según reglas simplificadas
    const calcMove = (count) => {
      if (count >= maxTeams) return 3;
      if (count >= 7) return 2;
      if (count >= 4) return 1;
      return 0;
    };

    const promotions = !isFirst ? Math.min(calcMove(teams.length), availableSlots) : 0;
    const relegations = !isLast ? Math.min(calcMove(teams.length - promotions), availableSlots) : 0;
    const expulsions = isLast ? Math.min(calcMove(teams.length - promotions), availableSlots) : 0;

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