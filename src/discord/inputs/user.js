const { TextInputBuilder, TextInputStyle } = require('discord.js')

const getUserBrawlIdInput = () => {
    return (
        new TextInputBuilder()
            .setCustomId('userBrawlIdInput')
            .setLabel('ID de Brawl Stars')
            .setPlaceholder('#2PGRGJUPR')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
    )
}

module.exports = { getUserBrawlIdInput }