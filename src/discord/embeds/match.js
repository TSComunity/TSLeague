const {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  MessageFlags,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder
} = require('discord.js')

const modesData = require('../../configs/gameModes.json')

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

const getMatchInfoEmbed = ({ match }) => {
  const { teamAId, teamBId, matchIndex, scoreA, scoreB, scheduledAt, status, sets, imageURL } = match
  
    const separator = new SeparatorBuilder()

    const image = new MediaGalleryItemBuilder()
      .setURL(imageURL)
      .setDescription(`Imagén del partido entre ${teamAId} y ${teamBId}`)

    const mediaGallery = new MediaGalleryBuilder()
      .setId(1)
      .addItems([image])

    const estado = (() => {
          if (status === 'scheduled') return '`Programado`'
          if (status === 'cancelled') return '`Cancelado`'
          if (status === 'ended') return '`Terminado`'
          return '`Desconocido`'
        })()

    const time = Math.floor(scheduledAt.getTime() / 1000)

    let setsText = ['', '', '']
    sets.forEach((set, index) => {
    const modeName = getModeOrMapName(set.mode, 'mode')
    const mapName = getModeOrMapName(set.map, 'map')
    
    const separator = (index + 1) === sets.length ? '' : '  '
    setsText[0] += `Set ${index + 1}`.padEnd(12)
    setsText[1] += `Modo: \`${modeName}\``.padEnd(12)
    setsText[2] += `Mapa \`${mapMode}\``.padEnd(12)
  })

  const text = new TextDisplayBuilder().setContent([
    `### ${teamAId.name} vs ${teamBId.name}`,
    `Estado: ${estado.padEnd(11)}  |  Horario: <t:${time}>`,
    ...setsText
  ].join('\n'))
      

  let color
  if (status === 'scheduled') color = 0xFFFF00
  else if (status === 'cancelled') color = 0xED4245
  else if (status === 'ended') color = 0x57F287
  else color = 0x3498DB

  const container = new ContainerBuilder()
      .addMediaGalleryComponents([mediaGallery])
      .addSeparatorComponents(separator)
      .addTextDisplayComponents(text)
      .setAccentColor(color)

  return container
}

module.exports = { getMatchInfoEmbed }