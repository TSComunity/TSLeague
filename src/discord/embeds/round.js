const { EmbedBuilder } = require('discord.js')
const emojis = require('../../configs/emojis.json')

// Embed general de jornada, robusto ante datos nulos
const getRoundAddedEmbed = ({ divisionsWithNewRounds, season, nextRoundIndex }) => {
  const { name } = season

  let matchesLength = 0
  let restingLength = 0
  for (const division of divisionsWithNewRounds) {
    matchesLength += (division.newMatchesDocs?.length || 0)
    restingLength += (division.newRestingTeamsDocs?.length || 0)
  }

  return (
      new EmbedBuilder()
          .setColor('Purple')
          .setDescription(`## ${emojis.round} Jornada ${nextRoundIndex} — Temporada ${name}`)
          .addFields(
              { name: `${emojis.match} Nuevos partidos`, value: `\`${matchesLength}\``, inline: true },
              { name: `${emojis.rest} Nuevos descansos`, value: `\`${restingLength}\``, inline: true },
              { name: '** **', value: '** **', inline: true }
          )
  )
}

module.exports = { getRoundAddedEmbed }