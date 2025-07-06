const process = require('node:process')

const { Client, GatewayIntentBits, Partials, Collection, AttachmentBuilder } = require('discord.js')

const { loadEvents } = require('./Handlers/handlerEventos.js')
const { loadCommands } = require('./Handlers/handlerComandos.js')
const { loadPrefix } = require('./Handlers/handlerComandosPrefix.js')

const { createChampionsGroupsImage } = require('./utils/crearCanva.js')

require('dotenv').config()
const TOKEN = process.env.TOKEN

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
  intents: [Object.keys(GatewayIntentBits)],
  partials: [Object.keys(Partials)],
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

client.on('messageCreate', async (message) => {
    // Ignorar mensajes del propio bot
    if (message.author.bot) return;
    if (message.content === '!grupos') {
        try {
            // Llama a la función para crear la imagen
            const buffer = await createChampionsGroupsImage();
            // Crea un AttachmentBuilder con el buffer de la imagen
            const attachment = new AttachmentBuilder(buffer, { name: 'grupos_champions.png' });
            // Envía la imagen al canal
            message.channel.send({ files: [attachment] });
        } catch (error) {
            console.error('Error al generar o enviar la imagen de grupos:', error);
            message.channel.send('Hubo un error al generar los grupos. Inténtalo de nuevo más tarde.');
        }
    }
})


// Logica de la liga

const { updateAllTeamsEligibility, deleteEmptyTeams } = require('./services/team.js')

setInterval(() => {
  updateAllTeamsEligibility().catch(err => console.error('Error en updateAllTeamsEligibility:', err))
  deleteEmptyTeams().catch(err => console.error('Error en deleteEmptyTeams:', err))
}, 1000 * 60 * 10)



// IDs reales de canal y mensaje
const canalId = '1364999474564436068';
const mensajeId = '1375016276988002346';

setInterval(async () => {
  try {
    await actualizarMensajeDivisiones(client, canalId, mensajeId)
  } catch (error) {
    console.error('❌ Error al actualizar divisiones:', error)
  }
}, 10000)