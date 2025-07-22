const { EmbedBuilder } = require('discord.js')

// Embed general de jornada, robusto ante datos nulos
const getRoundAddedEmbed = ({ divisionsWithNewRounds, season, nextRoundIndex }) => {
  const { name, seasonIndex } = season

  let matchesLength = 0
  let restingLength = 0
  for (const division of divisionsWithNewRounds) {
    matchesLength += (division.newMatchesDocs?.length || 0)
    restingLength += (division.newRestingTeamsDocs?.length || 0)
  }

  return (
      new EmbedBuilder()
          .setColor('Purple')
          .setDescription(`## Jornada ${nextRoundIndex} - Temporada ${name}`)
          .addFields(
              { name: 'Indice', value: `👆 \`${seasonIndex}\``, inline: true },
              { name: 'Estado', value: `\`📅 En curso\``, inline: true },
              { name: 'Jornadas', value: `🖇️ \`${nextRoundIndex}\`a`, inline: true },
              { name: 'Nuevos partidos', value: `👥 \`${matchesLength}\``, inline: true },
              { name: 'Nuevos descansos', value: `🎯 \`${restingLength}\``, inline: true },
              { name: '** **', value: '** **', inline: true }
          )
  )
}

module.exports = { getRoundAddedEmbed }