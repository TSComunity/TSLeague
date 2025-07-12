const { updateTeam } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  customId: 'teamChangeColorMenu',

  async execute(interaction, client) {
    const selectedColor = interaction.values[0]
    
    try {
      const team = await updateTeam({ discordId: interaction.user.id, color: selectedColor })

      await interaction.reply({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Se ha actualizado el color del equipo ${team.name} por \`${selectedColor}\`.` })]
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