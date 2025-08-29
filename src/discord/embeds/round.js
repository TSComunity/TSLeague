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
              { name: `Nuevos partidos`, value: `${emojis.match} \`${matchesLength}\``, inline: true },
              { name: `Nuevos descansos`, value: `${emojis.rest} \`${restingLength}\``, inline: true }
          )
  )
}

module.exports = { getRoundAddedEmbed }