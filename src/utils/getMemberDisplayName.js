/**
 * Obtiene el nombre visible de un usuario en un servidor (nickname o username).
 * @param {string} userId - El ID del usuario.
 * @returns {Promise<string>} El nickname si lo tiene, o el username.
 */
const getMemberDisplayName = async ({ guild, discordId }) => {
  try {
    const member = await guild.members.fetch(discordId)
    return member.displayName
  } catch (error) {
    throw new Error(`No se pudo obtener el nombre del usuario ${discordId}`)
  }
}

module.exports = { getMemberDisplayName }