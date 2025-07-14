async function loadPrefix(client) {
    const { loadFiles } = require('../Eventos/Funciones/fileLoader.js')
    const fs = require('fs');

    await client.prefixs.clear()
    const Files = await loadFiles('comandosprefix')

    Files.forEach((file) => {
        const prefixs = require(file);
        client.prefixs.set(prefixs.name, prefixs);
        const commandName = file.split('/').pop().replace('.js', ''); // This line extracts the command name from the file path and removes the '.js' extension
        console.log(`[   TS-PREFIX   ]`.underline.blue + " --- Cargando  ".blue + `  ${commandName}`.blue);
    })
}

module.exports = { loadPrefix }