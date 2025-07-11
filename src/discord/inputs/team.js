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

module.exports = { getTeamCodeInput }