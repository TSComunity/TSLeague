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
## 📘 Reglas de la Liga
### 📝 Registro
- Todos los equipos deben registrarse antes de la fecha límite.
- Se debe proporcionar un **nombre de equipo** y la lista de jugadores.
### 👥 Tamaño del equipo
- Los equipos deben tener entre **3 y 5 jugadores**.
### 🗺️ Mapas
- Los mapas de cada ronda serán **anunciados con anticipación**.
- **No se permiten cambios** de mapa durante el torneo.
### ⚖️ Fair Play
- Está **prohibido** hacer team con otros equipos, provocar, insultar o sabotear.
### 🚫 Trampas
- **Cualquier uso de hacks o trampas** resultará en la **expulsión del jugador y su equipo**.
### ⏱️ Tiempo límite
- Si un equipo no se presenta **10 minutos después de la hora programada**, se considerará **derrota por incomparecencia**.
### 👨‍⚖️ Árbitros
- Las decisiones del **organizador o árbitro son finales** en caso de disputas o empates.
### 🏆 Premiación y conducta
- Los **premios se entregarán al final** del torneo.
- Se exige una **actitud respetuosa antes, durante y después** de cada partida.
`;

    const text = new TextDisplayBuilder().setContent(textoReglas);
    const separator = new SeparatorBuilder();

    const crearTeam = new ButtonBuilder()
      .setCustomId('inscribir')
      .setLabel('Crear Equipo')
      .setEmoji('1374648332974297098')
      .setStyle(ButtonStyle.Secondary);

    const verTeam = new ButtonBuilder()
      .setCustomId('equipo')
      .setLabel('Ver Equipo')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Secondary);
    
    const unirseTeam = new ButtonBuilder()
      .setCustomId('unirse')
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