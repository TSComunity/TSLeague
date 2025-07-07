const fs = require('fs');
const path = require('path');
const colors = require('colors');

function loadEvents(client) {
    const eventFolders = fs.readdirSync('./src/Eventos');

    for (const folder of eventFolders) {
        const eventFiles = fs
            .readdirSync(`./src/Eventos/${folder}`)
            .filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const filePath = path.join(__dirname, '..', 'src', 'Eventos', folder, file);
            const evento = require(`../Eventos/${folder}/${file}`);


            if (!evento || typeof evento.execute !== 'function') {
                console.warn(`[   BOT-EVENTOS   ]`.underline.yellow + ` --- Archivo inválido: ${file}`.yellow);
                continue;
            }

            if (evento.rest) {
                if (evento.once) {
                    client.rest.once(evento.name, (...args) => evento.execute(...args, client));
                } else {
                    client.rest.on(evento.name, (...args) => evento.execute(...args, client));
                }
            } else {
                if (evento.once) {
                    client.once(evento.name, (...args) => evento.execute(...args, client));
                } else {
                    client.on(evento.name, (...args) => evento.execute(...args, client));
                }
            }

            console.log(`[   BOT-EVENTOS   ]`.underline.green + " --- Cargando  ".green + `  ${evento.name}`.green);
        }
    }
}

module.exports = { loadEvents };
