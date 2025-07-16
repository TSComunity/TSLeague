const { TextInputBuilder, TextInputStyle } = require('discord.js')

const getTeamCodeInput = () => {
    return (
        new TextInputBuilder()
            .setCustomId('teamCodeInput')
            .setLabel('Codigo del equipo')
            .setPlaceholder('AJ24BSAI4TS')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
    )
}

const getTeamNameInput = () => {
    return (
        new TextInputBuilder()
            .setCustomId('teamNameInput')
            .setLabel('Nombre del equipo')
            .setPlaceholder('Los invencibles')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
    )
}

const getTeamIconInput = () => {
    return (
        new TextInputBuilder()
            .setCustomId('teamIconInput')
            .setLabel('Icono del equipo')
            .setPlaceholder('https://i.pinimg.com/...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
    )
}

module.exports = { getTeamCodeInput, getTeamNameInput, getTeamIconInput }