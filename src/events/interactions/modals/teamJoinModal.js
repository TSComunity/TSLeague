const { ActionRowBuilder } = require('discord.js');

const { addMemberToTeam } = require('../../../services/team.js');
const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js');
const { getTeamShowButton, getTeamLeftButton } = require('../../../discord/buttons/team.js');
const { sendLog } = require('../../../discord/send/staff.js');

module.exports = {
  customId: 'teamJoinModal',

  async execute(interaction, client) {
    try {
      // Responde rápido para que Discord no marque el modal como sin respuesta
      await interaction.deferReply({ ephemeral: true });

      const teamCode = interaction.fields.getTextInputValue('teamCodeInput').trim();
      const discordId = interaction.user.id;

      // Ejecuta la operación principal
      const team = await addMemberToTeam({ client, discordId, teamCode });

      // Log interno
      await sendLog({
        content: `El usuario <@${discordId}> se ha unido al equipo **${team.name}**.`,
        client,
        type: 'success',
        userId: discordId,
        eventType: 'join'
      });

      // Botones del equipo
      const teamRow = new ActionRowBuilder().addComponents(
        getTeamShowButton(),
        getTeamLeftButton()
      );

      // Edita la respuesta diferida
      await interaction.editReply({
        embeds: [getSuccesEmbed({ message: `Te has unido al equipo **${team.name}**.` })],
        components: [teamRow]
      });

    } catch (error) {
      console.error(error);

      // Edita la respuesta con el error
      try {
        await interaction.editReply({
          embeds: [getErrorEmbed({ error: error.message })]
        });
      } catch {
        // En caso de que la respuesta diferida falle
        await interaction.followUp({
          ephemeral: true,
          embeds: [getErrorEmbed({ error: error.message })]
        });
      }
    }
  }
}