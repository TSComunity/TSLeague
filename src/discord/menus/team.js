const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

const getTeamChangeColorMenu = () => {
    return (
        new StringSelectMenuBuilder()
        .setCustomId('teamChangeColorMenu')
        .setPlaceholder('Elige un color para tu equipo')
        .addOptions(
            new StringSelectMenuOptionBuilder()
            .setLabel('Rojo')
            .setValue('#ff0000')
            .setEmoji('🔴'),
            new StringSelectMenuOptionBuilder()
            .setLabel('Azul')
            .setValue('#0000ff')
            .setEmoji('🔵'),
            new StringSelectMenuOptionBuilder()
            .setLabel('Verde')
            .setValue('#00ff00')
            .setEmoji('🟢')
        )
    )
}

module.exports = { getTeamChangeColorMenu }