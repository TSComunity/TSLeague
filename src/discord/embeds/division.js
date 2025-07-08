const { EmbedBuilder } = require('discord.js')

const getDivisionEndedEmbed = ({ division }) =>  {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    )
}

const { EmbedBuilder } = require('discord.js')

const getSeasonSummaryEmbed = (season) => {
  const activeDivisions = season.divisions.filter(d => d.status !== 'ended')
  const endedDivisions = season.divisions.length - activeDivisions.length

  return new EmbedBuilder()
    .setTitle(`📅 Temporada ${season.seasonIndex}`)
    .setDescription(`Estado de la temporada actual`)
    .addFields(
      { name: 'Divisiones activas', value: `${activeDivisions.length}`, inline: true },
      { name: 'Divisiones terminadas', value: `${endedDivisions}`, inline: true },
      { name: 'Rondas jugadas', value: `${Math.max(...season.divisions.map(d => d.rounds.length))}`, inline: true }
    )
    .setColor('Blue')
}

module.exports = { getDivisionEndedEmbed }