const { ActionRowBuilder } = require('discord.js')


const { checkUserVerification } = require('../../../services/user.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getUserVerifyModal } = require('../../../discord/modals/user.js')
const { getUserBrawlIdInput } = require('../../../discord/inputs/user.js')

const { getTeamJoinModal } = require('../../../discord/modals/team.js')
const { getTeamCodeInput } = require('../../../discord/inputs/team.js')

module.exports = {
  customId: 'teamJoin',

  async execute(interaction) {
    try {

        const isVerified = await checkUserVerification({ discordId: interaction.user.id })
        if (!isVerified) {
            const modal = getUserVerifyModal()

            const modalRow = new ActionRowBuilder().addComponents(getUserBrawlIdInput())
            modal.addComponents(modalRow)

            return interaction.showModal(modal)
        }

        const modal = getTeamJoinModal()

        const modalRow = new ActionRowBuilder().addComponents(
                getTeamCodeInput()
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