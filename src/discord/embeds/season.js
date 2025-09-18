const { EmbedBuilder } = require('discord.js')
const emojis = require('../../configs/emojis.json')
const { getCurrentRoundNumber } = require('../../utils/round.js')

const getSeasonStartedEmbed = ({ season }) => {
    const { name, seasonIndex, divisions, startDate } = season

    // Contar total de equipos
    let totalTeams = 0
    for (const division of divisions) {
        totalTeams += division.teams.length
    }

    // Construir descripción tipo anuncio formal
    const description = 
`## ${emojis.season} Temporada ${name} — Edición ${seasonIndex} Iniciada\n\n` +
`La nueva temporada ha comenzado oficialmente. A continuación, se presentan las divisiones que participarán en esta edición:\n` +
`${divisions.map(d => `- ${d.divisionId}`).join('\n')}\n\n` +
`En total, se han registrado **${totalTeams} equipos**, todos listos para competir y demostrar su desempeño.\n` +
`La temporada dará inicio el **${new Date(startDate).toLocaleDateString()}**, marcando el comienzo de una etapa llena de emoción y competitividad.\n\n` +
`Deseamos éxito a todos los equipos participantes. ${emojis.active}`

    return new EmbedBuilder()
        .setColor('Green')
        .setDescription(description)
}


const getSeasonEndedEmbed = ({ season }) => {
    const { name, seasonIndex, divisions, startDate, endDate } = season

    let totalRounds = 0
    let totalMatches = 0
    let totalTeams = 0

    for (const division of divisions) {
        totalTeams += division.teams.length
        totalRounds += division.rounds.length
        for (const round of division.rounds) {
            totalMatches += round.matches.length
        }
    }

    const durationDays = startDate && endDate
        ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        : null

    return new EmbedBuilder()
        .setColor('Blue')
        .setDescription(`## ${emojis.season} Temporada ${name} — Edición ${seasonIndex} Comenzada`)
        .addFields(
            { name: `Rondas`, value: `${emojis.rounds} \`${totalRounds}\``, inline: true },
            { name: `Divisiones`, value: `${emojis.division} \`${divisions.length}\``, inline: true },
            { name: `Equipos`, value: `${emojis.team} \`${totalTeams}\``, inline: true },
            { name: `Partidos`, value: `${emojis.match} \`${totalMatches}\``, inline: true },
            { name: `Inicio`, value: `\`${new Date(startDate).toLocaleDateString()}\``, inline: true },
            { name: `Duración`, value: durationDays ? `\`${durationDays} días\`` : '`-`', inline: true }
        )
}

const getSeasonSummaryEmbed = ({ season }) => {
    const { seasonIndex, name, status, divisions, startDate } = season

    const roundNumber = getCurrentRoundNumber({ season })
    let totalTeams = 0
    let totalMatches = 0
    let totalRounds = 0

    for (const division of divisions) {
        totalTeams += division.teams.length
        totalRounds += division.rounds.length
        for (const round of division.rounds) {
            totalMatches += round.matches.length
        }
    }

    // Si está activa, usamos fecha actual para duración
    const durationDays = startDate
        ? Math.ceil(((status === 'active' ? Date.now() : season.endDate) - startDate) / (1000 * 60 * 60 * 24))
        : null

    return new EmbedBuilder()
        .setColor('Purple')
        .setDescription(`## ${emojis.season} Temporada ${name} — Edición ${seasonIndex}`)
        .addFields(
            { 
                name: `Estado`, 
                value: status === 'active' 
                    ? `${emojis.active} \`En curso\`` 
                    : `${emojis.ended} \`Finalizada\``, 
                inline: true 
            },
            { 
                name: status === 'active' ? `${emojis.round} Ronda Actual` : `${emojis.rounds} Rondas Totales`, 
                value: `\`${roundNumber}\``, 
                inline: true 
            },
            { name: `Divisiones`, value: `${emojis.division} \`${divisions.length}\``, inline: true },
            { name: `Equipos`, value: `${emojis.team} \`${totalTeams}\``, inline: true },
            { name: `Partidos`, value: `${emojis.match} \`${totalMatches}\``, inline: true },
            { name: `Duración`, value: durationDays ? `\`${durationDays} días\`` : '`-`', inline: true }
        )
}

module.exports = { getSeasonStartedEmbed, getSeasonEndedEmbed, getSeasonSummaryEmbed }