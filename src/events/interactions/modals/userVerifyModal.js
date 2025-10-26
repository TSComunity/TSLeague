const { ActionRowBuilder } = require('discord.js')

const { verifyUser } = require('../../../services/user.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  customId: 'userVerifyModal',

  async execute(interaction) {
    try {
      const brawlId = interaction.fields.getTextInputValue('userBrawlIdInput').trim()
      const discordId = interaction.user.id

      const user = await verifyUser({ discordId, brawlId, client: interaction.client })

      return interaction.reply({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Has sido verificado correctamente con el ID \`${user.brawlId}\`, ya puedes crear un equipo, unirte a uno o establecer tu estado de agente libre.` })],
      })

    } catch (error) {
      console.error(error)
      return interaction.reply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: error.message })]
      })
    }
  }
}