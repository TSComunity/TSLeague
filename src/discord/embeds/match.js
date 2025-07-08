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

const getRestingEmbed = ({ team }) => {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    )
}



module.exports = { getMatchScheduledEmbed, getMatchCancelledEmbed, getRestingEmbed }