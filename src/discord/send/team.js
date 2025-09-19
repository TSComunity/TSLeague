/**
 * Envía un mensaje a un equipo filtrando por rol.
 * @param {Object} team - Equipo al que enviar mensaje.
 * @param {String} rol - Rol al que enviar mensaje.
 * @param {String} content - Contenido del mensaje.
 * @param {Array} files - Archivos ha enviar.
 * @param {Array} embeds - Embeds ha enviar.
 * @param {Array} components - Componentes ha enviar.
 */
const sendTeamDM = async ({ client, team, rol = 'jugador', content = '', files = [], embeds = [], components = [] }) => {
  if (!team?.members || team.members.length === 0) throw new Error('El equipo no tiene jugadores')

  const members = (() => {
    if (rol === 'leader') {
      return team.members.filter(member => member.rol === 'leader')
    } else if (rol === 'sub-leader') {
      return team.members.filter(member => member.rol === 'sub-leader' || member.rol === 'leader')
    } else if (rol === 'member') {
      return team.members
    }
  })()

  for (const member of members) {
    try {
      const user = await client.users.fetch(member.discordId)
      if (!user) continue

      await user.send({
        content,
        files,
        embeds,
        components
      })
    } catch (err) {
      console.warn(`No se pudo enviar MD a ${member.discordId} - ${err.message}`)
    }
  }
}

module.exports = { sendTeamDM }