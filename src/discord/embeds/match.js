const {
  ActionRowBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder
} = require('discord.js')

const { getMatchChangeScheduleButton } = require('../buttons/match.js')
const modesData = require('../../configs/gameModes.json')

const getMapImageURL = (modeId, mapId) => {
  const mode = modesData.find(m => m.id === modeId);
  if (!mode) return '';
  const map = mode.maps.find(mp => mp.id === mapId);
  return map ? map.imageURL : '';
}

function getModeOrMapName(id, type) {
  if (!id) return 'N/A'

  if (type === 'mode') {
    const mode = modesData.find(m => m.id === id)
    return mode ? mode.name : 'Desconocido'
  } else if (type === 'map') {
    for (const mode of modesData) {
      const map = mode.maps.find(m => m.id === id)
      if (map) return map.name
    }
    return 'Desconocido'
  }

  return 'N/A'
}

const getMatchInfoEmbed = ({ match, showButtons = false }) => {
  const {
    teamAId,
    teamBId,
    matchIndex,
    scoreA,
    scoreB,
    scheduledAt,
    status,
    sets,
    previewImageURL,
    resultsImageURL,
    reason
  } = match

  const getImageData = () => {
    if (status === 'played' && resultsImageURL) {
      return { url: resultsImageURL, description: `Resultados: ${teamAId.name} ${scoreA} - ${scoreB} ${teamBId.name}` }
    } else if ((status === 'scheduled' || status === 'cancelled') && previewImageURL) {
      return { url: previewImageURL, description: `${status === 'cancelled' ? 'Partido cancelado' : 'Próximo partido'}: ${teamAId.name} vs ${teamBId.name}` }
    }
    return null
  }

  const getStatusInfo = () => {
    switch (status) {
      case 'scheduled': return { text: '📅 Programado', color: 0xFFFF00 }
      case 'played': return { text: '✅ Terminado', color: 0x57F287 }
      case 'cancelled': return { text: '❌ Cancelado', color: 0xED4245 }
      default: return { text: '❓ Desconocido', color: 0x3498DB }
    }
  }

  const time = Math.floor(scheduledAt.getTime() / 1000)

  // --- Datos principales en líneas separadas ---
  const pad = 18 // Ajusta para alineación
  const teamLine = `${teamAId.name.padEnd(pad)} vs ${teamBId.name}`
  const statusLine = `Estado: ${getStatusInfo().text}`
  const scheduleLine = `Horario: <t:${time}:F>`
  const scoreLine = status === 'played' ? `Resultado: ${scoreA.toString().padEnd(3)} - ${scoreB}` : null
  const winnerLine = status === 'played' && scoreA !== scoreB ? `🏆 Ganador: ${scoreA > scoreB ? teamAId.name : teamBId.name}` : (status === 'played' ? '🤝 Empate' : null)
  const reasonLine = status === 'cancelled' && reason ? `Razón: ${reason}` : null

  const mainContent = [teamLine, statusLine, scheduleLine, scoreLine, winnerLine, reasonLine].filter(Boolean).join('\n')

  const textDisplay = new TextDisplayBuilder().setContent(mainContent)

  // --- Imagen principal ---
  const imageData = getImageData()
  let mediaGallery = null
  if (imageData) {
    const image = new MediaGalleryItemBuilder()
      .setURL(imageData.url)
      .setDescription(imageData.description || 'imagen principal')
    mediaGallery = new MediaGalleryBuilder().setId(1).addItems([image])
  }

  // --- Sets con mini-imágenes ---
  let setsGallery = null
  if (sets && sets.length > 0) {
    const items = sets.map((set, idx) => {
      const modeName = getModeOrMapName(set.mode, 'mode')
      const mapName = getModeOrMapName(set.map, 'map')
      const winnerName = set.winner
        ? set.winner.toString() === teamAId._id.toString() ? teamAId.name : teamBId.name
        : null

      let description = `Set ${idx + 1}: ${modeName} en ${mapName}`
      if (winnerName) description += ` → 🏆 ${winnerName}`

      return new MediaGalleryItemBuilder()
        .setURL(getMapImageURL(set.mode, set.map))
        .setDescription(description)
    })

    setsGallery = new MediaGalleryBuilder().setId(2).addItems(items)
  }

  // --- Botones ---
  let buttonRow = null
  if (showButtons) {
    const buttons = []
    if (status === 'scheduled') buttons.push(getMatchChangeScheduleButton({ matchIndex }))
    if (buttons.length) buttonRow = new ActionRowBuilder().addComponents(buttons)
  }

  // --- Construir contenedor ---
  const container = new ContainerBuilder()
    .addTextDisplayComponents(textDisplay)
    .setAccentColor(getStatusInfo().color)

  if (mediaGallery) container.addMediaGalleryComponents([mediaGallery])
  if (setsGallery) container.addMediaGalleryComponents([setsGallery])
  if (buttonRow) {
    // Separador antes de los botones
    const separator = new SeparatorBuilder()
    container.addSeparatorComponents(separator)
    container.addActionRowComponents(buttonRow)
  }

  return container
}

const getMatchProposedScheduleEmbed = ({ interaction, oldTimestampUnix, timestampUnix}) => {
  return new EmbedBuilder()
    .setColor('Yellow')
    .setDescription(`### <@${interaction.user.id}> ha propuesto cambiar la hora del partido.`)
    .addFields(
      { name: 'Hora Actual', value: `<t:${oldTimestampUnix}:F>`, inline: true },
      { name: 'Hora Propuesta', value: `<t:${timestampUnix}:F>`, inline: true }
    )
}

module.exports = { getMatchInfoEmbed, getMatchProposedScheduleEmbed }