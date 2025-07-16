const { ActionRowBuilder } = require('discord.js')

const { verifyUser } = require('../../../services/user.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  customId: 'userVerifyModal',

  async execute(interaction) {
    try {
      const brawlId = interaction.fields.getTextInputValue('userBrawlIdInput').trim()
      const discordId = interaction.user.id

      const user = await verifyUser({ discordId, brawlId })

      return interaction.reply({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Has sido verificado correctamente con el id \`${user.brawlId}\`, ya puedes crear o unirte a un equipo.` })],
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