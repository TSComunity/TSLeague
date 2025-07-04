const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const schema = require('../../Esquemas/SchemaEquipos.js');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    // 📌 Unirse a un equipo
    if (interaction.isButton() && interaction.customId === 'unirse') {
      const data = await schema.findOne({ "Jugadores.discordId": interaction.user.id });

      if (data) {
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

        return interaction.reply({
          ephemeral: true,
          content: `❌ Ya estás en el **equipo** ${data.Nombre}.`,
          components: [row]
        });
      }

      // Mostrar formulario de código
      const modal = new ModalBuilder()
        .setCustomId('formularioUnirseEquipo')
        .setTitle('Unirse a un equipo');

      const codigoInput = new TextInputBuilder()
        .setCustomId('codigoEquipo')
        .setLabel('Código del equipo')
        .setPlaceholder('Introduce el código aquí')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const firstActionRow = new ActionRowBuilder().addComponents(codigoInput);
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
    }

    // 📌 Procesar formulario "Unirse a un equipo"
    if (interaction.isModalSubmit() && interaction.customId === 'formularioUnirseEquipo') {
      const codigo = interaction.fields.getTextInputValue('codigoEquipo');

      const yaTieneEquipo = await schema.findOne({ "Jugadores.discordId": interaction.user.id });
      if (yaTieneEquipo) {
        return interaction.reply({
          ephemeral: true,
          content: `❌ Ya estás en el **equipo** ${yaTieneEquipo.Nombre}.`
        });
      }

      const equipo = await schema.findOne({ Codigo: codigo });

      if (!equipo) {
        return interaction.reply({
          ephemeral: true,
          content: '❌ El código ingresado no corresponde a ningún equipo existente.'
        });
      }

      equipo.Jugadores.push({
        discordId: interaction.user.id,
        brawlId: null,
        jerarquia: 'miembro'
      });

      await equipo.save();

      const verEquipoBtn = new ButtonBuilder()
        .setCustomId('equipo')
        .setLabel('Ver Equipo')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(verEquipoBtn);

      return interaction.reply({
        ephemeral: true,
        content: `✅ Te has unido exitosamente al equipo **${equipo.Nombre}**.`,
        components: [row]
      });
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
  }
};