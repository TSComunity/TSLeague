const { EmbedBuilder } = require('discord.js');
const schema = require('../Esquemas/SchemaEquipos.js');

async function actualizarMensajeDivisiones(client, canalId, mensajeId) {
  try {
    const canal = await client.channels.fetch(canalId);
    if (!canal || !canal.isTextBased()) {
      console.error('Canal no válido o no es de texto');
      return;
    }

    const mensaje = await canal.messages.fetch(mensajeId);
    if (!mensaje) {
      console.error('Mensaje no encontrado');
      return;
    }

    const equipos = await schema.find();

    // Necesitamos el guild (servidor) para buscar miembros
    const guild = canal.guild;

    const divisionA = equipos.filter(eq => eq.Division === 'A');
    const divisionB = equipos.filter(eq => eq.Division === 'B');

    const embedA = new EmbedBuilder()
      .setColor('#f3af74')
      .setDescription('## 🏆 División A')
      .setThumbnail('https://media.discordapp.net/attachments/1096318697053884457/1373512171983736974/file_00000000661061f5a22092c66d710222.png?ex=683145e4&is=682ff464&hm=1063f3595f1b0754e0e68696c5206cf16dab3f5bc3c9367aa2ba4455639324da&=&format=webp&quality=lossless&width=840&height=840');

    if (divisionA.length === 0) {
      embedA.setDescription('_No hay equipos en esta división_');
    } else {
      for (const eq of divisionA) {
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
          `**🔥 Racha:** 0`

        embedA.addFields({ name: `­`, value, inline: true });
      }
    }

    const embedB = new EmbedBuilder()
      .setColor('#b67054')
      .setDescription('## 🥈 División B')
      .setThumbnail('https://media.discordapp.net/attachments/1096318697053884457/1373512171983736974/file_00000000661061f5a22092c66d710222.png?ex=683145e4&is=682ff464&hm=1063f3595f1b0754e0e68696c5206cf16dab3f5bc3c9367aa2ba4455639324da&=&format=webp&quality=lossless&width=840&height=840');

    if (divisionB.length === 0) {
      embedB.setDescription('_No hay equipos en esta división_');
    } else {
      for (const eq of divisionB) {
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
          `**🔥 Racha:** 0`

        embedB.addFields({ name: `­`, value, inline: true });
      }
    }

    await mensaje.edit({ embeds: [embedA, embedB], content: '' });
  } catch (err) {
    console.error('❌ Error al actualizar el mensaje de divisiones:', err);
  }
}

module.exports = actualizarMensajeDivisiones;