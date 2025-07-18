const { EmbedBuilder } = require('discord.js')

const config = require('../../configs/league.js')

const getDivisionEndedEmbed = ({ division }) =>  {
    return (
        new EmbedBuilder()
            .setColor(division.color)
            .setDescription('Mantenimiento')
    )
}

const getDivisionRankingEmbed = ({ division }) => {
  const divisionName = division.divisionId?.name || 'Sin nombre'
  const maxTeams = config.division.maxTeams

  const sortedTeams = division.teams
    .slice()
    .sort((a, b) => b.points - a.points)

  const teamFields = sortedTeams.map((teamObj, index) => {
    const name = teamObj.teamId?.name || 'Sin Nombre'
    const pts = teamObj.points ?? 0
    const medal = ['🥇', '🥈', '🥉'][index] || '💩'

    return {
      name: `${medal} ${name}`,
      value: [
        `🏓 \`#${index + 1}\``,
        `🌰 \`${pts}\``
        // aqui se pueden poner mas datos como racha partidos jugador y tal
      ].join('\n'),
      inline: true
    }
  })

  return (
    new EmbedBuilder()
      .setColor(division.color)
      .setDescription(`### División ${divisionName} — ${sortedTeams.length}/${maxTeams}`)
      .addFields(...teamFields)
  )
}

module.exports = { getDivisionEndedEmbed, getDivisionRankingEmbed }