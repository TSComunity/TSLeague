const { EmbedBuilder } = require('discord.js')

const { getCurrentRoundNumber } = require('../../utils/round.js')

const getSeasonStartedEmbed = ({ season }) =>  {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Temporada comenzada (es prueba)')
    )
}

const getSeasonEndedEmbed = ({ season }) =>  {
    const { name, seasonIndex, divisions, status } = season

    // Cálculo de totales
    let totalRounds = 0
    let totalMatches = 0
    let totalTeams = 0

    // Top 3 por cada división
    const divisionsRanking = divisions.map(division => {
        const divisionName = division.divisionId.name || 'Sin nombre'
        const divisionEmoji = division.divisionId.emoji || '🏆'
        const divisionColor = division.divisionId.color || 'Grey'
        const teamsSorted = [...division.teams].sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
        totalTeams += teamsSorted.length

        const top3 = teamsSorted.slice(0, 3).map((team, idx) => {
            const teamName = team.teamId?.name || 'Sin nombre'
            const pts = typeof team.points === 'number' ? team.points : 0
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''
            return `${medal} **${teamName}** — ${pts} pts`
        })

        // Contar rondas y partidos
        const roundsCount = division.rounds?.length || 0
        totalRounds += roundsCount
        let matchesCount = 0
        for (const round of division.rounds || []) {
            matchesCount += round.matches.length
        }
        totalMatches += matchesCount

        return {
            divisionName,
            divisionEmoji,
            divisionColor,
            top3,
            roundsCount,
            matchesCount
        }
    })

    // Construir embed
    const embed = new EmbedBuilder()
        .setColor('Blue')
        .setDescription(`## Temporada ${name}`)
        .addFields(
            { name: 'Índice', value: `\`${seasonIndex}\``, inline: true },
            { name: 'Estado', value: `\`${status === 'active' ? '📅 En curso' : '📅 Finalizada'}\``, inline: true },
            { name: 'Jornadas totales', value: `🖇️ \`${totalRounds}\``, inline: true },
            { name: 'Partidos totales', value: `🎯 \`${totalMatches}\``, inline: true },
            { name: 'Equipos totales', value: `👥 \`${totalTeams}\``, inline: true }
        )

    // Añadir ranking por división
    for (const div of divisionsRanking) {
        embed.addFields({
            name: `${div.divisionEmoji} ${div.divisionName} — Top 3`,
            value: div.top3.length ? div.top3.join('\n') : 'No hay equipos.',
            inline: false
        })
    }

    return embed
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
                { name: 'Índice', value: `👆 \`${seasonIndex}\``, inline: true },
                { name: 'Estado', value: `\`${status === 'active' ? '📅 En curso' : '📅 Finalizada'}\``, inline: true },
                { name: `${status === 'active' ? 'Ronda Actual' : 'Rondas'}`, value: `🖇️ \`${roundNumber}\``, inline: true },
                { name: 'Divisiones', value: `🧩 \`${divisions.length}\``, inline: true },
                { name: 'Equipos', value: `👥 \`${teamsLength}\``, inline: true },
                { name: 'Partidos', value: `🎯 \`${matchesLength}\``, inline: true }
            )
    )
}

module.exports = { getSeasonStartedEmbed, getSeasonEndedEmbed, getSeasonSummaryEmbed }