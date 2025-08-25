const { EmbedBuilder } = require('discord.js');
const { channels, guild } = require('../../configs/league.js');
const { logs } = channels;

const EMOJI_MAP = {
  season: { emoji: '📅', footer: 'Evento de Temporada' },
  division: { emoji: '🏆', footer: 'Evento de División' },
  team: { emoji: '👥', footer: 'Evento de Equipo' },
  points: { emoji: '⭐', footer: 'Evento de Puntos' },
  round: { emoji: '🔄', footer: 'Evento de Ronda' },
  join: { emoji: '➕', footer: 'Unión a Equipo' },
  leave: { emoji: '➖', footer: 'Salida de Equipo' },
  promote: { emoji: '⬆️', footer: 'Ascenso de Miembro' },
  default: { emoji: 'ℹ️', footer: 'Log del Sistema' }
};

const COLOR_MAP = {
  success: 'Green',
  warning: 'Yellow',
  danger: 'Red',
  info: 'Blue',
  default: 'Grey',
};

/**
 * Envía un log al canal específico de logs
 * @param {String} content - Contenido del mensaje.
 * @param {Client} options.client - Instancia de Discord.js
 * @param {String} [type] - Tipo de log: 'success', 'warning', 'danger', 'info', 'default'.
 * @param {String} [userId] - ID del usuario responsable del log.
 * @param {String} [eventType] - Tipo de evento: 'season', 'division', 'team', 'points', 'round', 'join', 'leave', 'promote', 'default'.
 */
const sendLog = async ({ content, client, type = 'default', userId, eventType = 'default' }) => {
  const channel = await client.channels.fetch(logs.id);
  if (!channel) throw new Error('No se ha encontrado el canal');

  let authorData = {};
  if (userId && guild?.id) {
    try {
      const guildObj = await client.guilds.fetch(guild.id);
      const member = await guildObj.members.fetch(userId);
      authorData = {
        name: member.displayName,
        iconURL: member.displayAvatarURL()
      };
    } catch (e) {
      authorData = { name: `ID: ${userId}` };
    }
  }

  const { emoji, footer } = EMOJI_MAP[eventType] || EMOJI_MAP.default;
  // Formatear cada línea de la descripción con '> '
  const formattedContent = (content || 'No se ha proporcionado ningun mensaje.')
    .split('\n').map(line => `> ${line}`).join('\n');

  const embed = new EmbedBuilder()
    .setColor(COLOR_MAP[type] || COLOR_MAP.default)
    .setDescription(formattedContent)
    .setFooter({ text: `${emoji} ${footer} | ${new Date().toLocaleString()}` });

  if (authorData.name) embed.setAuthor(authorData);

  await channel.send({ embeds: [embed] });
};

module.exports = { sendLog };