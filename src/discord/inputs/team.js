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
            .setPlaceholder('https://i.pinimg.com/736x/9c/5d/70/9c5d708a46f35e24e76b43f5cd01a1b4.jpg')
            .setStyle(TextInputStyle.Long)
            .setRequired(true)
    )
}

module.exports = { getTeamCodeInput, getTeamNameInput, getTeamIconInput }