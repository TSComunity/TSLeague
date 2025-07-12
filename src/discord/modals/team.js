const { ModalBuilder } = require('discord.js')

const getTeamCreateModal = () => {
    return (
        new ModalBuilder()
            .setCustomId('teamCreateModal')
            .setTitle('Crear Equipo')
    )
}

const getTeamJoinModal = () => {
    return (
        new ModalBuilder()
            .setCustomId('teamJoinModal')
            .setTitle('Unirse a un Equipo')
    )
}

const getTeamChangeNameModal = () => {
    return (
        new ModalBuilder()
            .setCustomId('teamChangeNameModal')
            .setTitle('Cambiar Nombre')
    )
}

const getTeamChangeIconModal = () => {
    return (
        new ModalBuilder()
            .setCustomId('teamChangeIconModal')
            .setTitle('Cambiar Icono')
    )
}

module.exports = { getTeamCreateModal, getTeamJoinModal, getTeamChangeNameModal, getTeamChangeIconModal }