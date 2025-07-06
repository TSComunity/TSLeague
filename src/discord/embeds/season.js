const { EmbedBuilder } = require('discord.js')

const getSeasonCreatedEmbeds = ({ season }) =>  {
    return [
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    ]
}

const getSeasonEndedEmbeds = ({ season }) =>  {
    return [
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    ]
}

module.exports = { getSeasonCreatedEmbeds, getSeasonEndedEmbeds }