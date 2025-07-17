const { removeMemberFromTeam, checkTeamUserHasPerms } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')

const {
    getTeamLeftButton,
    getTeamChangeNameButton,
    getTeamChangeIconButton,
    getTeamChangeColorButton,
    getTeamManageMembersButton,
    getTeamReGenerateCodeButton
} = require('../../../discord/buttons/team.js')

module.exports = {
  customId: 'teamChangeColorMenu',

  async execute(interaction, client) {
    const discordId = interaction.values[0]
    
    try {

      const perms = await checkTeamUserHasPerms({ discordId })

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
        components
      })
      
      await interaction.followUp({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Se elimino al usuario <@${discordId}> del equipo **${team.name}**.` })]
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