const { ActionRowBuilder } = require('discord.js')

const { getTeamJoinModal } = require('../../../discord/modals/team.js')
const { getTeamCodeInput } = require('../../../discord/inputs/team.js')

module.exports = {
  customId: 'teamJoin',

  async execute(interaction) {
        const modal = getTeamJoinModal()

        const modalRow = new ActionRowBuilder().addComponents(
                getTeamCodeInputUI
            )

        modal.addComponents(modalRow)

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