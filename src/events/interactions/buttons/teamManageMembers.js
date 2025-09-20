const { ActionRowBuilder } = require('discord.js')

const { checkTeamUserHasPerms} = require('../../../services/team.js')
const { findTeam } = require('../../../utils/team.js')
const { getTeamAddMemberButton, getTeamChangeMemberRoleButton, getTeamKickMemberButton, getTeamCancelButton } = require('../../../discord/buttons/team.js')
const { getErrorEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  customId: 'teamManageMembers',

  async execute(interaction) {
    try {
      const discordId = interaction.user.id
      const perms = await checkTeamUserHasPerms({ discordId })

      if (!perms) {
        return interaction.reply({
          ephemeral: true,
          embeds: [getErrorEmbed({ error: 'No tienes permisos para utilizar esta interacción.' })]
        })
      }

      const row = new ActionRowBuilder().addComponents(
        getTeamAddMemberButton(),
        getTeamChangeMemberRoleButton(),
        getTeamKickMemberButton()
      )
      const row2 = new ActionRowBuilder().addComponents(getTeamCancelButton())

      await interaction.update({
        components: [row, row2]
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