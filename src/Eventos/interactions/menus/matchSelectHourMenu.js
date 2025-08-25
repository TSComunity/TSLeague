const { ActionRowBuilder, EmbedBuilder } = require('discord.js')
const Match = require('../../../Esquemas/Match.js')
const { getDate } = require('../../../utils/date.js')
const { findMatchByIndex } = require('../../../utils/match.js')
const { getMatchProposedScheduleEmbed } = require('../../../discord/embeds/match.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getMatchAcceptScheduleButton, getMatchRejectScheduleButton } = require('../../../discord/buttons/match.js') 

module.exports = {
  condition: (id) => id.startsWith('matchSelectHourMenu'),

  async execute(interaction) {
    try {
      const splittedId = interaction.customId.split(':')
      const matchIndex = splittedId[1]
      const day = splittedId[2]
      const splittedValues = interaction.values[0].split(':')
      const hour = splittedValues[0]
      const minute = splittedValues[1]

      // Buscar el partido
      const match = await findMatchByIndex({ matchIndex })

      if (!match) throw new Error('No se ha encontrado el partido.')

      // Verificar propuesta pendiente
      if (match.proposedSchedule?.status && match.proposedSchedule.status === 'pending') {
        throw new Error('Ya hay una propuesta de cambio de hora activa.')
      }

      // Nueva fecha y timestamp UNIX
      const newDate = getDate({ day: Number(day), hour: Number(hour), minute: Number(minute) })
      const timestampUnix = Math.floor(newDate.getTime() / 1000)
      const oldTimestampUnix = Math.floor(match.scheduledAt.getTime() / 1000)

      // Obtener líderes
      const leaderA = match.teamAId.members.find(m => m.role === 'leader')
      const leaderB = match.teamBId.members.find(m => m.role === 'leader')
      if (!leaderA || !leaderB) throw new Error('No se ha encontrado alguno de los líderes.')

      let leader = null
      if (leaderA.userId.discordId === interaction.user.id) leader = leaderA
      if (leaderB.userId.discordId === interaction.user.id) leader = leaderB
      if (!leader) throw new Error('No eres líder de ninguno de los equipos.')

      const opponentLeader = leader.userId.discordId === leaderA.userId.discordId ? leaderB : leaderA

      // Guardar propuesta
      match.proposedSchedule = {
        newDate,
        proposedBy: leader._id,
        status: 'pending'
      }
      await match.save()

      const getDay = (day) => {
        if (day === '1') return 'Lunes'
        if (day === '2') return 'Martes'
        if (day === '3') return 'Miércoles'
        if (day === '4') return 'Jueves'
        if (day === '5') return 'Viernes'
        if (day === '6') return 'Sábado'
        if (day === '0') return 'Domingo'
        return null
      }

      // Responder al que propuso
      await interaction.update({
        ephemeral: true,
        content: `### Propuesta de cambio de horario\n> Día: ${getDay(day)}\n> Hora: ${hour}:${minute}`,
        embeds: [getSuccesEmbed({ message: `Propuesta de cambio de hora registrada para <t:${timestampUnix}:F>.` })],
        components: []
      })

      const row = new ActionRowBuilder().addComponents(
        getMatchAcceptScheduleButton({ matchIndex: match.matchIndex, leaderId: opponentLeader.userId.discordId }),
        getMatchRejectScheduleButton({ matchIndex: match.matchIndex, leaderId: opponentLeader.userId.discordId })
      )

      await interaction.channel.send({ content: `<@${opponentLeader.userId.discordId}>`, embeds: [getMatchProposedScheduleEmbed({ interaction, oldTimestampUnix, timestampUnix })], components: [row] })

      // --- Opcional: enviar DM ---
      // const user = await interaction.client.users.fetch(opponentLeader.userId.discordId)
      // await user.send({ embeds: [embed], components: [row] })

    } catch (error) {
      console.error(error)
      return interaction.reply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: error.message })]
      })
    }
  }
}