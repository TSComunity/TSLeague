require('dotenv').config()
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} = require("discord.js");

const { loadEvents } = require("./Handlers/handlerEventos");
const { loadCommands } = require("./Handlers/handlerComandos");
const { loadPrefix } = require('./Handlers/handlerComandosPrefix');
const process = require('node:process');
const token = process.env.TOKEN;
const wait = require('node:timers/promises').setTimeout; // Usable para muchas cosas
process.on('unhandledRejection', async (reason, promise) => {
console.log('Unhandled Rejection error at:', promise, 'reason', reason);
})
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception', err);
})
process.on('uncaughtExceptionMonitor', (err, origin) => {
  console.log('Uncaught Exception Monitor', err, origin);
})
const client = new Client({
  intents: [Object.keys(GatewayIntentBits)],
  partials: [Object.keys(Partials)],
  allowedMentions: {
      parse: ["users"]
    },
});
client.commands = new Collection();
client.prefixs = new Collection();
client.aliases = new Collection();

client.login(token).then(() => {
  loadEvents(client);
  loadCommands(client);
  loadPrefix(client)
});
module.exports = client;