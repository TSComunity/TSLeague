const { ActionRowBuilder } = require('discord.js')
const Match = require('../../../Esquemas/Match.js')
const { getDate } = require('../../../utils/date.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getMatchAcceptScheduleButton, getMatchRejectScheduleButton } = require('../../../discord/buttons/match.js') 

module.exports = {
  condition: (id) => id.startsWith('teamSelectHourMenu'),

  async execute(interaction) {
    try {
      const splittedId = interaction.customId.split(':')
      const matchIndex = splittedId[1]
      const day = splittedId[2]
      const hour = splittedId[3]
      const minute = interaction.values[0]

      // Buscar el partido
      const match = await Match.findOne({ matchIndex })
        .populate({
          path: 'teamAId',
          select: 'members',
          populate: {
            path: 'members.userId', // popular cada member con su User
            select: 'discordId'
          }
        })
        .populate({
          path: 'teamBId',
          select: 'members',
          populate: {
            path: 'members.userId',
            select: 'discordId'
          }
        })

      if (!match) throw new Error('No se ha encontrado el partido.')

      // Verificar si ya hay una propuesta pendiente
      if (match.proposedSchedule && match.proposedSchedule.status === 'pending') {
        throw new Error('Ya hay una propuesta de cambio de hora pendiente.')
      }

      // Obtener la nueva fecha y timestamp UNIX
      const newDate = getDate({ day: Number(day), hour: Number(hour), minute: Number(minute) })
      const timestampUnix = Math.floor(newDate.getTime() / 1000)

      const leaderA = match.teamAId.members.find(m => m.role === 'leader')
      if (!leaderA) throw new Error('No se ha encontrado el usuario.')
      const leaderB = match.teamBId.members.find(m => m.role === 'leader')
      if (!leaderB) throw new Error('No se ha encontrado el usuario.')

      let leader = null
      if (leaderA.discordId === interaction.user.id) leader = leaderA
      if (leaderB.discordId === interaction.user.id) leader = leaderB
      if (!leader) throw new Error('No se ha encontrado el usuario.')

      // Guardar propuesta en el schema
      match.proposedSchedule = {
        newDate,
        proposedBy: leader._id,
        status: 'pending'
      }
      await match.save()

      // Actualizar ephemeral del usuario que propuso
      await interaction.update({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Propuesta de cambio de hora registrada para <t:${timestampUnix}:F>.` })],
        components: []
      })

      // Identificar líder del otro equipo
      const opponentLeader = leaderA.discordId === leader.discordId
        ? leaderB : leaderA
      const leaderId = opponentLeader.discordId
      if (!opponentLeader) throw new Error('No se ha encontrado el usuario.')

      // Crear embed y botones
      const embed = new EmbedBuilder()
        .setDescription(`Se ha propuesto cambiar la hora del partido #${matchIndex} a <t:${timestampUnix}:F>`)
        .setColor('Yellow')

      const row = new ActionRowBuilder().addComponents(
        getMatchAcceptScheduleButton({ matchIndex: match.matchIndex, leaderId }),
        getMatchRejectScheduleButton({ matchIndex: match.matchIndex, leaderId })
      )

      // Enviar followUp al canal o DM del líder (puedes cambiar user.send() por canal específico)
      const user = await interaction.client.users.fetch(leaderId)
      await user.send({ embeds: [embed], components: [row] })

    } catch (error) {
      console.error(error)
      return interaction.reply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: error.message })]
      })
    }
  }
}