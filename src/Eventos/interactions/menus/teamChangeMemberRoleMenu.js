const {
  ActionRowBuilder
} = require('discord.js')

const {
  getTeamChangeMemberRoleToLeader,
  getTeamChangeMemberRoleToSubLeader,
  getTeamChangeMemberRoleToMember,
  getTeamCancelButton
} = require('../../../discord/buttons/team.js')

const {
  findTeam,
  checkTeamUserHasPerms
} = require('../../../services/team.js')

const { getErrorEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  customId: 'teamChangeMemberRole',

  /**
   * Maneja la selección de un miembro para cambiar su rol.
   * @param {import('discord.js').StringSelectMenuInteraction} interaction
   */
  async execute(interaction) {
    try {
      const selectedDiscordId = interaction.values[0]; // ID del miembro elegido
      const executorDiscordId = interaction.user.id;

      const hasPerms = await checkTeamUserHasPerms({ discordId: executorDiscordId });
      if (!hasPerms) {
        return interaction.reply({
          ephemeral: true,
          embeds: [getErrorEmbed({ error: 'No tienes permisos para cambiar roles.' })]
        })
      }

      const team = await findTeam({ discordId: executorDiscordId });

      const executor = team.members.find(m => m.userId.discordId === executorDiscordId);
      const executorRole = executor?.role;
      const selected = team.members.find(m => m.userId.discordId === selectedDiscordId);
      const selectedRole = selected?.role;
      if (!executorRole) throw new Error('No se pudo determinar el rol del usuario en el equipo.');
      if (!selectedRole) throw new Error('No se pudo determinar el rol del usuario en el equipo.');

      const buttons = [];

      // Permisos según el rol del que ejecuta:
      if (executorRole === 'leader') {
          if (selectedRole === 'sub-leader') {
            buttons.push(
              getTeamChangeMemberRoleToLeader({ discordId: selectedDiscordId }),
              getTeamChangeMemberRoleToMember({ discordId: selectedDiscordId })
            )
          } else if (selectedRole === 'member') {
            buttons.push(
              getTeamChangeMemberRoleToLeader({ discordId: selectedDiscordId }),
              getTeamChangeMemberRoleToSubLeader({ discordId: selectedDiscordId })
            )    
          }

      } else if (executorRole === 'sub-leader') {
          if (selectedRole === 'sub-leader') {
            buttons.push(
              getTeamChangeMemberRoleToMember({ discordId: selectedDiscordId })
            )
          } else if (selectedRole === 'member') {
            buttons.push(
              getTeamChangeMemberRoleToSubLeader({ discordId: selectedDiscordId })
            )    
          }
      } else {
        return interaction.reply({
          ephemeral: true,
          embeds: [getErrorEmbed({ error: 'No tienes permisos suficientes para cambiar roles.' })]
        })
      }

      const row = new ActionRowBuilder().addComponents(buttons);
      const row2 = new ActionRowBuilder().addComponents(getTeamCancelButton())

      await interaction.update({
        components: [row, row2]
      })

    } catch (error) {
      console.error(error);
      return interaction.reply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: error.message })]
      })
    }
  }
}