const { removeMemberFromTeam } = require('../../services/team.js') // teamname, discordid
const { getErrorEmbed } = require('../../discord/embeds/management.js')

module.exports = {
  customId: 'equipo_salir',

  async execute(interaction) {
    try {
      const team = await leaveTeam({ discordId: interaction.user.id })

      return interaction.reply({
        ephemeral: true,
        content: '✅ Has salido del equipo correctamente.'
      });
    } catch (error) {
      console.error('Error al salir del equipo:', error);
      return interaction.reply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: error.message })]
      });
    }
  }
}