const { EmbedBuilder } = require('discord.js')
const { channels } = require('../configs/league.js')
const { logs } = channels

/**
 * Envía un log al canal específico de logs
 * @param {String} content - Contenido del mensaje.
 * @param {Array} embeds - Embeds ha enviar.
 * @param {Array} files - Archivos ha enviar.
 * @param {Client} options.client - Instancia de Discord.js
 */

const sendLog = async ({ content, client }) => {
  const channel = await client.channels.fetch(logs.id)

  if (!channel) throw new Error('No se ha encontrado el canal')

  const embed = new EmbedBuilder()
    .setColor('Yellow')
    .setDescription(content || 'No se ha proporcionado ningun mensaje.')

  await channel.send({
    embeds: [embed]
  })
}

module.exports = { sendLog }