const { EmbedBuilder } = require('discord.js')

const getMatchScheduledEmbeds = ({ match }) => {
    return [
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    ]
}

const getMatchCancelledEmbeds = ({ team, match }) => {
    return [
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    ]
}

const getRestingEmbeds = ({ team }) => {
    return [
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    ]
}



module.exports = { getMatchScheduledEmbeds, getMatchCancelledEmbeds, getRestingEmbeds }