const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');

const colors = require('../../configs/colors.json')

const schema = require('../../Esquemas/Team.js');

const ICONO_DEFECTO = 'https://images-ext-1.discordapp.net/external/93Clk3YKdTqFCB64y3DEwNsEyB2NQwL9VJU5vZFCTXo/%3Fsize%3D128/https/cdn.discordapp.com/icons/1093864130030612521/0525f2dce5dd5a3bff36fdaa833c71c6.png?format=webp&quality=lossless';
const COLOR_DEFECTO = 0x1bfc62

function capitalizar(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Primer: manejo de botones
    if (interaction.isButton()) {
      // Botón para abrir info equipo
      if (interaction.customId === 'equipo') {
        const data = await schema.findOne({ "Jugadores.discordId": interaction.user.id })

        if (!data) {
          return interaction.reply({ ephemeral: true, content: '❌ No estás registrado en ningún equipo.' });
        }

        const jugador = data.Jugadores.find(j => j.discordId === interaction.user.id)

        if (!jugador) {
          return interaction.reply({ ephemeral: true, content: '❌ No estás en el equipo.' })
        }

        const esLider = jugador.jerarquia === 'lider';
        const esSublider = jugador.jerarquia === 'sublider'

        const ordenJerarquia = { 'lider': 1, 'sublider': 2, 'miembro': 3 }
        const jugadoresOrdenados = data.Jugadores.slice().sort((a, b) => {
          const jerarquiaA = a.jerarquia || 'miembro'
          const jerarquiaB = b.jerarquia || 'miembro'
          return (ordenJerarquia[jerarquiaA] || 3) - (ordenJerarquia[jerarquiaB] || 3)
        })

        const valorJugadores = jugadoresOrdenados.length > 0
          ? jugadoresOrdenados.map(j => {
              const user = interaction.guild.members.cache.get(j.discordId);
              const nombre = user ? user.displayName : `ID: ${j.discordId}`;
              const tag = j.brawlId || 'Sin tag';
              let emoji = '👤';
              if (j.jerarquia === 'lider') emoji = '👑';
              else if (j.jerarquia === 'sublider') emoji = '🥈';
              const rolFormateado = j.jerarquia ? capitalizar(j.jerarquia) : 'Miembro'
              return `- **${emoji} ${nombre}** — ${tag} (${rolFormateado})`
            }).join('\n')
          : 'No hay jugadores'

        let embed;
        let componentes;

        if (esLider || esSublider) {
          embed = new EmbedBuilder()
            .setDescription(`### ${data.Nombre}`)
            .setColor(data.Color ? capitalizar(data.Color) : COLOR_DEFECTO)
            .setThumbnail(data.Icono || ICONO_DEFECTO)
            .addFields(
              { name: '🖼️ Icono', value: data.Icono ? '✅ \`Personalizado\`' : '❌ \`Por defecto\`', inline: true },
              { name: '🎨 Color', value: data.Color ? `✅ \`${data.Color}\`` : '❌ \`Por defecto\`', inline: true },
              { name: '👥 Jugadores', value: valorJugadores, inline: false },
            )
            .setFooter({ text: `Codigo del Equipo: ${data.Codigo}` })

          componentes = [
            new ActionRowBuilder().addComponents(
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
              new ButtonBuilder()
                .setCustomId('equipo_cambiar_codigo')
                .setLabel('Cambiar Código')
                .setEmoji('🔑')
                .setStyle(ButtonStyle.Secondary)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('equipo_salir')
                .setLabel('Salir del equipo')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🚪')
            )
          ];
        } else {
          embed = new EmbedBuilder()
            .setDescription(`### ${data.Nombre}`)
            .setColor(data.Color ? capitalizar(data.Color) : COLOR_DEFECTO)
            .setThumbnail(data.Icono || ICONO_DEFECTO)
            .addFields(
              { name: '👥 Jugadores', value: valorJugadores, inline: false },
            )

          componentes = [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('equipo_salir')
                .setLabel('Salir del equipo')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🚪')
            )
          ]
        }

        return interaction.reply({ embeds: [embed], components: componentes, ephemeral: true })
      }

      // Botón para salir del equipo
      if (interaction.customId === 'equipo_salir') {
        const data = await schema.findOne({ "Jugadores.discordId": interaction.user.id });
        if (!data) return interaction.reply({ ephemeral: true, content: '❌ No estás en ningún equipo.' });

        const jugadorIndex = data.Jugadores.findIndex(j => j.discordId === interaction.user.id);
        if (jugadorIndex === -1) return interaction.reply({ ephemeral: true, content: '❌ No estás en el equipo.' });

        const jugador = data.Jugadores[jugadorIndex];

        if (jugador.jerarquia === 'lider') {
          // Promover a un sublíder aleatorio si hay
          const sublideres = data.Jugadores.filter(j => j.jerarquia === 'sublider' && j.discordId !== interaction.user.id);
          if (sublideres.length > 0) {
            const nuevoLider = sublideres[Math.floor(Math.random() * sublideres.length)];
            nuevoLider.jerarquia = 'lider';
          } else {
            // Si no hay sublíderes, promover a un miembro aleatorio
            const miembros = data.Jugadores.filter(j => j.jerarquia === 'miembro' && j.discordId !== interaction.user.id);
            if (miembros.length > 0) {
              const nuevoLider = miembros[Math.floor(Math.random() * miembros.length)];
              nuevoLider.jerarquia = 'lider';
            }
            // Si no hay nadie, el equipo queda sin líder (opcional)
          }
        }

        data.Jugadores.splice(jugadorIndex, 1);
        await data.save();

        return interaction.reply({ ephemeral: true, content: '✅ Has salido del equipo correctamente.' });
      }

      // Botones para cambiar configuración del equipo
      if (
        [
          'equipo_cambiar_nombre',
          'equipo_cambiar_color',
          'equipo_cambiar_icono',
          'equipo_gestionar_jugadores',
          'equipo_cambiar_codigo'
        ].includes(interaction.customId)
      ) {
        const data = await schema.findOne({ "Jugadores.discordId": interaction.user.id });
        if (!data) {
          return interaction.reply({ ephemeral: true, content: '❌ No se encontró tu equipo.' });
        }

        const jugador = data.Jugadores.find(j => j.discordId === interaction.user.id);
        const esLider = jugador?.jerarquia === 'lider';
        const esSublider = jugador?.jerarquia === 'sublider';

        if (!esLider && !esSublider) {
          const embedError = new EmbedBuilder()
            .setTitle('Acceso Denegado')
            .setDescription('❌ Solo el líder o sublíder pueden editar el equipo.')
            .setColor(0xFF0000);
          return interaction.reply({ embeds: [embedError], ephemeral: true });
        }

        const channelId = interaction.channelId;

        if (interaction.customId === 'equipo_cambiar_nombre') {
          const modal = new ModalBuilder()
            .setCustomId(`form_nombre_equipo::${channelId}`)
            .setTitle('Cambiar Nombre del Equipo')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('nuevo_nombre')
                  .setLabel('Nuevo Nombre del Equipo')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
              )
            );
          return interaction.showModal(modal);
        }

        if (interaction.customId === 'equipo_cambiar_icono') {
          const modal = new ModalBuilder()
            .setCustomId(`form_icono_equipo::${channelId}`)
            .setTitle('Cambiar Icono del Equipo')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('nuevo_icono')
                  .setLabel('URL del nuevo icono')
                  .setPlaceholder('https://...')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
              )
            );
          return interaction.showModal(modal);
        }

        if (interaction.customId === 'equipo_cambiar_color') {
          // const modal = new ModalBuilder()
          //   .setCustomId(`form_color_equipo::${channelId}`)
          //   .setTitle('Cambiar Color del Equipo')
          //   .addComponents(
          //     new ActionRowBuilder().addComponents(
          //       new TextInputBuilder()
          //         .setCustomId('nuevo_color')
          //         .setLabel('Nuevo Color (hexadecimal)')
          //         .setPlaceholder('#1bfc62')
          //         .setStyle(TextInputStyle.Short)
          //         .setRequired(true)
          //     )
          //   );
          // return interaction.showModal(modal);

          // Crear el select menu
        const select = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('menu_color_equipo')
            .setPlaceholder('Selecciona un color para el equipo')
            .addOptions(colors)
          )
        }

        if (interaction.customId === 'equipo_cambiar_codigo') {
          const modal = new ModalBuilder()
            .setCustomId(`form_codigo_equipo::${channelId}`)
            .setTitle('Cambiar Código del Equipo')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('nuevo_codigo')
                  .setLabel('Nuevo Código')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
              )
            );
          return interaction.showModal(modal);
        }
      }
    }

    // Ahora manejo de los modales
    if (interaction.isModalSubmit()) {
      const [form, channelId] = interaction.customId.split('::');

      const data = await schema.findOne({ "Jugadores.discordId": interaction.user.id });
      if (!data) {
        return interaction.reply({ ephemeral: true, content: '❌ No se encontró tu equipo.' });
      }

      const jugador = data.Jugadores.find(j => j.discordId === interaction.user.id);
      const esLider = jugador?.jerarquia === 'lider';
      const esSublider = jugador?.jerarquia === 'sublider';

      if (!esLider && !esSublider) {
        return interaction.reply({ ephemeral: true, content: '❌ Solo el líder o sublíder pueden editar el equipo.' });
      }

      if (form === 'form_nombre_equipo') {
        const nuevoNombre = interaction.fields.getTextInputValue('nuevo_nombre').trim();
        if (nuevoNombre.length < 3 || nuevoNombre.length > 30) {
          return interaction.reply({ ephemeral: true, content: '❌ El nombre debe tener entre 3 y 30 caracteres.' });
        }
        data.Nombre = nuevoNombre;
        await data.save();
        return interaction.reply({ ephemeral: true, content: `✅ Nombre del equipo cambiado a **${nuevoNombre}**.` });
      }

      if (form === 'form_icono_equipo') {
        const nuevoIcono = interaction.fields.getTextInputValue('nuevo_icono').trim();
        // Validar URL básica
        if (!/^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)$/i.test(nuevoIcono)) {
          return interaction.reply({ ephemeral: true, content: '❌ URL inválida o formato no soportado (png, jpg, jpeg, gif, webp).' });
        }
        data.Icono = nuevoIcono;
        await data.save();
        return interaction.reply({ ephemeral: true, content: '✅ Icono del equipo cambiado correctamente.' });
      }

      if (form === 'form_codigo_equipo') {
        const nuevoCodigo = interaction.fields.getTextInputValue('nuevo_codigo').trim();
        if (nuevoCodigo.length < 3 || nuevoCodigo.length > 10) {
          return interaction.reply({ ephemeral: true, content: '❌ El código debe tener entre 3 y 10 caracteres.' });
        }
        data.Codigo = nuevoCodigo;
        await data.save();
        return interaction.reply({ ephemeral: true, content: `✅ Nuevo código del equipo: \`${nuevoCodigo}\`.` });
      }
    }

        if (interaction.isStringSelectMenu()) {

          const data = await schema.findOne({ "Jugadores.discordId": interaction.user.id });
          if (!data) {
            return interaction.reply({ ephemeral: true, content: '❌ No se encontró tu equipo.' });
          }

          const jugador = data.Jugadores.find(j => j.discordId === interaction.user.id);
          const esLider = jugador?.jerarquia === 'lider';
          const esSublider = jugador?.jerarquia === 'sublider';

          if (!esLider && !esSublider) {
            return interaction.reply({ ephemeral: true, content: '❌ Solo el líder o sublíder pueden editar el equipo.' });
          }

          if (interaction.customId === 'menu_color_equipo') {
              const colorSeleccionado = interaction.values[0]

              data.Color = colorSeleccionado

              await data.save()

              const nuevoColor = colors.find(color => color.value === colorSeleccionado)

              return interaction.reply({ content: `✅ Nuevo color del equipo: \`${nuevoColor.label}\`.` })
          }

        }
  },
}