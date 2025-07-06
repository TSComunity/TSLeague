const { EmbedBuilder } = require('discord.js')

const getRoundAddedEmbeds = ({ divisionsWithNewRounds, divisionsSkipped, nextRoundIndex }) =>  {
    return [
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    ]
}

module.exports = { getRoundAddedEmbeds }