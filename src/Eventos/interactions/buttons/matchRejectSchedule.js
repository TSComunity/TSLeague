const { ActionRowBuilder } = require('discord.js')
const Match = require('../../../Esquemas/Match.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  condition: (id) => id.startsWith('matchRejectSchedule'),

  async execute(interaction) {
    try {
      const splittedId = interaction.customId.split(':')
      const matchIndex = splittedId[1]
      const leaderId = splittedId[2]

      // Solo el líder correspondiente puede rechazar
      if (interaction.user.id !== leaderId) {
        return interaction.reply({
          ephemeral: true,
          embeds: [getErrorEmbed({ error: `Solo <@${leaderId}> puede aceptar la propuesta.` })]
        })
      }

      const match = await Match.findOne({ matchIndex })
      if (!match) throw new Error('No se ha encontrado el partido.')

      // Verificar si hay propuesta pendiente
      if (!match.proposedSchedule || match.proposedSchedule.status !== 'pending') {
        throw new Error('No hay una propuesta pendiente para rechazar.')
      }

      // Rechazar la propuesta
      match.proposedSchedule.status = 'rejected'
      await match.save()

      // Responder en el canal con mensaje
      await interaction.reply({
        embeds: [getSuccesEmbed({ message: `<@${leaderId}> ha rechazado la propuesta de cambio de hora.` })],
        components: []
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