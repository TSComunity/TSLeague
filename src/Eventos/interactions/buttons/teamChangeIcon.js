const { ActionRowBuilder } = require('discord.js')

const { checkTeamUserHasPerms } = require('../../../services/team.js')

const { getTeamChangeIconModal } = require('../../../discord/modals/team.js')
const { getTeamIconInput } = require('../../../discord/inputs/team.js')

module.exports = {
  customId: 'teamChangeIcon',

  async execute(interaction) {
    try {
        const discordId = interaction.user.id
        const perms = await checkTeamUserHasPerms({ discordId })

        if (!perms) {
            return interaction.reply({
                ephemeral: true,
                embeds: [getErrorEmbed({ error: 'No tienes permisos para utilizar esta interaccion.' })]
            })
        }

        const modal = getTeamChangeIconModal()

        const modalRow = new ActionRowBuilder().addComponents(getTeamIconInput())
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