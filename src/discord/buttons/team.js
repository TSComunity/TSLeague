const { ButtonBuilder } = require('discord.js')

const getTeamSeeButton = () => {
    return (
        new ButtonBuilder()
        .setCustomId('teamSee')
        .setLabel('Ver Equipo')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary)
    )
}

const getTeamLeftButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('teamLeave')
            .setLabel('Salir del Equipo')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🚪')
    )
}

const getTeamChangeNameButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('teamChangeName')
            .setLabel('Cambiar Nombre')
            .setEmoji('📛')
            .setStyle(ButtonStyle.Secondary),
    )
}

const getTeamChangeIconButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('teamChangeIcon')
            .setLabel('Cambiar Icono')
            .setEmoji('🖼️')
            .setStyle(ButtonStyle.Secondary),
    )
}

const getTeamChangeColorButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('teamChangeColor')
            .setLabel('Cambiar Color')
            .setEmoji('🎨')
            .setStyle(ButtonStyle.Secondary),
    )
}

const getTeamManageMembersButton = () => {
    return (
        new ButtonBuilder()
        .setCustomId('teamManageMembers')
        .setLabel('Gestionar Jugadores')
        .setEmoji('🧑‍💼')
        .setStyle(ButtonStyle.Secondary),
    )
}

const getTeamReGenerateCodeButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('teamReGenerateCode')
            .setLabel('Regenerar Código')
            .setEmoji('🔑')
            .setStyle(ButtonStyle.Secondary)
    )
}

module.exports = {
    getTeamSeeButton,
    getTeamLeftButton,
    getTeamChangeNameButton,
    getTeamChangeIconButton,
    getTeamChangeColorButton,
    getTeamManageMembersButton,
    getTeamReGenerateCodeButton
}