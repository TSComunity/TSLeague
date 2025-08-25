const { EmbedBuilder } = require('discord.js')
const { channels, guild } = require('../../configs/league.js')
const { logs } = channels

const EMOJI_MAP = {
  season: { emoji: '📅', title: 'Logs de Temporada' },
  division: { emoji: '🏆', title: 'Logs de División' },
  team: { emoji: '👥', title: 'Logs de Equipo' },
  points: { emoji: '⭐', title: 'Logs de Puntos' },
  default: { emoji: 'ℹ️', title: 'Logs del Sistema' }
}

const COLOR_MAP = {
  success: 'Green',
  warning: 'Yellow',
  danger: 'Red',
  info: 'Blue',
  default: 'Grey',
}

/**
 * Envía un log al canal específico de logs
 * @param {String} content - Contenido del mensaje.
 * @param {Client} options.client - Instancia de Discord.js
 * @param {String} [type] - Tipo de log: 'success', 'warning', 'danger', 'info', 'default'.
 * @param {String} [userId] - ID del usuario responsable del log.
 * @param {String} [eventType] - Tipo de evento: 'season', 'division', 'team', 'points', 'default'.
 */
const sendLog = async ({ content, client, type = 'default', userId, eventType = 'default' }) => {
  const channel = await client.channels.fetch(logs.id)
  if (!channel) throw new Error('No se ha encontrado el canal')

  let footerData = {}
  if (userId && guild?.id) {
    try {
      const guildObj = await client.guilds.fetch(guild.id)
      const member = await guildObj.members.fetch(userId)
      footerData = {
        text: member.displayName,
        iconURL: member.displayAvatarURL()
      }
    } catch (e) {
      footerData = { text: `@${userId}` }
    }
  }

  const { emoji, title } = EMOJI_MAP[eventType] || EMOJI_MAP.default
  // Formatear cada línea de la descripción con '> '
  const formattedContent = (content || 'No se ha proporcionado ningun mensaje.')
    .split('\n').map(line => `> ${line}`).join('\n')

  const embed = new EmbedBuilder()
    .setColor(COLOR_MAP[type] || COLOR_MAP.default)
    .setTitle(`${emoji} ${title}`)
    .setDescription(formattedContent)

  if (footerData.name) {
    embed.setFooter(footerData)
    embed.setTimestamp()
  }

  await channel.send({ embeds: [embed] })
}

module.exports = { sendLog }