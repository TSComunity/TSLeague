const {
  EmbedBuilder,
  ActionRowBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder
} = require('discord.js')
const { generateMapCollage } = require('../../services/sets.js')
const { getMatchChangeScheduleButton } = require('../buttons/match.js')
const emojis = require('../../configs/emojis.json')
const modesData = require('../../configs/gameModes.json')

/**
 * Genera el embed/container con info completa de un match
 * @param {Object} match - Documento de match de Mongo
 * @param {Boolean} showButtons - Mostrar botones de interacción
 * @returns {ContainerBuilder}
 */
const getMatchInfoEmbed = async ({ match, showButtons = false }) => {
  const {
    matchIndex,
    teamAId,
    teamBId,
    scoreA,
    scoreB,
    status,
    scheduledAt,
    sets,
    previewImageURL,
    resultsImageURL,
    reason,
    starPlayerId
  } = match

  const getModeData = (modeId) => modesData.find(m => m.id === modeId) || null
  const getMapData = (mapId) => {
    for (const mode of modesData) {
      const map = mode.maps.find(m => m.id === mapId)
      if (map) return map
    }
    return null
  }

  // Imagen principal según estado
  let imageURL = null
  if ((status === 'played') && resultsImageURL) imageURL = resultsImageURL
  if ((status === 'scheduled' || status === 'cancelled' || status === 'onGoing') && previewImageURL) imageURL = previewImageURL

  // Color según estado
  const statusColors = {
    scheduled: '#FFD700',
    cancelled: '#FF0000',
    played: '#1E90FF',
    onGoing: '#32CD32'
  }
  const accentColor = parseInt(statusColors[status]?.replace('#','') || '1E90FF', 16)

  // Título y texto principal
  const title = `## ${emojis.match} ${teamAId?.name || "Equipo A"} vs ${teamBId?.name || "Equipo B"}\n`
  let infoText = ''

  if (status === 'scheduled') {
    infoText += `${emojis.schedule} ${scheduledAt ? `<t:${Math.floor(new Date(scheduledAt).getTime()/1000)}:D>` : "Por definir"}`
  } else if (status === 'onGoing') {
    infoText += `${emojis.onGoing} Partida en curso\n`
  } else if (status === 'played') {
    const winnerFirst = scoreA >= scoreB
      ? [teamAId.name, scoreA, scoreB,]
      : [teamBId.name, scoreB, scoreA,]

    infoText += `${emojis.ended} **${winnerFirst[0]}** ${winnerFirst[1]} - ${winnerFirst[2]}\n`
    if (starPlayerId) infoText += `${emojis.starPlayer} <@${starPlayerId.discordId}>`
  } else if (status === 'cancelled') {
    infoText += `${emojis.canceled} Cancelado${reason ? `\n> ${reason}` : ''}`
  }

  // Resumen de sets
  if (sets?.length > 0) {
    infoText += `\n### Sets\n`
    sets.forEach((set) => {
      const mode = getModeData(set.mode)
      const map = getMapData(set.map)
      const modeEmoji = mode?.emoji || "🎮"
      const mapName = map?.name || "Mapa desconocido"

      let winnerText = "No definido"
      if (set.winner) {
        if (set.winner.equals(teamAId._id)) winnerText = teamAId.name
        else if (set.winner.equals(teamBId._id)) winnerText = teamBId.name
      }

      // Solo mostrar ganador si ha terminado
      if (status === 'played') {
        infoText += `${modeEmoji} ${mapName} — **${winnerText}**\n`
      } else if (status === 'onGoing' || status === 'cancelled') {
        // Para ongoing mostrar solo los sets que ya tienen ganador o modo/mapa definido
        infoText += `${modeEmoji} ${mapName} — ${set.winner ? `**${winnerText}**` : "No definido"}\n`
      } else {
        infoText += `${modeEmoji} ${mapName} — No definido\n`
      }
    })
  }

  // Construcción del container
  const container = new ContainerBuilder().setAccentColor(accentColor)

  if (imageURL) {
    const image = new MediaGalleryItemBuilder()
      .setURL(imageURL)
      .setDescription(`${teamAId?.name || "Equipo A"} vs ${teamBId?.name || "Equipo B"}`)

    const gallery = new MediaGalleryBuilder()
      .setId(1)
      .addItems([image])

    container.addMediaGalleryComponents([gallery])
    container.addSeparatorComponents(new SeparatorBuilder())
  }

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(title))
  container.addSeparatorComponents(new SeparatorBuilder())
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(infoText))

  // Galería de sets
  if (sets?.length > 0) {
    const collageBuffer = await generateMapCollage({ sets })
    const gallery = new MediaGalleryBuilder()
      .setId(2)
      .addItems([
        new MediaGalleryItemBuilder()
          .setURL(collageBuffer, 'maps.png')
          .setDescription('Mapas de la partida')
      ])
    container.addSeparatorComponents(new SeparatorBuilder())
    container.addMediaGalleryComponents([gallery])
  }

  // Botón opcional
  if (showButtons) {
    container.addSeparatorComponents(new SeparatorBuilder())
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(getMatchChangeScheduleButton({ matchIndex }))
    )
  }

  return container
}

/**
 * Embed para propuesta de cambio de horario
 */
const getMatchProposedScheduleEmbed = ({ interaction, oldTimestampUnix, timestampUnix, status = 'pending' }) => {
  let color = 'Yellow'
  let description = `### <@${interaction.user.id}> ha propuesto cambiar la hora del partido.`

  if (status === 'accepted') {
    color = 'Green'
    description = `### La propuesta ha sido aceptada por <@${interaction.user.id}>.`
  } else if (status === 'rejected') {
    color = 'Red'
    description = `### La propuesta ha sido rechazada por <@${interaction.user.id}>.`
  }

  return new EmbedBuilder()
    .setColor(color)
    .setDescription(description)
    .addFields(
      { name: `${emojis.schedule} Hora Actual`, value: oldTimestampUnix ? `<t:${oldTimestampUnix}:F>` : "*No definida*", inline: true },
      { name: `${emojis.schedule} Hora Propuesta`, value: `<t:${timestampUnix}:F>`, inline: true }
    )
}

module.exports = { getMatchInfoEmbed, getMatchProposedScheduleEmbed }