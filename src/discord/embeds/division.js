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

const configs = require('../../configs/league.js')
const emojis = require('../../configs/emojis.json')

const getDivisionEndedEmbed = ({ division, promoted = [], relegated = [], stayed = [], expelled = [], finishedBefore = false }) => {
  const div = division.divisionId
  const container = new ContainerBuilder()
    .setAccentColor(parseInt(div.color?.replace('#', ''), 16) || 3447003)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${div.emoji || emojis.division} División ${div.name || 'Sin nombre'} — Finalizada`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder())

    if (finishedBefore) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `La división ha terminado antes del fin de la temporada, una vez terminada la temporada se enviaran los resultados finales de la división.`
        )
      )
      return container
    }

    let desc = ''
    promoted.forEach(t => {
      desc += `${emojis.ascent} ${t.name}\n`
    })
    stayed.forEach(t =>  {
      desc += `${emojis.team} ${t.name}\n`
    })
    relegated.forEach(t =>  {
      desc += `${emojis.decline} ${t.name}\n`
    })
    expelled.forEach(t =>  {
      desc += `${emojis.expel} ${t.name}\n`
    })

    if ([...promoted, ...relegated, ...stayed, ...expelled].length === 0) {
      desc = '*División sin equipos.*'
    }

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(desc)
    )

  return container
}

// Embed de partidos de nueva ronda y descansos, robusto ante datos nulos
const getDivisionRoundAddedEmbed = ({ division }) => {

  const rounds = Array.isArray(division.rounds) ? division.rounds : Object.values(division.rounds)
  const round = rounds[rounds.length - 1]

  if (!round) throw new Error('No se ha encontrado la ronda.')

  const divisionDoc = division.divisionId
  const divisionName = divisionDoc?.name || 'División sin nombre'

  const matches = round?.matches ?? []
  const resting = round?.resting ?? []

  const container = new ContainerBuilder()
    .setAccentColor(parseInt(divisionDoc?.color?.replace('#', '') || '0000FF', 16))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${divisionDoc?.emoji || emojis.division} División ${divisionName} — Nuevos Partidos`
      )
    )

  // Partidos nuevos
  for (const matchObj of matches) {
    const match = matchObj.matchId
    const teamAName = match.teamAId?.name || 'Sin nombre'
    const teamBName = match.teamBId?.name || 'Sin nombre'
    const channel = match.channelId ? `<#${match.channelId}>` : 'Sin canal'

    container.addSeparatorComponents(new SeparatorBuilder())
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${emojis.match} ${teamAName} vs ${teamBName}\n${emojis.channel} ${channel}`
      )
    )
  }

  // Equipos en descanso
  for (const restingTeamObj of resting) {
    const restingTeam = restingTeamObj.teamId
    const teamName = restingTeam?.name || 'Sin nombre'

    container.addSeparatorComponents(new SeparatorBuilder())
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${emojis.rest} ${teamName}`
      )
    )
  }

  return container
}

module.exports = { getDivisionEndedEmbed, getDivisionRoundAddedEmbed }