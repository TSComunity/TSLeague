const { updateTeam, checkTeamUserHasPerms } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getTeamInfoEmbed } = require('../../../discord/embeds/team.js')

const colors = require('../../../configs/colors.json')

module.exports = {
  customId: 'teamChangeColorMenu',

  async execute(interaction, client) {
    const selectedColor = interaction.values[0]
    
    try {
      const discordId = interaction.user.id
      const team = await updateTeam({ discordId, color: selectedColor })

      const color = colors.find(c => c.value === selectedColor)
      
      const perms = await checkTeamUserHasPerms({ discordId })

      await interaction.update({
        content: 'Equipo actualizado con exito.',
        embeds: getTeamInfoEmbed({ perms, team })
      })

      await interaction.followUp({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Se ha actualizado el color del equipo ${team.name} por \`${color.emoji} ${color.label}\`.` })]
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