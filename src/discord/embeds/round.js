const { EmbedBuilder } = require('discord.js')

const getRoundAddedEmbed = ({ divisionsWithNewRounds, seasonIndex, seasonName, nextRoundIndex }) => {

  let matchesLength = 0
  let restingLength = 0
  for (const division of divisionsWithNewRounds) {
    matchesLength += division.newMatchesDocs.length
    restingLength += division.newRestingTeamsDocs.length
  }

  return (
      new EmbedBuilder()
          .setColor('Purple')
          .setDescription(`## Nueva Jornada - Temporada ${seasonName}`)
          .addFields(
              { name: 'Indice', value: `👆 \`${seasonIndex}\``, inline: true },
              { name: 'Estado', value: `\`📅 En curso\``, inline: true },
              { name: 'Ronda', value: `🖇️ \`${nextRoundIndex}\``, inline: true },
              { name: 'Divisiones', value: `🧩 \`${divisions.length}\``, inline: true },
              { name: 'Nuevos partidos', value: `👥 \`${matchesLength}\``, inline: true },
              { name: 'Nuevos descansos', value: `🎯 \`${restingLength}\``, inline: true }
          )
  )
}

const getRoundDivisionAddedEmbed = ({ division, seasonIndex, seasonName, nextRoundIndex }) => {
  const { divisionDoc, newMatchesDocs, newRestingTeamsDocs } = division

  const divisionName = divisionDoc.name || 'División sin nombre'

  const embed = new EmbedBuilder()
    .setColor('Blue')
    .setDescription(`### Nuevos Partidos - Division ${divisionName}`)

  for (const match of newMatchesDocs) {
    const teamAName = match.teamAId.name || 'Sin nombre'
    const teamBName = match.teamBId.name || 'Sin nombre'
    const channel = `<#${match.channelId}>` || 'Sin canal'
    const timestampText = (() => {
      if (match.scheduledAt) {
        const unix = Math.floor(match.scheduledAt.getTime() / 1000)
        return `<t:${unix}:R>` // formato relativo de Discord
      }
      return 'Sin fecha'
    })()



    embed.addFields(
      { name: `🆚 ${teamAName} vs ${teamBName}`, value: `💬 Canal: ${channel}\n🕛 Horario: ${timestamptText}`, inline: true}
    )
  }

  for (const restingTeam of newRestingTeamsDocs) {
    const teamName = restingTeam.name || 'Sin nombre'

    embed.addFields(
      { name: `💤 ${teamName}`, value: '💤 Descansa esta jornada', inline: true}
    )
  }

  return embed
}

module.exports = { getRoundAddedEmbed, getRoundDivisionAddedEmbed }