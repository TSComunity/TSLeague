const {
  ContainerBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SectionBuilder,
  SeparatorBuilder,
  MessageFlags
} = require('discord.js')

const config = require('../../configs/league.js')

const { getLastSeason } = require('../../utils/season.js')
const { getSeasonSummaryEmbed } = require('../embeds/season.js')

const maxTeams = config.division.maxTeams

function chunkArray(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

const updateRankingsEmbed = async ({ client }) => {
  const isV2 = (msg) =>
    (msg.flags & MessageFlags.IsComponentsV2) === MessageFlags.IsComponentsV2

  const channel = await client.channels.fetch(config.channels.rankings.id)
  if (!channel || !channel.isTextBased())
    throw new Error('Canal no encontrado o no es de texto.')

  const season = await getLastSeason()
  const { divisions } = season

  const fetchedMessages = await channel.messages.fetch({ limit: 100 })
  const sortedMessages = Array.from(fetchedMessages.values()).sort(
    (a, b) => a.createdTimestamp - b.createdTimestamp
  )
  const botMessages = sortedMessages.filter((msg) => msg.author.id === client.user.id)

  const summaryMsg = botMessages.find((msg) => !isV2(msg))
  const divisionMsgs = botMessages.filter((msg) => isV2(msg))

  // build containers para todas las divisiones
  const containersByDivision = []
  for (const division of divisions) {
    const teams = division.teams
      .sort((a, b) => b.points - a.points)
      .map((team, index) => ({
        ...team.teamId,
        points: team.points,
        rank: index + 1
      }))
    const containers = buildDivisionContainers({ division: division.divisionId, teams })
    containersByDivision.push(containers)
  }

  const flatContainers = containersByDivision.reduce((acc, arr) => acc.concat(arr), [])

  // actualizar o crear summary
  if (summaryMsg) {
    try {
      await summaryMsg.edit({ embeds: [getSeasonSummaryEmbed({ season })] })
    } catch (err) {}
  } else {
    await channel.send({ embeds: [getSeasonSummaryEmbed({ season })] })
  }

  // editar mensajes existentes en orden y solo crear/eliminar lo necesario
  const targetCount = flatContainers.length
  const minCount = Math.min(divisionMsgs.length, targetCount)
  for (let i = 0; i < minCount; i++) {
    const msg = divisionMsgs[i]
    const container = flatContainers[i]
    try {
      await msg.edit({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] }
      })
    } catch (err) {
      try {
        await msg.delete().catch(() => {})
      } catch (e) {}
      await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] }
      })
    }
  }

  if (targetCount > divisionMsgs.length) {
    for (let i = divisionMsgs.length; i < targetCount; i++) {
      const container = flatContainers[i]
      await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] }
      })
    }
  }

  if (divisionMsgs.length > targetCount) {
    for (let i = targetCount; i < divisionMsgs.length; i++) {
      await divisionMsgs[i].delete().catch(() => {})
    }
  }
}

function buildDivisionContainers({ division, teams, chunkSize = 10 }) {
  const teamChunks = chunkArray(teams, chunkSize)
  const containers = []
  const safeColor = division && division.color ? division.color.replace('#', '') : '2f3136'
  const accent = parseInt(safeColor, 16)

  if (teams.length === 0) {
    const container = new ContainerBuilder()
      .setAccentColor(accent)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${division.emoji || '🏆'} División ${division.name || 'Sin nombre'} — 0/${maxTeams}`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('División sin equipos.'))
    containers.push(container)
    return containers
  }

  for (let chunkIndex = 0; chunkIndex < teamChunks.length; chunkIndex++) {
    const teamGroup = teamChunks[chunkIndex]
    const container = new ContainerBuilder().setAccentColor(accent)

    if (chunkIndex === 0) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${division.emoji || '🏆'} División ${division.name || 'Sin nombre'} — ${teams.length}/${maxTeams}`
        )
      )
    }

    for (let j = 0; j < teamGroup.length; j++) {
      const team = teamGroup[j]
      const { points, rank } = team
      const { name, iconURL } = team._doc

      const thumbnailComponent = new ThumbnailBuilder({ media: { url: iconURL } })

      const sectionComponent = new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${rank}. ${name}\n🏓 Puntos: ${points}`))
        .setThumbnailAccessory(thumbnailComponent)

      if (!(chunkIndex > 0 && j === 0)) {
        container.addSeparatorComponents(new SeparatorBuilder())
      }

      container.addSectionComponents(sectionComponent)
    }

    containers.push(container)
  }

  return containers
}

module.exports = { updateRankingsEmbed }