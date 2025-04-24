const { Events } = require('discord.js');
require('dotenv').config();

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        const prefix = process.env.PREFIX;
        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // Buscar el comando por nombre o alias
        const comando =
            client.prefixs.get(command) ||
            client.prefixs.find((cmd) => cmd.aliases && cmd.aliases.includes(command));

        if (!comando) return;
        try {
            await comando.run(message, client, args);
        } catch (error) {
            message.reply(`Error al ejecutar el comando.`);
            console.error(error);
        }
    },
};