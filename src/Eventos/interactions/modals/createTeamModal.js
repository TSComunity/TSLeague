const { createTeam } = require('../../services/team.js');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { getErrorEmbed } = require('../../discord/embeds/management.js');

module.exports = {
  customId: 'formularioEquipo',

  /**
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async execute(interaction) {
    try {
      const nombre = interaction.fields.getTextInputValue('nombre_equipo').trim();
      const userId = interaction.user.id;

      const result = await createTeam({ nombre, userId });

      if (!result.success) {
        return interaction.reply({
          ephemeral: true,
          content: `❌ ${result.message}`
        });
      }

      const verEquipoBtn = new ButtonBuilder()
        .setCustomId('equipo')
        .setLabel('Ver Equipo')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(verEquipoBtn);

      return interaction.reply({
        ephemeral: true,
        content: `✅ ¡Equipo **${nombre}** creado exitosamente! Código: \`${result.codigo}\`\nPulsa **"Ver Equipo"** para añadir icono y sublíderes.`,
        components: [row]
      });

    } catch (error) {
      console.error('Error al crear el equipo desde modal:', error);
      return interaction.reply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: error.message })]
      });
    }
  }
}