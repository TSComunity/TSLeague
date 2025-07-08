const { EmbedBuilder } = require('discord.js')

const getRoundAddedEmbed = ({ divisionsWithNewRounds, seasonIndex, nextRoundIndex }) => {
  const embed = new EmbedBuilder()
    .setColor('Blue')
    .setTitle(`🌀 Ronda ${nextRoundIndex} añadida`)
    .setDescription(`Se ha añadido la ronda ${nextRoundIndex} a la temporada ${seasonIndex}.\n\n` +
                    'Aquí tienes los detalles por división:')

  for (const { divisionDoc, newMatchesDocs, newRestingTeamsDocs } of divisionsWithNewRounds) {
    const divisionName = divisionDoc.name || 'División sin nombre'
    const restingNames = newRestingTeamsDocs.map(t => t.name).join(', ') || 'Ninguno'
    const matchCount = newMatchesDocs.length

    embed.addFields({
      name: `🏆 ${divisionName}`,
      value: `📅 Partidos: ${matchCount}\n🛋️ Descansan: ${restingNames}`,
    })
  }

  return embed
}

module.exports = { getRoundAddedEmbed }

// verificar esto, porrito, q le pase toda la season o q ostise