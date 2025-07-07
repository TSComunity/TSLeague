const fs = require('fs');
const path = require('path');

async function loadCommands(client) {
  let commandsArray = [];

  // Suponiendo que este archivo está en src/Handlers/
  const projectRoot = path.resolve(__dirname, '..', '..'); 
  const commandsPath = path.join(projectRoot, 'src', 'ComandosSlash');

  const commandFolders = fs.readdirSync(commandsPath, { withFileTypes: true })
                           .filter(dirent => dirent.isDirectory())
                           .map(dirent => dirent.name);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);

      client.commands.set(command.data.name, command);
      commandsArray.push(command.data.toJSON());

      console.log(`[BOT-COMANDOS] Cargando ${command.data.name}`);

      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  await client.application.commands.set(commandsArray);
}

module.exports = { loadCommands };
