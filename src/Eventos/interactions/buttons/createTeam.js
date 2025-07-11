const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: 'team_create',

  /**
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('formularioEquipo')
      .setTitle('Registro de Equipo')

    const nombreEquipoInput = new TextInputBuilder()
      .setCustomId('nombre_equipo')
      .setLabel('Nombre del equipo')
      .setPlaceholder('Ej. Los Invencibles')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)

    const modalRow = new ActionRowBuilder().addComponents(nombreEquipoInput)
    modal.addComponents(modalRow)

    await interaction.showModal(modal)
  }
}