const {
  ActionRowBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder
} = require('discord.js')
const emojis = require('../../configs/emojis.json')
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
  const { teamAId, teamBId, scoreA, scoreB, status, previewImageURL, resultsImageURL } = match

  // --- Elegir la imagen según estado ---
  let imageURL = null
  let description = null

  if (status === 'played' && resultsImageURL) {
    imageURL = resultsImageURL
    description = `Resultados: ${teamAId.name} ${scoreA} - ${scoreB} ${teamBId.name}`
  } else if ((status === 'scheduled' || status === 'cancelled') && previewImageURL) {
    imageURL = previewImageURL
    description = `${status === 'cancelled' ? '❌ Partido cancelado' : '📅 Próximo partido'}: ${teamAId.name} vs ${teamBId.name}`
  }

  // --- Si no hay imagen disponible ---
  if (!imageURL) {
    description = `No hay imagen disponible para el partido ${teamAId.name} vs ${teamBId.name}`
  }

  // --- Construcción del container con solo imagen ---
  const container = new ContainerBuilder()

  if (imageURL) {
    const image = new MediaGalleryItemBuilder()
      .setURL(imageURL)
      .setDescription(description || "Imagen del partido")

    const gallery = new MediaGalleryBuilder()
      .setId(1) // 🔑 usar string válido
      .addItems([image])

    container.addMediaGalleryComponents([gallery])
  } else {
    // Si no hay imagen, mostrar al menos un texto
    const textDisplay = new TextDisplayBuilder().setContent(description)
    container.addTextDisplayComponents(textDisplay)
  }

  return container
}

const getMatchProposedScheduleEmbed = ({ interaction, oldTimestampUnix, timestampUnix}) => {
  return new EmbedBuilder()
    .setColor('Yellow')
    .setDescription(`### <@${interaction.user.id}> ha propuesto cambiar la hora del partido.`)
    .addFields(
      { name: `${emojis.schedule} Hora Actual`, value: `<t:${oldTimestampUnix}:F>`, inline: true },
      { name: `${emojis.schedule} Hora Propuesta`, value: `<t:${timestampUnix}:F>`, inline: true }
    )
}

module.exports = { getMatchInfoEmbed, getMatchProposedScheduleEmbed }