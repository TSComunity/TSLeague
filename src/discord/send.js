const { channels } = require('../configs/league.js')
const { announcements, logs } = channels

/**
 * Envía un anuncio al canal de anuncios
 * @param {String} content - Contenido del mensaje.
 * @param {Array} embeds - Embeds ha enviar.
 * @param {Array} files - Archivos ha enviar.
 * @param {Client} options.client - Instancia de Discord.js
 */

const sendAnnouncement = async ({ content = '', files = [], embeds = [], components = [], client }) => {
  const channel = await client.channels.fetch(announcements.id)

  if (!channel) throw new Error('No se ha encontrado el canal')

  await channel.send({
    content,
    files,
    embeds,
    components
  })
}

/**
 * Envía un mensaje a un equipo filtrando por rol.
 * @param {Object} teamDoc - Equipo al que enviar mensaje.
 * @param {String} rol - Rol al que enviar mensaje.
 * @param {String} content - Contenido del mensaje.
 * @param {Array} embeds - Embeds ha enviar.
 * @param {Array} files - Archivos ha enviar.
 * @param {Client} options.client - Instancia de Discord.js
 */

const sendTeamDM = async ({ teamDoc, rol = 'jugador', content = '', files = [], embeds = [], components = [], client }) => {
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

/**
 * Envía un log al canal específico de logs
 * @param {String} content - Contenido del mensaje.
 * @param {Array} embeds - Embeds ha enviar.
 * @param {Array} files - Archivos ha enviar.
 * @param {Client} options.client - Instancia de Discord.js
 */

const sendLog = async ({ content = '', files = [], embeds = [], components = [], client }) => {
  const channel = await client.channels.fetch(logs.id)

  if (!channel) throw new Error('No se ha encontrado el canal')

  await channel.send({
    content,
    files,
    embeds,
    components
  })
}

module.exports = { sendAnnouncement, sendTeamDM, sendLog }