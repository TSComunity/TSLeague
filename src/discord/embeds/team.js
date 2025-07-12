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
            .setColor(team.color)
            .setDescription('Mantenimiento')
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
            .setDescription('Mantenimiento')
    )
}

module.exports = { getTeamInfoEmbed, getRestingTeamEmbed, getAddMemberInfoEmbed }