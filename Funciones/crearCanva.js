const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function createChampionsGroupsImage() {
    const width = 1200;
    const height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Cargar fondo de imagen
    const bgImage = await loadImage(path.join(__dirname, 'background.jpg'));
    ctx.drawImage(bgImage, 0, 0, width, height);

    // Capa oscura translúcida sobre imagen para legibilidad
    ctx.fillStyle = 'rgba(10, 12, 24, 0.6)';
    ctx.fillRect(0, 0, width, height);

    // Título estilizado
    ctx.font = 'bold 50px sans-serif'; // Puedes cambiar "sans-serif" por "Arial", "Verdana", etc.
    ctx.fillStyle = '#00ffe7';
    ctx.shadowColor = '#00ffe744';
    ctx.shadowBlur = 10;
    ctx.textAlign = 'center';
    ctx.fillText('TS League - Fase de Grupos', width / 2, 70);
    ctx.shadowBlur = 0;

    // --- Aquí va el resto del código para dibujar los grupos ---

    return canvas.toBuffer('image/png');
}

module.exports = { createChampionsGroupsImage };