const { EmbedBuilder } = require('discord.js')
const emojis = require('../../configs/emojis.json')

const getRoundAddedEmbed = ({ divisionsWithNewRounds, season, nextRoundIndex }) => {
    const { name, seasonIndex } = season

    let matchesLength = 0
    let restingLength = 0
    for (const division of divisionsWithNewRounds) {
        matchesLength += (division.newMatchesDocs?.length || 0)
        restingLength += (division.newRestingTeamsDocs?.length || 0)
    }

    return new EmbedBuilder()
        .setColor('Gold')
        .setDescription(`## ${emojis.round} Jornada ${nextRoundIndex} — Temporada ${name} (Edición ${seasonIndex})`)
        .addFields(
            { name: `Nuevos partidos`, value: `${emojis.match} \`${matchesLength}\``, inline: true },
            { name: `Nuevos descansos`, value: `${emojis.rest} \`${restingLength}\``, inline: true }
        )
}


module.exports = { getRoundAddedEmbed }