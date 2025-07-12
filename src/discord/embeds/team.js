const { EmbedBuilder } = require('discord.js')

const getTeamInfoEmbed = ({ team, perms }) => {
    return (
        new EmbedBuilder()
            .setColor(team.color)
            .setDescription('Mantenimiento')
    )
}

const getRestingTeamEmbed = ({ team }) => {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    )
}

module.exports = { getTeamInfoEmbed, getRestingTeamEmbed }