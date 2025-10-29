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
  error: { emoji: '❌', footer: 'Error del Sistema' },
  default: { emoji: 'ℹ️', footer: 'Log del Sistema' }
};

const COLOR_MAP = {
  success: 'Green',
  warning: 'Yellow',
  danger: 'Red',
  info: 'Blue',
  error: 'Red',
  default: 'Grey'
};

/**
 * Envía un log o error al canal de logs
 * @param {Object} options
 * @param {String|Error} [options.content]
 * @param {import('discord.js').Client} options.client
 * @param {String} [options.type]
 * @param {String} [options.userId]
 * @param {String} [options.eventType]
 * @param {Error} [options.error]
 */
const sendLog = async ({ content, client, type = 'default', userId, eventType = 'default', error }) => {
  const channel = await client.channels.fetch(logs.id).catch(() => null);
  if (!channel) return console.error('⚠️ No se ha encontrado el canal de logs.');

  let authorData = {};
  if (userId && guild?.id) {
    try {
      const guildObj = await client.guilds.fetch(guild.id);
      const member = await guildObj.members.fetch(userId);
      authorData = {
        name: member.displayName,
        iconURL: member.displayAvatarURL()
      };
    } catch {
      authorData = { name: `ID: ${userId}` };
    }
  }

  // Si se pasa un error, reemplaza content
  if (error instanceof Error) content = error;
  const isError = content instanceof Error;

  let finalText = '';
  if (isError) {
    const err = content;
    const lines = err.stack?.split('\n') || [];
    const message = `${err.name}: ${err.message}`;

    // Buscar la primera línea de tu código (no node_modules)
    const originLine = lines.find(l => l.includes('/') && !l.includes('node_modules'));
    const fileInfo = originLine ? originLine.trim().replace(/^at\s+/g, '') : '(línea desconocida)';

    // Solo los errores van en bloque de código
    finalText = [
      '```js',
      `${message}`,
      `${fileInfo}`,
      '```'
    ].join('\n');

    type = 'error';
    eventType = 'error';
  } else {
    // Mensaje normal sin bloque de código
    finalText = content || 'No se ha proporcionado ningún mensaje.';
  }

  // Cortar si excede el límite
  if (finalText.length > 2000) {
    finalText = finalText.slice(0, 1900) + '\n... (truncado)';
  }

  const { emoji, footer } = EMOJI_MAP[eventType] || EMOJI_MAP.default;

  const embed = new EmbedBuilder()
    .setColor(COLOR_MAP[type] || COLOR_MAP.default)
    .setDescription(finalText)
    .setFooter({ text: `${emoji} ${footer} | ${new Date().toLocaleString()}` });

  if (authorData.name) embed.setAuthor(authorData);

  await channel.send({ embeds: [embed] });

  if (isError) console.error(content);
};

module.exports = { sendLog };