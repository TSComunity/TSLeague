const { EmbedBuilder } = require('discord.js')
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
  const { teamAId, teamBId, matchIndex, scoreA, scoreB, scheduledAt, status, sets } = match

  const time = Math.floor(scheduledAt.getTime() / 1000)

  let color
  if (status === 'scheduled') color = 'Yellow'
  else if (status === 'cancelled') color = 'Red'
  else if (status === 'ended') color = 'Green'
  else color = 'Blue'

  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(`## ${teamAId.name} vs ${teamBId.name}`)
    .addFields(
      { name: 'Índice', value: `\`${matchIndex}\``, inline: true },
      { name: 'Horario', value: `<t:${time}>`, inline: true },
      {
        name: 'Estado',
        value: (() => {
          if (status === 'scheduled') return '`Programado`'
          if (status === 'cancelled') return '`Cancelado`'
          if (status === 'ended') return '`Terminado`'
          return '`Desconocido`'
        })(),
        inline: true
      }
    )

  // 🧩 Añadir un campo por cada set
  sets.forEach((set, index) => {
    const modeName = getModeOrMapName(set.mode, 'mode')
    const mapName = getModeOrMapName(set.map, 'map')

    embed.addFields({
      name: `Set ${index + 1}`,
      value: `> Modo: \`${modeName}\`\n> Mapa: \`${mapName}\``,
      inline: false
    })
  })

  return embed
}

module.exports = { getMatchInfoEmbed }