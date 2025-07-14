const { EmbedBuilder } = require('discord.js')

const getTeamInfoEmbed = ({ team, perms }) => {

    const rolePriority = { 'leader': 0, 'sub-leader': 1, 'member': 2 }
      const sortedMembers = [...team.members].sort((a, b) => {
        return rolePriority[a.role] - rolePriority[b.role]
      })

      const formattedList = sortedMembers.map(m => {
        const userId = m.userId.discordId || m.userId // por si acaso no está poblado
        const roleLabel = m.role === 'leader' ? '👑 Líder' :
                          m.role === 'sub-leader' ? '🛡 Sub-líder' :
                          '👤 Miembro'
        return `${roleLabel} — <@${userId}>`
      }).join('\n')


    return (
        new EmbedBuilder()
            .setColor(team.color || 'Blue')
            .setThumbnail(team.iconURL)
            .setDescription(`## ${team.name}`)
            .addFields(
                { name: 'Miembros', value: formattedList, inline: true },
                { name: 'Division', value: `${team.divisionId?.name ? `\`${team.divisionId.name}\`` : 'En ninguna division'}`, inline: true },
                ...(perms ? [{ name: 'Código', value: `\`${team.code}\``, inline: true }] : [])
	    )
    )
}

const getRestingTeamEmbed = ({ team }) => {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    )
}

const getAddMemberInfoEmbed = ({ teamCode }) => {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription(`

Para que un miembro pueda unirse a tu equipo, debe utilizar el código del equipo, el cual es accesible solo para los lideres y sub-lideres del equipo y no debe ser compartido por canales publicos, si no cualquiera podria unirse a tu equipo.

La generación de un nuevo código invalidará automáticamente cualquier versión anterior, asegurando que la privacidad y la seguridad de su equipo se mantengan constantemente actualizadas y protegidas.

Código del equipo: \`${teamCode}\`.
            `)
            .setFooter({ text: 'Utilice el botón inferior para regenerar el código si fuera necesario.' })
    )
}

module.exports = { getTeamInfoEmbed, getRestingTeamEmbed, getAddMemberInfoEmbed }