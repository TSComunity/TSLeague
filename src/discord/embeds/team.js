const { EmbedBuilder } = require('discord.js')
const config  = require('../../configs/league.js')
const { BRAWL_STARS_API_KEY } = require('../../configs/configs.js')

const getTeamInfoEmbed = ({ team, perms }) => {

    const rolePriority = { 'leader': 0, 'sub-leader': 1, 'member': 2 }
      const sortedMembers = [...team.members].sort((a, b) => {
        return rolePriority[a.role] - rolePriority[b.role]
      })

      const formattedList = sortedMembers.map(m => {
        const userId = m.userId.discordId || m.userId // por si acaso no está poblado
        const roleLabel = m.role === 'leader' ? '<:leader:1395916423695564881>' :
                          m.role === 'sub-leader' ? '<:subleader:1395916298025832519>' :
                          '<:member:1402254138632572999>'
        return `${roleLabel} <@${userId}>`
      }).join('\n')


    let formattedDivision = ''
    if (team.divisionId) {
        formattedDivision = `${team.divisionId.emoji || '🏆'} ${team.divisionId.name || 'División sin nombre'}`
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
                { name: 'División', value: `\`${formattedDivision}\``, inline: true },
                ...(perms ? [{ name: 'Código', value: `\`${team.code}\``, inline: true }] : [])
	    )
    )
}

const getAddMemberInfoEmbed = ({ teamCode }) => {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription(`
## Añadir miembros
Para que un miembro pueda unirse a tu equipo, debe utilizar el código del equipo, el cual es accesible solo para los lideres y sub-lideres del equipo y no debe ser compartido por canales publicos, si no cualquiera podria unirse a tu equipo.

La generación de un nuevo código invalidará automáticamente cualquier versión anterior, asegurando que la privacidad y la seguridad de su equipo se mantengan constantemente actualizadas y protegidas.

Código del equipo: \`${teamCode}\`.
            `)
            .setFooter({ text: 'Utilice el botón inferior para regenerar el código si fuera necesario.' })
    )
}

const getTeamsSummaryEmbed = ({ divisionsCount, teamsInDivisionsCount, teamsCount }) => {

    return (
        new EmbedBuilder()
            .setColor('Purple')
            .setDescription(`## Divisiones`)
            .addFields(
                { name: 'Divisiones', value: `🧩 \`${divisionsCount}\``, inline: true },
                { name: 'Equipos en divisiones', value: `👥 \`${teamsInDivisionsCount}\``, inline: true },
                { name: 'Equipos totales', value: `🎯 \`${teamsCount}\``, inline: true }
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
        .setDescription(`### ${name} — ${members.length}/${config.team.maxMembers}`)
        .addFields(
            { name: 'Copas Totales', value: `\`${totalTrophies}\`` },
            { name: 'Victorias Totales 3v3', value: `\`${totalWins3vs3}\`` }
        )
}

module.exports = { getTeamInfoEmbed, getAddMemberInfoEmbed, getTeamsSummaryEmbed, getTeamStatsEmbed }