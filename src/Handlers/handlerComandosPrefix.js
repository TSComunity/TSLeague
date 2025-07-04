const fs = require('fs');
const path = require('path');

async function loadPrefix(client) {
    // Limpiar los prefijos cargados anteriormente
    await client.prefixs.clear();

    // Ruta del directorio que contiene los comandos
    const dirName = path.join(process.cwd(), 'ComandosPrefix');

    // Obtener todos los archivos .js dentro del directorio y subdirectorios
    const getAllFiles = (dir, fileList = []) => {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                getAllFiles(fullPath, fileList);
            } else if (file.endsWith('.js')) {
                fileList.push(fullPath);
            }
        });
        return fileList;
    };

    const Files = getAllFiles(dirName);

    // Cargar cada archivo y registrar los prefijos
    Files.forEach((file) => {
        delete require.cache[require.resolve(file)]; // Limpiar la caché del módulo
        const prefixs = require(file);
        client.prefixs.set(prefixs.name, prefixs);

        const commandName = path.basename(file, '.js'); // Obtener el nombre del comando
        console.log(
            `[   BOT-PREFIX    ]`.underline.blue +
                " --- Cargando  ".blue +
                `  ${commandName}`.blue
        );
    });
}

module.exports = { loadPrefix };