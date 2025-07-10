const { EmbedBuilder } = require('discord.js')

const getMatchScheduledEmbed = ({ match }) => {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    )
}

const getMatchCancelledEmbed = ({ match }) => {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    )
}

const getMatchInfoEmbed = ({ match }) => {
    return
}

module.exports = { getMatchScheduledEmbed, getMatchCancelledEmbed, getMatchInfoEmbed }