const { ButtonBuilder, ButtonStyle } = require('discord.js')

const getMatchChangeScheduleButton = ({ matchIndex }) => {
    return (
        new ButtonBuilder()
          .setCustomId(`matchChangeSchedule:${matchIndex}`)
          .setLabel('Proponer horario')
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


const getMatchCancelInteractionButton = () => {
    return (
        new ButtonBuilder()
        .setCustomId('matchCancelInteraction') 
        .setLabel('Cancelar')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger)
    )
}

module.exports = { getMatchChangeScheduleButton, getMatchCancelInteractionButton, getMatchAcceptScheduleButton, getMatchRejectScheduleButton }