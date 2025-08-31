const { EmbedBuilder } = require('discord.js')
const config  = require('../../configs/league.js')
const emojis = require('../../configs/emojis.json')
const { BRAWL_STARS_API_KEY } = require('../../configs/configs.js')

const getTeamInfoEmbed = ({ team, perms }) => {

    const rolePriority = { 'leader': 0, 'sub-leader': 1, 'member': 2 }
      const sortedMembers = [...team.members].sort((a, b) => {
        return rolePriority[a.role] - rolePriority[b.role]
      })

      const formattedList = sortedMembers.map(m => {
        const userId = m.userId.discordId || m.userId // por si acaso no está poblado
        const roleLabel = m.role === 'leader' ? emojis.leader :
                          m.role === 'sub-leader' ? emojis.subLeader :
                          emojis.member
        return `${roleLabel} <@${userId}>`
      }).join('\n')


    let formattedDivision = ''
    if (team.divisionId) {
        formattedDivision = `${team.divisionId.emoji || emojis.division} ${team.divisionId.name || 'División sin nombre'}`
    } else {
        formattedDivision = 'En ninguna división'
    }

    return (
        new EmbedBuilder()
            .setColor(team.color || 'Blue')
            .setThumbnail(team.iconURL)
            .setDescription(`## ${team.name}`)
            .addFields(
                { name: `Miembros — ${team.members.length}/${config.team.maxMembers}`, value: formattedList, inline: true },
                { name: `División`, value: `${emojis.division} \`${formattedDivision}\``, inline: true },
                ...(perms ? [{ name: `Código`, value: `${emojis.code} \`${team.code}\``, inline: true }] : [])
	    )
    )
}

const getAddMemberInfoEmbed = ({ teamCode }) => {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription(`
    ## ${emojis.teamAddMember} Añadir miembros
    Los nuevos miembros solo podrán unirse a tu equipo utilizando el **código del equipo**, el cual es accesible únicamente para líderes y sub-líderes. Este código nunca debe compartirse en canales públicos, ya que permitiría la entrada de cualquier persona sin control. Siempre que se genere un nuevo código, el anterior quedará automáticamente invalidado, garantizando la seguridad y privacidad del equipo. El código actual de tu equipo es: \`${teamCode}\`. Compártelo únicamente con los jugadores que quieras invitar a tu equipo.

    Si tu equipo busca nuevos jugadores, también puedes usar el canal de <#${config.channels.freeAgents.id}>. Allí, cada usuario que busque equipo contará con un mensaje con información actualizada de sus estadísticas de Brawl Stars. Esto te permitirá revisar perfiles y contactar fácilmente con los jugadores que más se adapten a lo que tu equipo necesita.
            `)
            .setFooter({ text: 'Utiliza el botón inferior para regenerar el código si fuera necesario.' })
    )
}

const getTeamsSummaryEmbed = ({ divisionsCount, teamsInDivisionsCount, teamsCount }) => {

    return (
        new EmbedBuilder()
            .setColor('Purple')
            .setDescription(`## ${emojis.divisions} Divisiones`)
            .addFields(
                { name: `${emojis.division} Divisiones`, value: `\`${divisionsCount}\``, inline: true },
                { name: `${emojis.teamsInDivisions} Equipos en divisiones`, value: `\`${teamsInDivisionsCount}\``, inline: true },
                { name: `${emojis.team} Equipos totales`, value: `\`${teamsCount}\``, inline: true }
            )
    )
}

const getTeamStatsEmbed = async ({ team }) => {
    const { name, iconURL, color, members } = team

    let totalTrophies = 0
    let totalWins3vs3 = 0

    for (const member of members) {
        const brawlId = member.userId.brawlId
        const encodedId = encodeURIComponent(brawlId)

        try {
            const res = await fetch(`https://api.brawlstars.com/v1/players/${encodedId}`, {
                headers: {
                    Authorization: `Bearer ${BRAWL_STARS_API_KEY}`,
                },
            })

            if (!res.ok) {
                throw new Error(`No se pudo obtener datos para ${brawlId}`)
            }

            const data = await res.json()
            totalTrophies += data.trophies || 0
            totalWins3vs3 += data['3vs3Victories'] || 0
        } catch (error) {
            console.error(`Error con ${brawlId}:`, error)
        }
    }
    
    return new EmbedBuilder()
        .setColor(color)
        .setThumbnail(iconURL)
        .setDescription(`### ${emojis.team} ${name} — ${members.length}/${config.team.maxMembers}`)
        .addFields(
            { name: `Copas Totales`, value: `${emojis.trophies} \`${totalTrophies}\`` },
            { name: `Victorias Totales 3v3`, value: `${emojis.wins3vs3} \`${totalWins3vs3}\`` }
        )
}

const getTeamChannelEmbed = ({ team }) => {

    return new EmbedBuilder()
        .setDescription(
        `### ${emojis.team} ${team.name}\n\n` +
        `Este canal es exclusivo para los miembros del equipo.\n` +
        `Aquí se publicarán todas las actualizaciones, resultados y avisos importantes relacionados con el equipo.\n` +
        `Si necesitas asistencia o tienes alguna duda, puedes contactar al staff directamente en este canal.`
        )
        .setColor(team.color || 'Blue')
        .setThumbnail(team.iconURL || '')
        .setFooter({ 
        text: `Por favor, revisa el canal con regularidad para mantenerte al día con la información del equipo.` 
        })
}


module.exports = { getTeamInfoEmbed, getAddMemberInfoEmbed, getTeamsSummaryEmbed, getTeamStatsEmbed, getTeamChannelEmbed }