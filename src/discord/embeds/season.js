const { EmbedBuilder } = require('discord.js')
const emojis = require('../../configs/emojis.json')

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

    // Construir embed
    const embed = new EmbedBuilder()
        .setColor('Blue')
        .setDescription(`## ${emojis.season} Temporada ${name} Finalizada`)
        .addFields(
            { name: `Estado`, value: `\`${status === 'active' ? `${emojis.active} \`En curso\`` : `${emojis.ended} \`Finalizada\``}\``, inline: true },
            { name: `Jornadas`, value: `${emojis.round} \`${totalRounds}\``, inline: true },
            { name: `Divisiones`, value: `${emojis.division} \`${divisions.length}\``, inline: true },
            { name: `Equipos`, value: `${emojis.team} \`${totalTeams}\``, inline: true },
            { name: `Partidos`, value: `${emojis.match} \`${totalMatches}\``, inline: true }
        )

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
            .setDescription(`## ${emojis.season} Temporada ${name} — Edición ${seasonIndex}`)
            .addFields(
            { name: `Estado`, value: `\`${status === 'active' ? `${emojis.active} \`En curso\`` : `${emojis.ended} \`Finalizada\``}\``, inline: true },
                { name: `${status === 'active' ? `${emojis.round} Ronda Actual` : `${emojis.rounds} Rondas Totales`}`, value: `\`${roundNumber}\``, inline: true },
                { name: `Divisiones`, value: `${emojis.division} \`${divisions.length}\``, inline: true },
                { name: `Equipos`, value: `${emojis.team} \`${teamsLength}\``, inline: true },
                { name: `Partidos`, value: `${emojis.match} \`${matchesLength}\``, inline: true }
            )
    )
}

module.exports = { getSeasonStartedEmbed, getSeasonEndedEmbed, getSeasonSummaryEmbed }