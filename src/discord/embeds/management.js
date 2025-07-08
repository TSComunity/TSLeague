const { EmbedBuilder } = require('discord.js')

const getErrorEmbed = ({ error = 'No se recibieron detalles del error.' }) => {
  return (
    new EmbedBuilder()
      .setColor('Red')
      .setTitle('Se ha producido un error')
      .setDescription(`### Se ha producido un error\n\n${error}`)
  )
}

const getMaintenanceEmbed = ({ reason = 'No se recibio ningun motivo.' }) => {
      return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription(`### Mantenimiento\n\n${reason}`)
      )
}

module.exports = { getErrorEmbed, getMaintenanceEmbed }