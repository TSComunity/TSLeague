const {
  EmbedBuilder
} = require('discord.js');

module.exports = {
  name: 'clasi',
  aliases: ['adfsdf'],
  args: false,
  run: async (message, client, args) => {

    const embed1 = new EmbedBuilder()
        .setColor('#4f07f7')
        .setDescription('### Aún no se ha creado ninguna temporada')
    
    const embed2 = new EmbedBuilder()
        .setColor('Blue')
        .setDescription('### Aún no se ha creado ninguna temporada')

    await message.channel.send({
      embeds: [embed1]
    })
    await message.channel.send({
      embeds: [embed2]
    })
  }
}