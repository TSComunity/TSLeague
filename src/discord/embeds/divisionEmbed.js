const { EmbedBuilder } = require('discord.js');

async function createDivisionEmbed(divisionName, equipos, guild) {
  const equiposDivision = equipos.filter(eq => eq.Division === divisionName);

  const embed = new EmbedBuilder()
    .setColor(divisionName === 'A' ? '#f3af74' : '#b67054') // Puedes usar un mapa si hay muchas divisiones
    .setDescription(`## ${divisionName === 'A' ? '🏆 División A' : '🥈 División ' + divisionName}`)
    .setThumbnail('https://media.discordapp.net/attachments/1096318697053884457/1373512171983736974/file_00000000661061f5a22092c66d710222.png?ex=683145e4&is=682ff464&hm=1063f3595f1b0754e0e68696c5206cf16dab3f5bc3c9367aa2ba4455639324da&=&format=webp&quality=lossless&width=840&height=840');

  if (equiposDivision.length === 0) {
    embed.setDescription(`_No hay equipos en la división ${divisionName}_`);
    return embed;
  }

  for (const eq of equiposDivision) {
    let liderName = 'N/A';
    if (eq.Jugadores.length > 0) {
      try {
        const miembro = await guild.members.fetch(eq.Jugadores[0].discordId);
        liderName = miembro ? miembro.displayName : 'N/A';
      } catch {
        liderName = 'N/A';
      }
    }

    const value =
      `**:shield: [${eq.Nombre || 'N/A'}](https://google.es)**\n` +
      `**🏷️ Puntos:** ${eq.Puntos ?? 0}\n` +
      `**👑 Líder:** ${liderName}\n` +
      `**🎯 Rondas:** ${eq.PartidasJugadas ?? 0}\n` +
      `**🔥 Racha:** 0`;

    embed.addFields({ name: `­`, value, inline: true });
  }

  return embed;
}

module.exports = { createDivisionEmbed };

// TODO: cambiarla para quitar parametros y hacer la logica internamente (caja negra)