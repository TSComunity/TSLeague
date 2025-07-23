const { EmbedBuilder } = require('discord.js')

// Embed de división terminada, mostrando ranking final y nota
const getDivisionEndedEmbed = ({ division }) =>  {
  const { divisionId: divisionDoc, teams = [], rounds = [] } = division
  // Ordenar equipos por puntos (descendente)
  const sortedTeams = [...teams].sort((a, b) => (b.points || 0) - (a.points || 0))

  let rankingMsg = sortedTeams.length
    ? sortedTeams.map((team, idx) => {
        const name = team.teamId?.name || 'Sin nombre'
        const pts = typeof team.points === 'number' ? team.points : 0
        return `\`${idx + 1}.\` **${name}** — ${pts} pts`
      }).join('\n')
    : 'División sin equipos.'

  return new EmbedBuilder()
    .setColor(divisionDoc?.color || 'Blue')
    .setDescription([
      '### Division terminada',
      '',
      rankingMsg
    ].join('\n'))
    	.setFooter({ text:'Cuando todas las divisiones hayan terminado se publicará el resumen global de la temporada.' })

}

// Embed de partidos de nueva ronda y descansos, robusto ante datos nulos
const getDivisionRoundAddedEmbed = ({ division, season }) => {

  console.log('rounds', division.rounds)
  const rounds = Array.isArray(division.rounds) ? division.rounds : Object.values(division.rounds)
const round = rounds[rounds.length - 1]
console.log('round', round)
  if (!round) throw new Error('No se ha encontrado la ronda.')

  const divisionDoc = division.divisionId
  const divisionName = divisionDoc?.name || 'División sin nombre'

  const matches = round?.matches ?? []
  const resting = round?.resting ?? []

  const embed = new EmbedBuilder()
    .setColor(divisionDoc?.color || 'Blue')
    .setDescription(`### Nuevos Partidos - Division ${divisionName}`)

  // Partidos nuevos
  for (const matchObj of matches) {
    const match = matchObj.matchId
    const teamAName = match.teamAId?.name || 'Sin nombre'
    const teamBName = match.teamBId?.name || 'Sin nombre'
    const channel = match.channelId ? `<#${match.channelId}>` : 'Sin canal'
    const timestampText =
      match.scheduledAt instanceof Date
        ? `<t:${Math.floor(match.scheduledAt.getTime() / 1000)}:R>`
        : 'Sin fecha'

    embed.addFields({
      name: `🆚 ${teamAName} vs ${teamBName}`,
      value: `💬 Canal: ${channel}\n🕛 Horario: ${timestampText}`,
      inline: true
    })
  }

  // Equipos en descanso
  for (const restingTeamObj of resting) {
    const restingTeam = restingTeamObj.teamId
    const teamName = restingTeam?.name || 'Sin nombre'
    embed.addFields({
      name: `💤 ${teamName}`,
      value: '💤 Descansa esta jornada',
      inline: true
    })
  }

  return embed
}

module.exports = { getDivisionEndedEmbed, getDivisionRoundAddedEmbed }