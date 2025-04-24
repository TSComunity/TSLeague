async function loadCommands(client) {
    const fs = require("fs");
    //var { } = require('colors');
  
    let commandsArray = [];
  
    const commandsFolder = fs.readdirSync("./ComandosSlash");
    for (const folder of commandsFolder) {
      const commandFiles = fs
        .readdirSync(`./ComandosSlash/${folder}`)
        .filter((file) => file.endsWith(".js"));
  
      for (const file of commandFiles) {
        const commandFile = require(`../ComandosSlash/${folder}/${file}`);
        client.commands.set(commandFile.data.name, commandFile);
  
        commandsArray.push(commandFile.data.toJSON());
        console.log(`[   BOT-COMANDOS  ]`.underline.cyan + " --- Cargando  ".cyan + `  ${commandFile.data.name}`.cyan);
        await new Promise(resolve => setTimeout(resolve, 10)); // wait for 2 seconds
        continue;
      }
    }
  
    client.application.commands.set(commandsArray);

    // PARA PONER LOS COMANDOS EN UN SERVER EN ESPECIFICO
    //client.guilds.cache.get('REEMPLAZAR POR ID').commands.set(commandsArray);
  }
  
  module.exports = { loadCommands };