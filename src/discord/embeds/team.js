const { EmbedBuilder } = require('discord.js')

const getRestingTeamEmbed = ({ team }) => {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    )
}

module.exports = { getRestingTeamEmbed }