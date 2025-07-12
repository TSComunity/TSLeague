const { updateTeamCode } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  customId: 'teamReGenerateCode',

  async execute(interaction) {
    try {
      const team = await updateTeamCode({ discordId: interaction.user.id })

      return interaction.reply({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Nuevo codigo del equipo: \`${team.code}\``})]
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