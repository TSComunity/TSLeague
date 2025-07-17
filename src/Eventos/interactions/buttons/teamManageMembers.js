const { ActionRowBuilder } = require('discord.js')

const { checkTeamUserHasPerms, findTeam } = require('../../../services/team.js')
const { getTeamAddMemberButton, getTeamChangeMemberRoleButton, getTeamKickMemberButton } = require('../../../discord/buttons/team.js')
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

      const team = await findTeam({ discordId })

      const row = new ActionRowBuilder().addComponents(
        getTeamAddMemberButton(),
        getTeamChangeMemberRoleButton(),
        getTeamKickMemberButton
      )

      await interaction.update({
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