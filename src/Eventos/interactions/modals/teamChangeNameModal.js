const { updateTeam, checkTeamUserHasPerms } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getTeamInfoEmbed } = require('../../../discord/embeds/team.js')

module.exports = {
  customId: 'teamChangeNameModal',

  async execute(interaction) {
    try {
      const name = interaction.fields.getTextInputValue('teamNameInput').trim()
      const discordId = interaction.user.id

      const team = await updateTeam({ discordId, name })

      const perms = await checkTeamUserHasPerms({ discordId })

      await interaction.update({
        content: 'Equipo actualizado con exito.',
        embeds: [getTeamInfoEmbed({ perms, team })]
      })

      return interaction.followUp({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Se ha actualizado el nombre del equipo por **${team.name}**.` })],
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