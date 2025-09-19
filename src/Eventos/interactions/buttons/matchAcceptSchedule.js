const { MessageFlags } = require('discord.js')
const Match = require('../../../Esquemas/Match.js')
const { checkDeadline } = require('../../../utils/date.js')
const { findMatch } = require('../../../utils/match.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getMatchInfoEmbed } = require('../../../discord/embeds/match.js')

module.exports = {
  condition: (id) => id.startsWith('matchAcceptSchedule'),

  async execute(interaction) {
    try {
      const splittedId = interaction.customId.split(':')
      const matchIndex = splittedId[1]

      const match = await findMatch({ matchIndex })

        const { passed, deadline, defaultDate } = checkDeadline(match)

        if (passed) {
          return interaction.reply({
            ephemeral: true,
            embeds: [getErrorEmbed({
              error: `Ya ha pasado el plazo para modificar el horario.\n\n` +
                    `**Fecha límite:** <t:${Math.floor(deadline.getTime() / 1000)}:F>\n` +
                    `**Horario aplicado por defecto:** <t:${Math.floor(defaultDate.getTime() / 1000)}:F>`
            })]
          })
        }


      const leaderId = splittedId[2]

      // Solo el líder correspondiente puede aceptar
      if (interaction.user.id !== leaderId) {
        return interaction.reply({
          ephemeral: true,
          embeds: [getErrorEmbed({ error: `Solo <@${leaderId}> puede aceptar la propuesta.` })]
        })
      }

      // Verificar si hay propuesta pendiente
      if (!match.proposedSchedule || match.proposedSchedule.status !== 'pending') {
        throw new Error('No hay una propuesta pendiente para aceptar.')
      }

      // Actualizar el horario
      match.scheduledAt = match.proposedSchedule.newDate
      match.proposedSchedule.status = 'accepted'
      await match.save()

      // Responder en el canal con mensaje de éxito
      await interaction.reply({
        content: `<@${leaderId}> ha aceptado la propuesta de cambio de hora.`,
        components: [await getMatchInfoEmbed({ match, showButtons: true })],
        flags: MessageFlags.IsComponentsV2
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