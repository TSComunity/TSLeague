const { ModalBuilder } = require('discord.js')

const getUserVerifyModal = () => {
    return (
        new ModalBuilder()
            .setCustomId('userVerifyModal')
            .setTitle('Verificate para continuar')
    )
}

module.exports = { getUserVerifyModal }