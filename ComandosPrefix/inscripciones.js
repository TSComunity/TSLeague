const {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  MessageFlags // <-- IMPORTANTE
} = require('discord.js');

module.exports = {
  name: 'inscribir',
  aliases: ['ins'],
  args: false,
  run: async (message, client, args) => {
    // Texto principal
    const text = new TextDisplayBuilder()
      .setContent('**Inscripciones abiertas**\n¡Ya puedes inscribirte al evento!');

    // Separador visual
    const separator = new SeparatorBuilder();

    // Botón en un ActionRow
    const button = new ButtonBuilder()
      .setCustomId('inscribir')
      .setLabel('Inscribirme')
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder().addComponents(button);

    // ContainerBuilder con los componentes correctos
    const container = new ContainerBuilder()
      .addTextDisplayComponents(text)
      .addSeparatorComponents(separator)
      .addActionRowComponents(actionRow);

    await message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};