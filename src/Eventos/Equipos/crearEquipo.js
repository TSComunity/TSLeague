const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const schema = require('../../Esquemas/SchemaEquipos.js');

function generarCodigoEquipo() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    try {
      // 📌 Inscripción - mostrar modal
      if (interaction.isButton() && interaction.customId === 'inscribir') {
        const data = await schema.findOne({ "Jugadores.discordId": interaction.user.id });

        //if (data) {
          const verEquipoBtn = new ButtonBuilder()
            .setCustomId('equipo')
            .setLabel('Ver Equipo')
            .setEmoji('📋')
            .setStyle(ButtonStyle.Secondary);

          const salirEquipoBtn = new ButtonBuilder()
            .setCustomId('equipo_salir')
            .setLabel('Salir del equipo')
            .setEmoji('🚪')
            .setStyle(ButtonStyle.Danger);

          const row = new ActionRowBuilder().addComponents(verEquipoBtn, salirEquipoBtn);

          //return interaction.reply({
            //ephemeral: true,
            //content: `❌ Ya estás en el **equipo** ${data.Nombre}.`,
            //components: [row]
          //});
        //}

        const modal = new ModalBuilder()
          .setCustomId('formularioEquipo')
          .setTitle('Registro de Equipo');

        const nombreEquipoInput = new TextInputBuilder()
          .setCustomId('nombre_equipo')
          .setLabel('Nombre del equipo')
          .setPlaceholder('Ej. Los Invencibles')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const modalRow = new ActionRowBuilder().addComponents(nombreEquipoInput);
        modal.addComponents(modalRow);

        return interaction.showModal(modal);
      }

      // 📌 Procesar formulario del modal
      if (interaction.isModalSubmit() && interaction.customId === 'formularioEquipo') {
        const nombre = interaction.fields.getTextInputValue('nombre_equipo').trim();

        try {
          const nombreExistente = await schema.findOne({ Nombre: nombre });
          if (nombreExistente) {
            return interaction.reply({
              ephemeral: true,
              content: `❌ Ya existe un equipo llamado **${nombre}**. Intenta con otro nombre.`
            });
          }

          const codigo = generarCodigoEquipo();

          await schema.create({
            Puntos: 0,
            PartidasJugadas: 0,
            Codigo: codigo,
            Nombre: nombre,
            Jugadores: [{
              discordId: interaction.user.id,
              jerarquia: "lider"
            }]
          });

          const verEquipoBtn = new ButtonBuilder()
            .setCustomId('equipo')
            .setLabel('Ver Equipo')
            .setEmoji('📋')
            .setStyle(ButtonStyle.Secondary);

          const row = new ActionRowBuilder().addComponents(verEquipoBtn);

          return interaction.reply({
            ephemeral: true,
            content: `✅ ¡Equipo **${nombre}** creado exitosamente! Código del equipo: \`${codigo}\`\nPulsa **"Ver Equipo"** para añadir icono y sublíderes.`,
            components: [row]
          });

        } catch (err) {
          console.error('Error al crear el equipo:', err);

          const replyPayload = {
            ephemeral: true,
            content: '❌ Hubo un error al registrar tu equipo. Intenta de nuevo más tarde.'
          };

          try {
            if (interaction.replied || interaction.deferred) {
              await interaction.followUp(replyPayload);
            } else {
              await interaction.reply(replyPayload);
            }
          } catch (err2) {
            console.error('No se pudo enviar la respuesta de error:', err2);
          }
        }
      }

      // 📌 Salir del equipo
      if (interaction.isButton() && interaction.customId === 'equipo_salir') {
        const data = await schema.findOne({ "Jugadores.discordId": interaction.user.id });

        if (!data) {
          return interaction.reply({ ephemeral: true, content: '❌ No estás en ningún equipo.' });
        }

        const jugadorIndex = data.Jugadores.findIndex(j => j.discordId === interaction.user.id);
        if (jugadorIndex === -1) {
          return interaction.reply({ ephemeral: true, content: '❌ No estás en el equipo.' });
        }

        const jugador = data.Jugadores[jugadorIndex];

        // Si es líder, buscar reemplazo
        if (jugador.jerarquia === 'lider') {
          const sublideres = data.Jugadores.filter(j => j.jerarquia === 'sublider' && j.discordId !== interaction.user.id);
          if (sublideres.length > 0) {
            const nuevoLider = sublideres[Math.floor(Math.random() * sublideres.length)];
            nuevoLider.jerarquia = 'lider';
          } else {
            const miembros = data.Jugadores.filter(j => j.jerarquia === 'miembro' && j.discordId !== interaction.user.id);
            if (miembros.length > 0) {
              const nuevoLider = miembros[Math.floor(Math.random() * miembros.length)];
              nuevoLider.jerarquia = 'lider';
            }
          }
        }

        data.Jugadores.splice(jugadorIndex, 1);
        await data.save();

        return interaction.reply({ ephemeral: true, content: '✅ Has salido del equipo correctamente.' });
      }

    } catch (error) {
      console.error('Error inesperado en interactionCreate:', error);
      if (interaction && !interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            ephemeral: true,
            content: '❌ Ocurrió un error inesperado. Intenta más tarde.'
          });
        } catch (err) {
          console.error('Error al intentar enviar la respuesta de error:', err);
        }
      }
    }
  }
};