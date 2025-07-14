const { channels } = require('../../configs/league.js')
const { announcements } = channels

/**
 * Envía un anuncio al canal de anuncios
 * @param {String} content - Contenido del mensaje.
 * @param {Array} embeds - Embeds ha enviar.
 * @param {Array} files - Archivos ha enviar.
 * @param {Client} options.client - Instancia de Discord.js
 */

const sendAnnouncement = async ({ client, content = '', files = [], embeds = [], components = [], client }) => {
  const channel = await client.channels.fetch(announcements.id)

  if (!channel) throw new Error('No se ha encontrado el canal')

  await channel.send({
    content,
    files,
    embeds,
    components
  })
}

module.exports = { sendAnnouncement }