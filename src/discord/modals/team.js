const { ModalBuilder } = require('discord.js')

const getTeamJoinModal = () => {
    return (
        new ModalBuilder()
            .setCustomId('teamJoinModal')
            .setTitle('Unirse a un equipo')
    )
}

module.exports = { getTeamJoinModal }