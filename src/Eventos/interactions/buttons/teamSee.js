const { ActionRowBuilder } = require('discord.js')

const { findTeamByDiscordId } = require('../../services/team.js')

const { getTeamInfoEmbed } = require('../../discord/embeds/team.js')
const { getErrorEmbed } = require('../../discord/embeds/management.js')

const {
    getTeamLeftButton,
    getTeamChangeNameButton,
    getTeamChangeIconButton,
    getTeamChangeColorButton,
    getTeamManageMembersButton,
    getTeamReGenerateCodeButton
} = require('../../discord/buttons/team.js')

module.exports = {
  customId: 'teamSee',

  async execute(interaction) {
    try {
      const team = await findTeamByDiscordId({ discordId: interaction.user.id })

      
      const teamRow = new ActionRowBuilder.addComponents()




      return interaction.reply({
        ephemeral: true,
        embeds: [getTeamInfoEmbed({ team })]
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