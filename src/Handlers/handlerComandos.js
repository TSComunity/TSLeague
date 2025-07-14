async function loadCommands(client) {
    const fs = require("fs");
    var colors = require('colors');
  
    let commandsArray = [];
    
    const commandsFolder = fs.readdirSync("./comandos");
    for (const folder of commandsFolder) {
      const commandFiles = fs
        .readdirSync(`./comandos/${folder}`)
        .filter((file) => file.endsWith(".js"));
  
      for (const file of commandFiles) {
        const commandFile = require(`../comandos/${folder}/${file}`);
  
        const properties = { folder, ...commandFile };
        client.commands.set(commandFile.data.name, commandFile);
  
        commandsArray.push(commandFile.data.toJSON());
        console.log(`[   TS-CMDS      ]`.underline.cyan + " --- Cargando  ".cyan + `  ${commandFile.data.name}`.cyan);
        await new Promise(resolve => setTimeout(resolve, 10)); // wait for 2 seconds
        continue;
      }
    }
  
    await client.guilds.cache.get('1093864130030612521').commands.set(commandsArray);
  }
  
  module.exports = { loadCommands };