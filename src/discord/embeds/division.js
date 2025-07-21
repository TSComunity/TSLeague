const { EmbedBuilder } = require('discord.js')

const getDivisionEndedEmbed = ({ division }) =>  {
  const { divisionId: divisionDoc, status, teams, rounds } = division
    return (
        new EmbedBuilder()
            .setColor(divisionDoc.color)
            .setDescription('Division terminada')
    )
}

const getDivisionRoundAddedEmbed = ({ division, season }) => {
  const { divisionDoc, newMatchesDocs, newRestingTeamsDocs } = division

  const divisionName = divisionDoc.name || 'División sin nombre'

  const embed = new EmbedBuilder()
    .setColor('Blue')
    .setDescription(`### Nuevos Partidos - Division ${divisionName}`)

  for (const match of newMatchesDocs) {
    const teamAName = match.teamAId.name || 'Sin nombre'
    const teamBName = match.teamBId.name || 'Sin nombre'
    const channel = match.channelId ? `<#${match.channelId}>` : 'Sin canal'
    const timestampText = match.scheduledAt instanceof Date
      ? `<t:${Math.floor(match.scheduledAt.getTime() / 1000)}:R>`
      : 'Sin fecha'



    embed.addFields(
      { name: `🆚 ${teamAName} vs ${teamBName}`, value: `💬 Canal: ${channel}\n🕛 Horario: ${timestampText}`, inline: true}
    )
  }

  for (const restingTeam of newRestingTeamsDocs) {
    const teamName = restingTeam.name || 'Sin nombre'

    embed.addFields(
      { name: `💤 ${teamName}`, value: '💤 Descansa esta jornada', inline: true}
    )
  }

  return embed
}

module.exports = { getDivisionEndedEmbed, getDivisionRoundAddedEmbed }