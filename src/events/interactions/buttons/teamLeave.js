const { removeMemberFromTeam } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { sendLog } = require('../../../discord/send/staff.js')

module.exports = {
  customId: 'teamLeave',

  async execute(interaction, client) {
    try {
      await interaction.reply({ ephemeral: true, content: 'Procesando tu solicitud...' });

      const team = await removeMemberFromTeam({ client, discordId: interaction.user.id })

      await sendLog({
        content: `Abandonó el equipo **${team.name}**.`,
        client: interaction.client,
        type: 'warning',
        userId: interaction.user.id,
        eventType: 'leave'
      })

      return interaction.editReply({
        ephemeral: true,
        content: '',
        embeds: [getSuccesEmbed({ message: `Has abandonado el equipo **${team.name}**.`})]
      })
    } catch (error) {
      console.error(error)
      return interaction.editReply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: error.message })]
      })
    }
  }
}