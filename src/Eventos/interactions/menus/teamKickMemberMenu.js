const { removeMemberFromTeam } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  customId: 'teamChangeColorMenu',

  async execute(interaction, client) {
    const discordId = interaction.values[0]
    
    try {
      const team = await removeMemberFromTeam({ discordId })

      await interaction.reply({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Se elimino al usuario <@${discordId}> del equipo ${team.name}.` })]
      })
    } catch (err) {
      console.error(err)
      await interaction.reply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: err.message })]
      })
    }
  }
}