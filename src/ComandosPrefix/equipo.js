const { EmbedBuilder } = require('discord.js');
const schema = require('../Esquemas/Team.js');

const ICONO_DEFECTO = 'https://images-ext-1.discordapp.net/external/93Clk3YKdTqFCB64y3DEwNsEyB2NQwL9VJU5vZFCTXo/%3Fsize%3D128/https/cdn.discordapp.com/icons/1093864130030612521/0525f2dce5dd5a3bff36fdaa833c71c6.png?format=webp&quality=lossless';
const COLOR_DEFECTO = 0x1bfc62;

function capitalizar(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  name: 'equipo',
  aliases: [""],
  args: false,
  run: async (message, args, client) => {
    const data = await schema.findOne({ "Jugadores.discordId": message.author.id });
    if (!data) {
      return message.reply('❌ No estás registrado en ningún equipo.');
    }

    // Ordenar jugadores de Lider > Sublider > Miembro
    const ordenJerarquia = { 'lider': 1, 'sublider': 2, 'miembro': 3 };
    const jugadoresOrdenados = data.Jugadores.slice().sort((a, b) => {
      const jerarquiaA = a.jerarquia || 'miembro';
      const jerarquiaB = b.jerarquia || 'miembro';
      return (ordenJerarquia[jerarquiaA] || 3) - (ordenJerarquia[jerarquiaB] || 3);
    });

    const valorJugadores = jugadoresOrdenados.length > 0
      ? jugadoresOrdenados.map(j => {
          const user = message.guild.members.cache.get(j.discordId);
          const nombre = user ? user.displayName : `ID: ${j.discordId}`;
          const tag = j.brawlId || 'Sin tag';
          let emoji = '👤'; // Miembro por defecto
          if (j.jerarquia === 'lider') emoji = '<:leader:1395916423695564881>';
          else if (j.jerarquia === 'sublider') emoji = '🥈';
          const rolFormateado = j.jerarquia ? capitalizar(j.jerarquia) : 'Miembro';
          return `• **${nombre}** — ${tag} (${emoji} ${rolFormateado})`;
        }).join('\n')
      : 'No hay jugadores';

    const embed = new EmbedBuilder()
      .setDescription(`## ⚔️​​ Configuración del equipo: ${data.Nombre}`)
      .setColor(data.Color ? parseInt(data.Color.replace('#', ''), 16) : COLOR_DEFECTO)
      .setThumbnail(data.Icono || ICONO_DEFECTO)
      .setAuthor({ name: `Codigo del Equipo: No visible en este mensaje` })
      .addFields(
        { name: '📝 Nombre', value: data.Nombre || 'No definido', inline: true },
        { name: '🖼️ Icono', value: data.Icono ? '✅ Personalizado' : '❌ Por defecto', inline: true },
        { name: '🎨 Color', value: data.Color ? `✅ \`${data.Color}\`` : '❌ Por defecto', inline: true },
        { name: '👥 Jugadores', value: valorJugadores, inline: false },
      );

    await message.reply({ embeds: [embed] });
  }
};