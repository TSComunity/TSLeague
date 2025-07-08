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

const getSeasonSummaryEmbed = ({ season }) => {
    const activeDivisions = season.divisions.filter(d => d.status !== 'ended')
    const endedDivisions = season.divisions.length - activeDivisions.length

    return (
        new EmbedBuilder()
        .setTitle(`Temporada ${season.seasonIndex}`)
        .addFields(
            { name: 'Divisiones activas', value: `${activeDivisions.length}`, inline: true },
            { name: 'Divisiones terminadas', value: `${endedDivisions}`, inline: true },
            { name: 'Rondas', value: `${Math.max(...season.divisions.map(d => d.rounds.length))}`, inline: true }
        )
        .setColor('Blue')
    )
}


module.exports = { getSeasonCreatedEmbed, getSeasonEndedEmbed, getSeasonSummaryEmbed }