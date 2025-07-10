const { EmbedBuilder, PermissionsBitField, ChannelType } = require("discord.js");

module.exports = {
    name: "mensajes",
    aliases: ["p", "pong"],
    args: false,
    run: async(message, client, args) => {
        message.channel.send('1')
                message.channel.send('2')
                        message.channel.send('3')


    }
 };