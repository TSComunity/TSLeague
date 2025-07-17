const { updateTeamCode, checkTeamUserHasPerms } = require('../../../services/team.js')

const { getTeamInfoEmbed } = require('../../../discord/embeds/team.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  customId: 'teamReGenerateCode',

  async execute(interaction) {
    try {
        const discordId = interaction.user.id
        const perms = await checkTeamUserHasPerms({ discordId })

        if (!perms) {
            return interaction.reply({
                ephemeral: true,
                embeds: [getErrorEmbed({ error: 'No tienes permisos para utilizar esta interaccion.' })]
            })
        }

      const team = await updateTeamCode({ discordId: interaction.user.id })

      await interaction.update({
        content: 'Equipo actualizado con exito.',
        embeds: [getTeamInfoEmbed({ perms, team })]
      })

      return interaction.followUp({
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