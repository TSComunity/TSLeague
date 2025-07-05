const { channels } = require('../configs/league.js')
const { announcements, logs } = channels

/**
 * Envía un anuncio al canal de anuncios
 * @param {String} content - Contenido del mensaje.
 * @param {Array} embeds - Embeds ha enviar.
 * @param {Array} files - Archivos ha enviar.
 * @param {Client} options.client - Instancia de Discord.js
 */

const sendAnnouncement = async ({ content, embeds = [], files = [], client }) => {
  const channel = await client.channels.fetch(announcements.id)
  await channel.send({ content, embeds, files })
}

/**
 * Envía un mensaje a un equipo filtrando por rol.
 * @param {Object} team - Equipo al que enviar mensaje.
 * @param {String} rol - Rol al que enviar mensaje.
 * @param {String} content - Contenido del mensaje.
 * @param {Array} embeds - Embeds ha enviar.
 * @param {Array} files - Archivos ha enviar.
 * @param {Client} options.client - Instancia de Discord.js
 */

const sendTeamDM = async ({ team, rol, content, embeds = [], files = [], client }) => {
  if (!team?.players || team.players.length === 0) return

  const recipients = rol
    ? team.players.filter(p => p.rol === rol)
    : team.players

  for (const member of recipients) {
    try {
      const user = await client.users.fetch(member.discordId)
      if (!user) continue

      await user.send({ content, embeds, files })
    } catch (err) {
      console.warn(`❌ No se pudo enviar MD a ${member.discordId} - ${err.message}`)
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

const sendLog = async ({ content, embeds = [], files = [], client }) => {
  const channel = await client.channels.fetch(logs.id)
  await channel.send({ content, embeds, files })
}

module.exports = { sendAnnouncement, sendTeamDM, sendLog }