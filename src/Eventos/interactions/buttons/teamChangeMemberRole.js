const { ActionRowBuilder } = require('discord.js')
const { findTeam, checkTeamUserHasPerms } = require('../../../services/team.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getTeamChangeMemberRoleMenu } = require('../../../discord/menus/team.js')

const { getMemberDisplayName } = require('../../../utils/discord.js');

module.exports = {
  customId: 'teamChangeMemberRole',

  async execute(interaction) {
    const discordId = interaction.user.id;

    try {
      const perms = await checkTeamUserHasPerms({ discordId });
      if (!perms) {
        return interaction.reply({
          ephemeral: true,
          embeds: [getErrorEmbed({ error: 'No tienes permisos para cambiar roles.' })],
        })
      }

      const team = await findTeam({ discordId })

const options = await Promise.all(
  team.members
    .filter(m => m.userId.discordId !== discordId)
    .map(async m => ({
      label: await getMemberDisplayName(interaction.guild, m.userId.discordId),
      description: m.role,
      value: m.userId.discordId,
    }))
)

      const row = new ActionRowBuilder().addComponents(getTeamChangeMemberRoleMenu({ options }))

      await interaction.reply({
        ephemeral: true,
        components: [row],
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: error.message })],
      });
    }
  },
}