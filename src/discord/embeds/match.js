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

  // Determinar qué imagen usar según el estado
  const getImageData = () => {
    if (status === 'played' && resultsImageURL) {
      return {
        url: resultsImageURL,
        description: `Resultados: ${teamAId.name} ${scoreA} - ${scoreB} ${teamBId.name}`
      }
    } else if ((status === 'scheduled' || status === 'cancelled') && previewImageURL) {
      return {
        url: previewImageURL,
        description: `${status === 'cancelled' ? 'Partido cancelado' : 'Próximo partido'}: ${teamAId.name} vs ${teamBId.name}`
      }
    }
    return null
  }

  // Información del estado con emojis y colores
  const getStatusInfo = () => {
    switch (status) {
      case 'scheduled':
        return { text: '📅 `Programado`', color: 0xFFFF00 }
      case 'played':
        return { text: '✅ `Terminado`', color: 0x57F287 }
      case 'cancelled':
        return { text: '❌ `Cancelado`', color: 0xED4245 }
      default:
        return { text: '❓ `Desconocido`', color: 0x3498DB }
    }
  }

  // Construir el contenido según el estado
  const buildContent = () => {
    const time = Math.floor(scheduledAt.getTime() / 1000)
    
    let content = [
      `### ${teamAId.name} vs ${teamBId.name}`,
      `Estado: ${getStatusInfo().text}  |  Horario: <t:${time}>`
    ]

    if (status === 'played') {
      // Partido jugado - mostrar resultados
      content.push(`**Resultado final:** \`${scoreA} - ${scoreB}\``)
      
      // Mostrar ganador
      if (scoreA > scoreB) {
        content.push(`🏆 **Ganador:** ${teamAId.name}`)
      } else if (scoreB > scoreA) {
        content.push(`🏆 **Ganador:** ${teamBId.name}`)
      } else {
        content.push(`🤝 **Empate**`)
      }

      // Información de sets si existen
      if (sets && sets.length > 0) {
        content.push('\n**📋 Sets jugados:**')
        
        sets.forEach((set, index) => {
          const modeName = getModeOrMapName(set.mode, 'mode')
          const mapName = getModeOrMapName(set.map, 'map')
          
          let setLine = `**Set ${index + 1}:** \`${modeName}\` en \`${mapName}\``
          
          // Mostrar ganador del set si existe
          if (set.winner) {
            const winnerName = set.winner.toString() === teamAId._id.toString() 
              ? teamAId.name 
              : teamBId.name
            setLine += ` → 🏆 ${winnerName}`
          }
          
          content.push(setLine)
        })
      }

    } else if (status === 'scheduled') {
      // Partido programado - mostrar información previa
      content.push(`⏰ **Programado para:** <t:${time}:F>`)
      
      // Información de sets si están definidos
      if (sets && sets.length > 0) {
        content.push('\n**📋 Sets programados:**')
        
        sets.forEach((set, index) => {
          const modeName = getModeOrMapName(set.mode, 'mode')
          const mapName = getModeOrMapName(set.map, 'map')
          content.push(`**Set ${index + 1}:** \`${modeName}\` en \`${mapName}\``)
        })
      }

    } else if (status === 'cancelled') {
      // Partido cancelado
      content.push(`**Programado para:** <t:${time}:F>`)
      
      if (reason) {
        content.push(`**Razón de cancelación:** ${reason}`)
      }
    }

    return content.join('\n')
  }

  const separator = new SeparatorBuilder()
  const imageData = getImageData()
  const statusInfo = getStatusInfo()

  // Crear MediaGallery solo si tenemos imagen
  let mediaGallery = null
  if (imageData) {
    const image = new MediaGalleryItemBuilder()
      .setURL(imageData.url)
      .setDescription(imageData.description)

    mediaGallery = new MediaGalleryBuilder()
      .setId(1)
      .addItems([image])
  }

  const text = new TextDisplayBuilder().setContent(buildContent())

  // Crear botones si es necesario
  let buttonRow = null
  if (showButtons) {
    const buttons = []
    
    if (status === 'scheduled') {
      // Botones para partidos programados
      buttons.push(
        getMatchChangeScheduleButton({ matchIndex})
      )
    } else if (status === 'played') {
      // Botones para partidos terminados

    } else if (status === 'cancelled') {
      // Botones para partidos cancelados

    }

    if (buttons.length > 0) {
      buttonRow = new ActionRowBuilder().addComponents(buttons)
    }
  }

  // Construir el container
  const containerBuilder = new ContainerBuilder()
    .addSeparatorComponents(separator)
    .addTextDisplayComponents(text)
    .setAccentColor(statusInfo.color)

  // Solo agregar MediaGallery si tenemos imagen
  if (mediaGallery) {
    containerBuilder.addMediaGalleryComponents([mediaGallery])
  }

  // Agregar botones si existen
  if (buttonRow) {
    containerBuilder.addActionRowComponents(buttonRow)
  }

  return containerBuilder
}

module.exports = { getMatchInfoEmbed }