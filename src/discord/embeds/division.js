const { EmbedBuilder } = require('discord.js')

const getDivisionEndedEmbed = ({ division }) =>  {
    return (
        new EmbedBuilder()
            .setColor(division.color)
            .setDescription('Division terminada')
    )
}

module.exports = { getDivisionEndedEmbed }