const { ActionRowBuilder } = require('discord.js')

const { findTeam } = require('../../../services/team.js')
const { getErrorEmbed } = require('../../../discord/embeds/management.js')
const { getAddMemberInfoEmbed } = require('../../../discord/embeds/team.js')

module.exports = {
  customId: 'teamAddMember',

  async execute(interaction) {
    try {
      const team = await findTeam({ discordId })
      const code = team.code

      await interaction.reply({
        ephemeral: true,
        embeds: [getAddMemberInfoEmbed({ code })]
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