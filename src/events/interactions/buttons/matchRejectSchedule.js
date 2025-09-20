const { ActionRowBuilder, ButtonBuilder } = require('discord.js')
const { checkDeadline } = require('../../../utils/date.js')
const { findMatch } = require('../../../utils/match.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getMatchProposedScheduleEmbed } = require('../../../discord/embeds/match.js')

module.exports = {
  condition: (id) => id.startsWith('matchRejectSchedule'),

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

      // Solo el líder correspondiente puede rechazar
      if (interaction.user.id !== leaderId) {
        return interaction.reply({
          ephemeral: true,
          embeds: [getErrorEmbed({ error: `Solo <@${leaderId}> puede rechazar la propuesta.` })]
        })
      }

      // Verificar si hay propuesta pendiente
      if (!match.proposedSchedule || match.proposedSchedule.status !== 'pending') {
        throw new Error('No hay una propuesta pendiente para rechazar.')
      }

      // Rechazar la propuesta
      match.proposedSchedule.status = 'rejected'
      await match.save()

      // Deshabilitar botones
      const disabledRow = new ActionRowBuilder()
        .addComponents(
          ...interaction.message.components[0].components.map(button =>
            ButtonBuilder.from(button).setDisabled(true)
          )
        )

      // Timestamp de la hora actual del partido
      const oldTimestampUnix = match.scheduledAt
        ? Math.floor(match.scheduledAt.getTime() / 1000)
        : null

      // Timestamp de la hora propuesta
      const timestampUnix = match.proposedSchedule?.newDate
        ? Math.floor(match.proposedSchedule.newDate.getTime() / 1000)
        : null

      await interaction.update({ embeds: [getMatchProposedScheduleEmbed({
  interaction,
  oldTimestampUnix,
  timestampUnix,
  status: 'rejected' // o 'accepted'
})], components: [disabledRow] })

      // Responder en el canal con mensaje
      await interaction.followUp({
        embeds: [getSuccesEmbed({ message: `<@${leaderId}> ha rechazado la propuesta de cambio de hora.` })]
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