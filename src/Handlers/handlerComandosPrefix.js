const fs = require('fs');
const path = require('path');

async function loadPrefix(client) {
    await client.prefixs.clear();

    const Files = fs
        .readdirSync('src/ComandosPrefix')
        .filter(file => file.endsWith('.js'))

    Files.forEach((file) => {
        const prefixs = require(`../ComandosPrefix/${file}`);  // ruta absoluta funciona siempre
        client.prefixs.set(prefixs.name, prefixs);

        const commandName = path.basename(file, '.js');
        console.log(`[   TS-PREFIX   ]`.underline.blue + " --- Cargando  ".blue + `  ${commandName}`.blue);
    });
}

module.exports = { loadPrefix };