const { EmbedBuilder } = require('discord.js')

const getErrorEmbed = ({ error = 'No se recibieron detalles del error.' }) => {
  return (
    new EmbedBuilder()
      .setColor('Red')
      .setDescription(`### Se ha producido un error\n\n> ${error}`)
  )
}

const getSuccesEmbed = ({ message = 'La operación ha sido completada sin errores.' }) => {
  return (
    new EmbedBuilder()
      .setColor('Green')
      .setDescription(`### Operación completada\n\n> ${message}`)
  )
}

const getMaintenanceEmbed = ({ reason = 'No se recibio ningun motivo.' }) => {
      return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription(`### Mantenimiento\n\n${reason}`)
      )
}

module.exports = { getErrorEmbed, getSuccesEmbed, getMaintenanceEmbed }