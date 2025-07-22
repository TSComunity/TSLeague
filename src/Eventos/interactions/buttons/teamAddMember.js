const { ActionRowBuilder } = require('discord.js')

const { checkTeamUserHasPerms } = require('../../../services/team.js')
const { findTeam } = require('../../../utils/team.js')
const { getErrorEmbed } = require('../../../discord/embeds/management.js')
const { getAddMemberInfoEmbed } = require('../../../discord/embeds/team.js')

const {
    getTeamLeftButton,
    getTeamChangeNameButton,
    getTeamChangeIconButton,
    getTeamChangeColorButton,
    getTeamManageMembersButton,
    getTeamReGenerateCodeButton
} = require('../../../discord/buttons/team.js')
module.exports = {
  customId: 'teamAddMember',

  async execute(interaction) {
    try {
      const discordId = interaction.user.id
      const team = await findTeam({ discordId })
      const teamCode = team.code

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
      

      const row = new ActionRowBuilder().addComponents(getTeamReGenerateCodeButton())

      await interaction.update({
        components
      })
      
      await interaction.followUp({
        ephemeral: true,
        embeds: [getAddMemberInfoEmbed({ teamCode })],
        components: [row]
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