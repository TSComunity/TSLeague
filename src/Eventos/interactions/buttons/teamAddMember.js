const { ActionRowBuilder } = require('discord.js')

const { findTeam, checkTeamUserHasPerms } = require('../../../services/team.js')
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
      const team = await findTeam({ discordId })
      const code = team.code

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
      
      await interaction.reply({
        ephemeral: true,
        embeds: [getAddMemberInfoEmbed({ code })],
        componentes: [row]
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