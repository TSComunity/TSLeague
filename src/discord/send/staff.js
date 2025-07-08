const { channels } = require('../configs/league.js')
const { logs } = channels

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

module.exports = { sendLog }