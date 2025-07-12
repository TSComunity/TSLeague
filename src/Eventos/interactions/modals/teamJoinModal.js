const { ActionRowBuilder } = require('discord.js')

const { addMemberToTeam } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getTeamSeeButton, getTeamLeftButton } = require('../../../discord/buttons/team.js')

const { addPingRoleToUser } = require('../../../utils/addPingRoleToUser.js')

module.exports = {
  customId: 'teamJoinModal',

  async execute(interaction, client) {
    try {
      const teamCode = interaction.fields.getTextInputValue('teamCodeInput').trim()
      const discordId = interaction.user.id

      const team = await addMemberToTeam({ discordId, teamCode })

        const teamRow = new ActionRowBuilder().addComponents(
        getTeamSeeButton(),
        getTeamLeftButton()
    )

      await interaction.reply({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Te has unido al equipo ${team.name}.` })],
        components: [teamRow]
      })
      
      return await addPingRoleToUser({ client, discordId: interaction.user.id })
    
    } catch (error) {
      console.error(error)
      return interaction.reply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: error.message })]
      })
    }
  }
}