const { ButtonBuilder } = require('discord.js')

const getMatchChangeSchedule = () => {
    return (
        new ButtonBuilder()
          .setCustomId(`matchChangeSchedule`)
          .setLabel('Cambiar Horario')
          .setEmoji('<:subleader:1395916298025832519>')
          .setStyle(ButtonStyle.Primary)
    )
}

module.exports = { getMatchChangeSchedule }