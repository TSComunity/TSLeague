const { ButtonBuilder, ButtonStyle } = require('discord.js')

const getMatchChangeScheduleButton = ({ matchIndex }) => {
    return (
        new ButtonBuilder()
          .setCustomId(`matchChangeSchedule:${matchIndex}`)
          .setLabel('Cambiar Horario')
          .setEmoji('<:subleader:1395916298025832519>')
          .setStyle(ButtonStyle.Primary)
    )
}

const getMatchAcceptScheduleButton = ({ matchIndex, leaderId }) => {
    return (
        new ButtonBuilder()
          .setCustomId(`matchAcceptSchedule:${matchIndex}:${leaderId}`)
          .setLabel('Aceptar')
          .setStyle(ButtonStyle.Success)
    )
}

const getMatchRejectScheduleButton = ({ matchIndex, leaderId }) => {
    return (
        new ButtonBuilder()
          .setCustomId(`matchRejectSchedule:${matchIndex}:${leaderId}`)
          .setLabel('Rechazar')
          .setStyle(ButtonStyle.Danger)
    )
}


const getMatchInteractionCancelButton = () => {
    return (
        new ButtonBuilder()
        .setCustomId('matchInteractionCancel') 
        .setLabel('Cancelar')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger)
    )
}

module.exports = { getMatchChangeScheduleButton, getMatchInteractionCancelButton, getMatchAcceptScheduleButton, getMatchRejectScheduleButton }