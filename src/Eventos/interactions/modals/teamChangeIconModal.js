const { ActionRowBuilder, AttachmentBuilder } = require('discord.js')

const { updateTeam } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  customId: 'teamChangeIconModal',

  async execute(interaction) {
    try {
      const name = interaction.fields.getTextInputValue('teamNameInput').trim()
      const discordId = interaction.user.id

      const team = await updateTeam({ discordId, name })

      return interaction.reply({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Se ha actualizado el icono por:` })],
        files: [{ attachment: team.iconURl, name: `Icono del equipo: ${team.name}` }]
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