const { ActionRowBuilder } = require('discord.js')
const { removeMemberFromTeam, checkTeamUserHasPerms } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getTeamInfoEmbed } = require('../../../discord/embeds/team.js')
const {
    getTeamLeftButton,
    getTeamChangeNameButton,
    getTeamChangeIconButton,
    getTeamChangeColorButton,
    getTeamManageMembersButton,
    getTeamReGenerateCodeButton
} = require('../../../discord/buttons/team.js')

module.exports = {
  customId: 'teamKickMemberMenu',

  async execute(interaction, client) {
    const discordId = interaction.values[0]
    
    try {

      const perms = await checkTeamUserHasPerms({ discordId: interaction.user.id })

      let components = []

      if (perms) {
          components.push(new ActionRowBuilder().addComponents(
              getTeamChangeNameButton(),
              getTeamChangeIconButton(),
              getTeamChangeColorButton(),
              getTeamManageMembersButton(),
              getTeamReGenerateCodeButton()
          ))
      }

      components.push(new ActionRowBuilder().addComponents(
          getTeamLeftButton()
      ))
      
      const team = await removeMemberFromTeam({ discordId })

      await interaction.update({
        embeds: [getTeamInfoEmbed({ team })],
        components
      })
      
      await interaction.followUp({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Se expulso al usuario <@${discordId}> del equipo **${team.name}**.` })]
      })
    } catch (err) {
      console.error(err)
      await interaction.reply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: err.message })]
      })
    }
  }
}