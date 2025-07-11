const { ActionRowBuilder } = require('discord.js')

const { getTeamJoinModal } = require('../../../discord/modals/team.js')
const { getTeamCodeInput } = require('../../../discord/inputs/team.js')

module.exports = {
  customId: 'teamJoin',

  async execute(interaction) {

    const teamJoinModal = getTeamJoinModal()
    const teamCodeInput = getTeamCodeInput()

    const teamRow = new ActionRowBuilder().addComponents(
            teamCodeInput
        )

    teamJoinModal.addComponents(teamRow)

    await interaction.showModal(teamJoinModal)
  }
}