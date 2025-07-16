const { updateTeam, checkTeamUserHasPerms } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getTeamInfoEmbed } = require('../../../discord/embeds/team.js')

module.exports = {
  customId: 'teamChangeIconModal',

  async execute(interaction) {
      try {
            const isValidURL = ({ url }) => {
        try {
          new URL(url)
          return true
        } catch {
          return false
        }
      }

      const iconURL = interaction.fields.getTextInputValue('teamIconInput').trim()
      const discordId = interaction.user.id

      const isValid = isValidURL({ url: iconURL})

      if (!isValid) {
        return interaction.reply({
          ephemeral: true,
          embeds: [getErrorEmbed({ error: `**${iconURL}** no es una URL válida.` })]
        })
      }

      const team = await updateTeam({ discordId, iconURL })

      const perms = await checkTeamUserHasPerms({ discordId })

      await interaction.update({
        content: 'Equipo actualizado con exito.',
        embeds: getTeamInfoEmbed({ perms, team })
      })

      return interaction.reply({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Se ha actualizado el icono del equipo **${team.name}** por:`, imageURL: iconURL })],
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