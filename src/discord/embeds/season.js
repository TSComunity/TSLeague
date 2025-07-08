const { EmbedBuilder } = require('discord.js')

const getSeasonCreatedEmbed = ({ season }) =>  {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    )
}

const getSeasonEndedEmbed = ({ season }) =>  {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    )
}

const getSeasonDivisionEndedEmbed = ({ division }) =>  {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    )
}

module.exports = { getSeasonCreatedEmbed, getSeasonEndedEmbed, getSeasonDivisionEndedEmbed }