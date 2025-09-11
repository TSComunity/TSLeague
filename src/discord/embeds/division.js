const {
  ActionRowBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  MediaComponentBuilder,
  ThumbnailBuilder,
  SectionBuilder,
  SeparatorBuilder,
  MessageFlags,
  EmbedBuilder
} = require('discord.js');

const emojis = require('../../configs/emojis.json')

const getDivisionEndedEmbed = ({ division, promoted = [], relegated = [], stayed = [] }) => {
  const div = division.divisionId
  const container = new ContainerBuilder()
    .setAccentColor(parseInt(div.color.replace('#', ''), 16))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${div.emoji || emojis.division} División ${div.name || 'Sin nombre'} — ${division.teams.length}/${configs.division.maxTeams}`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder())


    const desc = ''
    promoted.forEach(t =>  {
      desc += `${emojis.ascent} ${t.name}`
    })
    stayed.forEach(t =>  {
      desc += `${emojis.team} ${t.name}`
    })
    relegated.forEach(t =>  {
      desc += `${emojis.ascent} ${t.name}`
    })

    if ([...promoted, ...relegated, ...stayed].length === 0) {
      desc = '*División sin equipos.*'
    }

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(desc)
    )

  return container
}

// Embed de partidos de nueva ronda y descansos, robusto ante datos nulos
const getDivisionRoundAddedEmbed = ({ division, season }) => {

  const rounds = Array.isArray(division.rounds) ? division.rounds : Object.values(division.rounds)
const round = rounds[rounds.length - 1]

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
      name: `${emojis.match} ${teamAName} ${emojis.vs} ${teamBName}`,
      value: `${emojis.channel} Canal: ${channel}\n${emojis.schedule} Horario: ${timestampText}`,
      inline: true
    })
  }

  // Equipos en descanso
  for (const restingTeamObj of resting) {
    const restingTeam = restingTeamObj.teamId
    const teamName = restingTeam?.name || 'Sin nombre'
    embed.addFields({
      name: `${emojis.rest} ${teamName}`,
      value: '> Descansa esta jornada',
      inline: true
    })
  }

  return embed
}

module.exports = { getDivisionEndedEmbed, getDivisionRoundAddedEmbed }