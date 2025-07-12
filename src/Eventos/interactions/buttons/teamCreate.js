const { ActionRowBuilder } = require('discord.js')

const { getTeamCreateModal } = require('../../../discord/modals/team.js')
const { getTeamNameInput, getTeamIconInput } = require('../../../discord/inputs/team.js')

module.exports = {
  customId: 'teamCreate',

  async execute(interaction) {
    try {
        const modal = getTeamCreateModal()

        const modalRow = new ActionRowBuilder().addComponents(getTeamNameInput())
        modal.addComponents(getTeamNameInput(), getTeamIconInput())

        await interaction.showModal(modal)
    } catch (error) {
      console.error(error)
      return interaction.reply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: error.message })]
      })
    }
  }
}