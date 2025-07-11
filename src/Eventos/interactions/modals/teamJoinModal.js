const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')

const { addMemberToTeam } = require('../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../discord/embeds/management.js')
const { getTeamSeeButton } = require('../../discord/buttons/team.js')

module.exports = {
  customId: 'teamJoinModal',

  async execute(interaction) {
    try {
      const teamCode = interaction.fields.getTextInputValue('teamCode').trim()
      const discordId = interaction.user.id

      const team = await addMemberToTeam({ discordId, teamCode })

        const teamSeeButton = getTeamSeeButton()
      const teamRow = new ActionRowBuilder().addComponents(
        teamSeeButton
    )

      return interaction.reply({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Te has unido al equipo ${team.name}.` })],
        components: [teamRow]
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