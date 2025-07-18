const { EmbedBuilder } = require('discord.js')

const config = require('../../configs/league.js')

const getDivisionEndedEmbed = ({ division }) =>  {
    return (
        new EmbedBuilder()
            .setColor(division.color)
            .setDescription('Mantenimiento')
    )
}

module.exports = { getDivisionEndedEmbed }