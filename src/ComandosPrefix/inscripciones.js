const {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  MessageFlags,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder
} = require('discord.js');

module.exports = {
  name: 'inscribir',
  aliases: ['ins'],
  args: false,
  run: async (message, client, args) => {
    const textoReglas = `
pepe haz esto (estoy probando si funcionan los botones)
`;

    const text = new TextDisplayBuilder().setContent(textoReglas);
    const separator = new SeparatorBuilder();

    const crearTeam = new ButtonBuilder()
      .setCustomId('teamCreate')
      .setLabel('Crear Equipo')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Secondary);

    const verTeam = new ButtonBuilder()
      .setCustomId('teamSee')
      .setLabel('Ver Equipo')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Secondary);
    
    const unirseTeam = new ButtonBuilder()
      .setCustomId('teamJoin')
      .setLabel('Unirte a un Equipo')
      .setEmoji('👥')
      .setStyle(ButtonStyle.Success)

    const actionRow = new ActionRowBuilder().addComponents(
      crearTeam,
      verTeam,
      unirseTeam
    );
    const image = new MediaGalleryItemBuilder()
      .setURL("https://media.discordapp.net/attachments/1366297762496249906/1374654925295845446/TS_LEAGUE.png?ex=682ed6aa&is=682d852a&hm=c15d97f6f7fd0f756ab034df54af062f821d0a4425b4695d793a7655220ebd92&=&format=webp&quality=lossless&width=1872&height=433")
      .setDescription("tsleague");

    const mediaGallery = new MediaGalleryBuilder()
      .setId(1)
      .addItems([image]);

    const container = new ContainerBuilder()
      .addMediaGalleryComponents([mediaGallery])
      .addSeparatorComponents(separator)
      .addTextDisplayComponents(text)
      .addSeparatorComponents(separator)
      .setAccentColor(0x1bfc62)
      .addActionRowComponents(actionRow)

    await message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};