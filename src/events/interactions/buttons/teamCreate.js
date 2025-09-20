const { ActionRowBuilder } = require('discord.js')

const { checkUserIsVerified } = require('../../../services/user.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getUserVerifyModal } = require('../../../discord/modals/user.js')
const { getUserBrawlIdInput } = require('../../../discord/inputs/user.js')

const { getTeamCreateModal } = require('../../../discord/modals/team.js')
const { getTeamNameInput, getTeamIconInput } = require('../../../discord/inputs/team.js')

module.exports = {
  customId: 'teamCreate',

  async execute(interaction) {
    try {
        const isVerified = await checkUserIsVerified({ discordId: interaction.user.id })

        if (!isVerified) {
            const modal = getUserVerifyModal()

            const modalRow = new ActionRowBuilder().addComponents(getUserBrawlIdInput())
            modal.addComponents(modalRow)

            return interaction.showModal(modal)
        }

        const modal = getTeamCreateModal()

        const row1 = new ActionRowBuilder().addComponents(getTeamNameInput())
        const row2 = new ActionRowBuilder().addComponents(getTeamIconInput())
        modal.addComponents(row1, row2)

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