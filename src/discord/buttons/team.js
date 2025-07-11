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
            .setCustomId('equipo_salir')
            .setLabel('Salir del equipo')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🚪')
    )
}

const getTeamChangeNameButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('equipo_cambiar_nombre')
            .setLabel('Cambiar Nombre')
            .setEmoji('📛')
            .setStyle(ButtonStyle.Secondary),
    )
}

const getTeamChangeIconButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('equipo_cambiar_icono')
            .setLabel('Cambiar Icono')
            .setEmoji('🖼️')
            .setStyle(ButtonStyle.Secondary),
    )
}

const getTeamChangeColorButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('equipo_cambiar_color')
            .setLabel('Cambiar Color')
            .setEmoji('🎨')
            .setStyle(ButtonStyle.Secondary),
    )
}

const getTeamManageMembersButton = () => {
    return (
        new ButtonBuilder()
        .setCustomId('equipo_gestionar_jugadores')
        .setLabel('Gestionar Jugadores')
        .setEmoji('🧑‍💼')
        .setStyle(ButtonStyle.Secondary),
    )
}

const getTeamReGenerateCodeButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('equipo_cambiar_codigo')
            .setLabel('Cambiar Código')
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