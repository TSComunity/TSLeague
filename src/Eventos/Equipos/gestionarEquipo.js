const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder: RowBuilder,
} = require('discord.js');

const schema = require('../../Esquemas/Team.js');

const ICONO_DEFECTO = 'https://images-ext-1.discordapp.net/external/93Clk3YKdTqFCB64y3DEwNsEyB2NQwL9VJU5vZFCTXo/%3Fsize%3D128/https/cdn.discordapp.com/icons/1093864130030612521/0525f2dce5dd5a3bff36fdaa833c71c6.png?format=webp&quality=lossless';
const COLOR_DEFECTO = 0x1bfc62;

function capitalizar(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    // --- Manejamos el botón para gestionar jugadores ---
    if (interaction.isButton() && interaction.customId === 'equipo_gestionar_jugadores') {
      const data = await schema.findOne({ "Jugadores.discordId": interaction.user.id });
      if (!data) return interaction.reply({ ephemeral: true, content: '❌ No se encontró tu equipo.' });

      // Obtener jugadores excepto el que interactúa para no gestionarse a sí mismo (opcional)
      const jugadoresOpciones = data.Jugadores.map(j => {
        const user = interaction.guild.members.cache.get(j.discordId);
        const nombre = user ? user.displayName : `ID: ${j.discordId}`;
        return {
          label: nombre.length > 25 ? nombre.slice(0, 22) + '...' : nombre,
          description: `${j.brawlId || 'Sin tag'} - ${capitalizar(j.jerarquia || 'Miembro')}`,
          value: j.discordId,
        };
      });

      if (jugadoresOpciones.length === 0) {
        return interaction.reply({ ephemeral: true, content: '❌ No hay jugadores en tu equipo.' });
      }

      const select = new ActionRowBuilder().addComponents(
        new (require('discord.js').StringSelectMenuBuilder)()
          .setCustomId('seleccionar_jugador_gestion')
          .setPlaceholder('Selecciona un jugador para gestionar')
          .addOptions(jugadoresOpciones)
      );

      return interaction.reply({ content: 'Selecciona un jugador para gestionar:', components: [select], ephemeral: true });
    }

    // --- Selección de jugador para gestionar ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'seleccionar_jugador_gestion') {
      const discordId = interaction.values[0];
      const data = await schema.findOne({ "Jugadores.discordId": interaction.user.id });
      if (!data) return interaction.reply({ ephemeral: true, content: '❌ No se encontró tu equipo.' });

      const jugador = data.Jugadores.find(j => j.discordId === discordId);
      if (!jugador) return interaction.reply({ ephemeral: true, content: '❌ Jugador no encontrado en tu equipo.' });

      // Mostrar opciones: Expulsar, Ascender a Sublíder, Ascender a Líder, Volver atrás
      const botones = new RowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`expulsar_${jugador.discordId}`)
          .setLabel('Expulsar')
          .setEmoji('🚪')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`ascender_sublider_${jugador.discordId}`)
          .setLabel('Ascender a Sublíder')
          .setEmoji('⬆️')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`ascender_lider_${jugador.discordId}`)
          .setLabel('Ascender a Líder')
          .setEmoji('⭐')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('volver_atras')
          .setLabel('Volver atrás')
          .setEmoji('⬅️')
          .setStyle(ButtonStyle.Secondary),
      );

      // Info jugador para mostrar en embed
      const user = interaction.guild.members.cache.get(jugador.discordId);
      const nombre = user ? user.displayName : `ID: ${jugador.discordId}`;
      const embed = new EmbedBuilder()
        .setTitle(`Gestionar jugador: ${nombre}`)
        .setDescription(`Tag: \`${jugador.brawlId || 'Sin tag'}\`\nJerarquía actual: **${capitalizar(jugador.jerarquia || 'Miembro')}**`)
        .setColor(COLOR_DEFECTO)
        .setThumbnail(user ? user.user.displayAvatarURL() : null);

      return interaction.update({ embeds: [embed], components: [botones] });
    }

    // --- Manejo botones expulsar / ascender / volver ---
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // Volver atrás: mostrar panel principal
      if (customId === 'volver_atras') {
        const data = await schema.findOne({ "Jugadores.discordId": interaction.user.id });
        if (!data) {
          return interaction.update({ content: '❌ No se encontró tu equipo.', components: [], embeds: [], ephemeral: true });
        }

        // Ordenar jugadores para mostrar
        const ordenJerarquia = { 'lider': 1, 'sublider': 2, 'miembro': 3 };
        const jugadoresOrdenados = data.Jugadores.slice().sort((a, b) => {
          const jerarquiaA = a.jerarquia || 'miembro';
          const jerarquiaB = b.jerarquia || 'miembro';
          return (ordenJerarquia[jerarquiaA] || 3) - (ordenJerarquia[jerarquiaB] || 3);
        });

        const valorJugadores = jugadoresOrdenados.length > 0
          ? jugadoresOrdenados.map(j => {
              const user = interaction.guild.members.cache.get(j.discordId);
              const nombre = user ? user.displayName : `ID: ${j.discordId}`;
              const tag = j.brawlId || 'Sin tag';
              let emoji = '👤';
              if (j.jerarquia === 'lider') emoji = '👑';
              else if (j.jerarquia === 'sublider') emoji = '🥈';
              const rolFormateado = j.jerarquia ? capitalizar(j.jerarquia) : 'Miembro';
              return `• **${nombre}** — ${tag} (${emoji} ${rolFormateado})`;
            }).join('\n')
          : 'No hay jugadores';

        const embed = new EmbedBuilder()
          .setDescription(`## ⚔️​​ Configuración del equipo: ${data.Nombre}`)
          .setColor(data.Color ? parseInt(data.Color.replace('#', ''), 16) : COLOR_DEFECTO)
          .setThumbnail(data.Icono || ICONO_DEFECTO)
          .setAuthor({ name: `Codigo del Equipo: ${data.Codigo}` })
          .addFields(
            { name: '📝 Nombre', value: data.Nombre || 'No definido', inline: true },
            { name: '🖼️ Icono', value: data.Icono ? '✅ Personalizado' : '❌ Por defecto', inline: true },
            { name: '🎨 Color', value: data.Color ? `✅ \`${data.Color}\`` : '❌ Por defecto', inline: true },
            { name: '👥 Jugadores', value: valorJugadores, inline: false },
          );

        const botones = new RowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('equipo_cambiar_nombre')
            .setLabel('Cambiar Nombre')
            .setEmoji('📛')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('equipo_cambiar_icono')
            .setLabel('Cambiar Icono')
            .setEmoji('🖼️')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('equipo_cambiar_color')
            .setLabel('Cambiar Color')
            .setEmoji('🎨')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('equipo_gestionar_jugadores')
            .setLabel('Gestionar Jugadores')
            .setEmoji('🧑‍💼')
            .setStyle(ButtonStyle.Secondary),
        );

        return interaction.update({ embeds: [embed], components: [botones], content: null });
      }

      // Manejo expulsar o ascender
      const [accion, discordId] = customId.split('_').length === 2
        ? customId.split('_')
        : [customId.split('_')[0] + '_' + customId.split('_')[1], customId.split('_')[2]];

      if (!['expulsar', 'ascender_sublider', 'ascender_lider'].includes(accion)) return;

      const data = await schema.findOne({ "Jugadores.discordId": interaction.user.id });
      if (!data) return interaction.reply({ ephemeral: true, content: '❌ No se encontró tu equipo.' });

      const jugador = data.Jugadores.find(j => j.discordId === discordId);
      if (!jugador) return interaction.reply({ ephemeral: true, content: '❌ Jugador no encontrado en tu equipo.' });

      // Solo líder o sublíder pueden gestionar
      const yo = data.Jugadores.find(j => j.discordId === interaction.user.id);
      if (!yo || (yo.jerarquia !== 'lider' && yo.jerarquia !== 'sublider')) {
        return interaction.reply({ ephemeral: true, content: '❌ Solo el líder o sublíder pueden gestionar jugadores.' });
      }

      if (accion === 'expulsar') {
        // No permitir que el líder se expulse a sí mismo o que alguien expulse al líder
        if (jugador.jerarquia === 'lider') {
          return interaction.reply({ ephemeral: true, content: '❌ No puedes expulsar al líder.' });
        }
        data.Jugadores = data.Jugadores.filter(j => j.discordId !== discordId);
        await data.save();
        return interaction.reply({ ephemeral: true, content: `✅ Jugador **${jugador.discordId}** expulsado.` });
      }

      if (accion === 'ascender_sublider') {
        if (jugador.jerarquia === 'sublider') {
          return interaction.reply({ ephemeral: true, content: '❌ Este jugador ya es sublíder.' });
        }
        if (jugador.jerarquia === 'lider') {
          return interaction.reply({ ephemeral: true, content: '❌ El líder no puede ascender a sublíder.' });
        }
        jugador.jerarquia = 'sublider';
        await data.save();
        return interaction.reply({ ephemeral: true, content: `✅ Jugador **${jugador.discordId}** ascendido a sublíder.` });
      }

      if (accion === 'ascender_lider') {
        if (jugador.jerarquia === 'lider') {
          return interaction.reply({ ephemeral: true, content: '❌ Este jugador ya es el líder.' });
        }
        // Ascender a líder: bajamos el actual líder a sublíder
        const liderActual = data.Jugadores.find(j => j.jerarquia === 'lider');
        if (liderActual) {
          liderActual.jerarquia = 'sublider';
        }
        jugador.jerarquia = 'lider';
        await data.save();
        return interaction.reply({ ephemeral: true, content: `✅ Jugador **${jugador.discordId}** ascendido a líder y el líder anterior bajado a sublíder.` });
      }
    }
  }
};