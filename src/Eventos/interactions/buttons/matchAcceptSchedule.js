const { MessageFlags } = require('discord.js')
const Match = require('../../../Esquemas/Match.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getMatchInfoEmbed } = require('../../../discord/embeds/match.js')

module.exports = {
  condition: (id) => id.startsWith('matchAcceptSchedule'),

  async execute(interaction) {
    try {
      const splittedId = interaction.customId.split(':')
      const matchIndex = splittedId[1]
      const leaderId = splittedId[2]

      // Solo el líder correspondiente puede aceptar
      if (interaction.user.id !== leaderId) {
        return interaction.reply({
          ephemeral: true,
          embeds: [getErrorEmbed({ error: `Solo <@${leaderId}> puede aceptar la propuesta.` })]
        })
      }

      const match = await Match.findOne({ matchIndex })
        .populate({
            path: 'teamAId',             // primero poblamos el equipo completo
            model: 'Team',
            populate: {
            path: 'members.userId',    // luego poblamos los usuarios de los miembros
            model: 'User'
            }
        })
        .populate({
            path: 'teamBId',
            model: 'Team',
            populate: {
            path: 'members.userId',
            model: 'User'
            }
        })
      if (!match) throw new Error('No se ha encontrado el partido.')

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
        components: [getMatchInfoEmbed({ match, showButtons: true })],
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