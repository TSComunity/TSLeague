const { updateTeam, checkTeamUserHasPerms } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getTeamInfoEmbed } = require('../../../discord/embeds/team.js')
const { sendLog } = require('../../../discord/send/staff.js')

module.exports = {
  customId: 'teamChangeIconModal',

  async execute(interaction) {
      try {
        function isValidURL({ url }) {
          if (!url || typeof url !== 'string') return false

          try {
            const parsed = new URL(url)

            // Verificar protocolo
            if (!['http:', 'https:'].includes(parsed.protocol)) return false

            // Verificar que no tenga espacios
            if (/\s/.test(url)) return false

            // Verificar que tenga hostname
            if (!parsed.hostname) return false

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

      await sendLog({
        content: `Cambió el icono del equipo **${team.name}**.`,
        client: interaction.client,
        type: 'success',
        userId: discordId,
        eventType: 'team'
      })

      const perms = await checkTeamUserHasPerms({ discordId })

      await interaction.update({
        content: 'Equipo actualizado con exito.',
        embeds: [getTeamInfoEmbed({ perms, team })]
      })

      return interaction.followUp({
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