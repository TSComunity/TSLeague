const { ActionRowBuilder } = require('discord.js')


const { getErrorEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  customId: 'matchCancelInteraction',

  async execute(interaction) {
    try {
        return interaction.update({
            content: '❌ Operación cancelada.',
            components: []
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