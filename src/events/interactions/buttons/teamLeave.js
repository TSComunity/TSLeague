const { removeMemberFromTeam } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  customId: 'teamLeave',

  async execute(interaction, client) {
    try {
      const team = await removeMemberFromTeam({ client, discordId: interaction.user.id })

      return interaction.reply({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Has abandonado el equipo **${team.name}**.`})]
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