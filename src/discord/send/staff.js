const { EmbedBuilder } = require('discord.js')
const { channels } = require('../configs/league.js')
const { logs } = channels

/**
 * Envía un log al canal específico de logs
 * @param {String} content - Contenido del mensaje.
 * @param {Client} options.client - Instancia de Discord.js
 * @param {String} [type] - Tipo de log: 'success', 'warning', 'danger', 'info', 'default'.
 */
const COLOR_MAP = {
  success: 'Green',
  warning: 'Yellow',
  danger: 'Red',
  info: 'Blue',
  default: 'Grey',
}

const sendLog = async ({ content, client, type = 'default' }) => {
  const channel = await client.channels.fetch(logs.id)

  if (!channel) throw new Error('No se ha encontrado el canal')

  const embed = new EmbedBuilder()
    .setColor(COLOR_MAP[type] || COLOR_MAP.default)
    .setDescription(content || 'No se ha proporcionado ningun mensaje.')

  await channel.send({
    embeds: [embed]
  })
}

module.exports = { sendLog }