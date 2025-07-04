function loadEvents(client) {
    const fs = require('fs');
    var colors = require('colors');

    const eventFolders = fs.readdirSync('./Eventos');
    for (const folder of eventFolders) {
        const eventFiles = fs
      .readdirSync(`./Eventos/${folder}`)
      .filter((file) => file.endsWith(".js"))

        for (const file of eventFiles) {
            const evento = require(`../Eventos/${folder}/${file}`);

            if (evento.rest) {
                if(evento.once)
                    client.rest.once(Event.name, (...args) =>
                    evento.execute(...args, client)
                );
                else
                    client.rest.on(Event.name, (...args) =>
                        evento.execute(...args, client)
                    );
            } else {
                if (evento.once)
                    client.once(evento.name, (...args) => evento.execute(...args, client));
                else client.on(evento.name, (...args) => evento.execute(...args, client));
            }
            console.log(`[   BOT-EVENTOS   ]`.underline.green + " --- Cargando  ".green + `  ${evento.name}`.green);
        }   continue;
    }
}

module.exports = {loadEvents};