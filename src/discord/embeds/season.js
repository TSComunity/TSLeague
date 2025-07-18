const { EmbedBuilder } = require('discord.js')

const { getCurrentRoundNumber } = require('../../services/round.js')

const getSeasonStartedEmbed = ({ season }) =>  {
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
    const { seasonIndex, name, status, divisions } = season

    const roundNumber = getCurrentRoundNumber({ season })
    let teamsLength = 0
    let matchesLength = 0

    for (const division of divisions) {
        const { teams, rounds } = division
        teamsLength += teams.length

        for (const round of rounds) {
            matchesLength += round.matches.length
        }
    }

    return (
        new EmbedBuilder()
            .setColor('Purple')
            .setDescription(`## Temporada ${name}`)
            .addFields(
                { name: 'Indice', value: `👆 \`${seasonIndex}\``, inline: true },
                { name: 'Estado', value: `\`${status === 'active' ? '📅 En curso' : '📅 Finalizada'}\``, inline: true },
                { name: 'Rondas', value: `🖇️ \`${roundNumber}\``, inline: true },
                { name: 'Divisiones', value: `🧩 \`${divisions.length}\``, inline: true },
                { name: 'Equipos', value: `👥 \`${teamsLength}\``, inline: true },
                { name: 'Partidos', value: `🎯 \`${matchesLength}\``, inline: true }
            )
    )
}

module.exports = { getSeasonStartedEmbed, getSeasonEndedEmbed, getSeasonSummaryEmbed }