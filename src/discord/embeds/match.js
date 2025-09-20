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
const emojis = require('../../configs/emojis.json')
const { getMatchChangeScheduleButton } = require('../buttons/match.js')
const modesData = require('../../configs/gameModes.json')

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
    reason
  } = match

  // --- Helpers ---
  function getModeData(modeId) {
    return modesData.find(m => m.id === modeId) || null
  }

  function getMapData(mapId) {
    for (const mode of modesData) {
      const map = mode.maps.find(m => m.id === mapId)
      if (map) return map
    }
    return null
  }

  // --- Imagen principal según estado ---
  let imageURL = null
  if (status === 'played' && resultsImageURL) imageURL = resultsImageURL
  if ((status === 'scheduled' || status === 'cancelled') && previewImageURL) imageURL = previewImageURL

  // --- Accent color por estado ---
  const statusColors = {
    scheduled: '#FFD700', // Amarillo
    cancelled: '#FF0000', // Rojo
    played: '#1E90FF'     // Azul
  }
  const accentColor = parseInt(statusColors[status].replace('#', ''), 16)

  // --- Info principal con resumen de sets ---
  let title = `## ${emojis.match} ${teamAId?.name || "Equipo A"} vs ${teamBId?.name || "Equipo B"}\n`
  let infoText = ''

  if (status === 'scheduled') {
    infoText += `${emojis.schedule} ${scheduledAt ? `<t:${new Date(scheduledAt).getTime() / 1000}:D> (<t:${new Date(scheduledAt).getTime() / 1000}:R>)` : "Por definir"}`
  } else if (status === 'played') {
    infoText += `${emojis.ended} ${scoreA} - ${scoreB}`
  } else if (status === 'cancelled') {
    infoText += `${emojis.canceled} Cancelado ${reason ? `\n> ${reason}` : ""}`
  }

  // Resumen de sets
  if (sets?.length > 0) {
    infoText += `\n### Sets\n`
    sets.forEach((set, i) => {
      const mode = getModeData(set.mode)
      const map = getMapData(set.map)
      const modeEmoji = mode?.emoji || "🎮"
      const mapName = map?.name || "Mapa desconocido"
      const winnerName = set.winner
        ? (set.winner.equals(teamAId._id) ? teamAId.name : teamBId.name)
        : "Sin gandor"
      infoText += `${modeEmoji} ${mapName}${match.status === 'played' ? `\n> ${emojis.winner} ${winnerName}` : ''}\n`
    })
  }

  // --- Construcción del contenedor ---
  const container = new ContainerBuilder().setAccentColor(accentColor)

  // Imagen principal
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

  // --- Galería de sets (solo imágenes) ---
  if (sets?.length > 0) {
    const setGallery = new MediaGalleryBuilder().setId(2)
    sets.forEach((set, i) => {
      const map = getMapData(set.map)
      if (map?.imageURL) {
        setGallery.addItems([
          new MediaGalleryItemBuilder()
            .setURL(map.imageURL)
            .setDescription(`Set ${i + 1} — ${map.name}`)
        ])
      }
    })
    container.addSeparatorComponents(new SeparatorBuilder())
    const collageBuffer = await generateMapCollage({ sets })

    const imageItem = new MediaGalleryItemBuilder()
      .setURL(collageBuffer, 'maps.png')
      .setDescription('Mapas de la partida')

    const gallery = new MediaGalleryBuilder()
      .setId(2)
      .addItems([imageItem])

    container.addMediaGalleryComponents([gallery])
  }

  // --- Botón opcional ---
  if (showButtons) {
    container.addSeparatorComponents(new SeparatorBuilder())
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(getMatchChangeScheduleButton({ matchIndex }))
    )
  }

  return container
}


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