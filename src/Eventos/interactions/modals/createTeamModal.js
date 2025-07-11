const { createTeam } = require('../../services/team.js')
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')
const { getErrorEmbed } = require('../../discord/embeds/management.js')

module.exports = {
  customId: 'team-form',


  async execute(interaction) {
    try {
      const nombre = interaction.fields.getTextInputValue('nombre_equipo').trim();
      const userId = interaction.user.id;

      const team = await createTeam({  })

      if (!team.success) {
        return interaction.reply({
          ephemeral: true,
          content: `❌ ${team.message}`
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
        content: `✅ ¡Equipo **${nombre}** creado exitosamente! Código: \`${team.codigo}\`\nPulsa **"Ver Equipo"** para añadir icono y sublíderes.`,
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