const { ActionRowBuilder } = require('discord.js');
const { removeMemberFromTeam, checkTeamUserHasPerms } = require('../../../services/team.js');
const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js');
const { getTeamInfoEmbed } = require('../../../discord/embeds/team.js');
const { sendLog } = require('../../../discord/send/staff.js');
const {
  getTeamLeftButton,
  getTeamChangeNameButton,
  getTeamChangeIconButton,
  getTeamChangeColorButton,
  getTeamManageMembersButton,
  getTeamReGenerateCodeButton
} = require('../../../discord/buttons/team.js');

module.exports = {
  customId: 'teamKickMemberMenu',

  async execute(interaction, client) {
    const discordId = interaction.values[0];

    try {
      await interaction.deferUpdate()

      // Comprobar permisos del usuario que ejecuta la acción
      const perms = await checkTeamUserHasPerms({ discordId: interaction.user.id });

      let components = [];

      if (perms) {
        components.push(new ActionRowBuilder().addComponents(
          getTeamChangeNameButton(),
          getTeamChangeIconButton(),
          getTeamChangeColorButton(),
          getTeamManageMembersButton(),
          getTeamReGenerateCodeButton()
        ));
      }

      components.push(new ActionRowBuilder().addComponents(getTeamLeftButton()));

      // Ejecutar la expulsión
      const team = await removeMemberFromTeam({ client, discordId });

      await sendLog({
        content: `Expulsó a <@${discordId}> del equipo **${team.name}**.`,
        client: interaction.client,
        type: 'warning',
        userId: interaction.user.id,
        eventType: 'leave'
      });

      // Editar la respuesta inicial con el embed actualizado
      await interaction.editReply({
        embeds: [getTeamInfoEmbed({ team })],
        components
      });

      // Mensaje de confirmación
      await interaction.followUp({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Se expulsó al usuario <@${discordId}> del equipo **${team.name}**.` })]
      });

    } catch (err) {
      console.error(err);

      // Edita la respuesta inicial con el error si ya se hizo deferReply
      try {
        await interaction.editReply({
          embeds: [getErrorEmbed({ error: err.message })]
        });
      } catch {
        // Si falla, hace followUp
        await interaction.followUp({
          ephemeral: true,
          embeds: [getErrorEmbed({ error: err.message })]
        });
      }
    }
  }
};