const { MessageFlags, ButtonBuilder, ActionRowBuilder } = require('discord.js')
const { checkDeadline } = require('../../../utils/date.js')
const { findMatch } = require('../../../utils/match.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getMatchInfoEmbed, getMatchProposedScheduleEmbed } = require('../../../discord/embeds/match.js')

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

      const disabledRow = new ActionRowBuilder()
        .addComponents(
          ...interaction.message.components[0].components.map(button =>
            ButtonBuilder.from(button).setDisabled(true)
          )
        )

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
  status: 'accepted'
})], components: [disabledRow] })

      await interaction.followUp({
        embeds: [getSuccesEmbed({ message: `<@${leaderId}> ha aceptado la propuesta de cambio de hora.` })]
      })      
      await interaction.channel.send({
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