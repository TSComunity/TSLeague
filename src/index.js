const process = require('node:process')

const { Client, GatewayIntentBits, Partials, Collection, AttachmentBuilder } = require('discord.js')

const { loadEvents } = require('./Handlers/handlerEventos.js')
const { loadCommands } = require('./Handlers/handlerComandos.js')
const { loadPrefix } = require('./Handlers/handlerComandosPrefix.js')

const { TOKEN } = require('./configs/configs.js')

const wait = require('node:timers/promises').setTimeout

process.on('unhandledRejection', async (reason, promise) => {
console.log('Unhandled Rejection error at:', promise, 'reason', reason)
})
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception', err)
})
process.on('uncaughtExceptionMonitor', (err, origin) => {
  console.log('Uncaught Exception Monitor', err, origin)
})

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Importante para leer mensajes si usas comandos de prefijo
    GatewayIntentBits.GuildMembers, // Necesario para roles y miembros
    // Añade cualquier otro intent que necesites para tu bot
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember,
    // Añade cualquier otro partial que necesites
  ],
  allowedMentions: {
      parse: ["users"]
    },
})

client.commands = new Collection()
client.prefixs = new Collection()
client.aliases = new Collection()

client.login(TOKEN).then(() => {
  loadEvents(client)
  loadCommands(client)
  loadPrefix(client)
})

module.exports = client

// Logica de la liga

const { updateRankingsEmbed } = require('./discord/update/rankings.js')
const { updateDivisionsEmbed } = require('./discord/update/divisions.js')
const { deleteAllEmptyTeams } = require('./services/team.js')
const { executeDueScheduledFunctions } = require('./services/scheduledFunction.js')
const { updateUsersPingRole } = require('./services/user.js')
const { applyDefaultDates } = require('./services/match.js')

setInterval(() => {
  updateRankingsEmbed({ client }).catch(error => console.error(error))
  // updateDivisionsEmbed({ client }).catch(error => console.error(error))
  updateUsersPingRole({ client }).catch(error => console.error(error))
}, 1000 * 60) // cada 1 minuto

setInterval(() => {
  deleteAllEmptyTeams().catch(error => console.error(error))
  executeDueScheduledFunctions({ client }).catch(error => console.error(error))
  applyDefaultDates({ client }).catch(error => console.error(error))
}, 1000 * 60 * 15) // cada 15 minutos