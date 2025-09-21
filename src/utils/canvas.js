const { createCanvas, loadImage } = require('canvas')
const fs = require('node:fs')
const path = require('node:path')
const axios = require('axios')
const { IMGBB_API_KEY } = require('../configs/configs.js')

/**
 * Sube el buffer a ImgBB y devuelve la URL pública.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function uploadToImgBB(buffer) {
  try {
    const base64Image = buffer.toString('base64')
    const formData = new URLSearchParams()
    formData.append('key', IMGBB_API_KEY)
    formData.append('image', base64Image)

    const response = await axios.post('https://api.imgbb.com/1/upload', formData)

    // Algunas veces la propiedad es display_url, otras url
    return response.data?.data?.display_url || response.data?.data?.url
  } catch (err) {
    console.error('❌ Error al subir imagen a ImgBB:', err)
    return null
  }
}

/**
 * Genera una imagen personalizada.
 * @param {{
 *   background: string,
 *   texts?: Array<{ text: string, x: number, y: number, font?: string, color?: string, align?: string, baseline?: string, strokeColor?: string, lineWidth?: number }>,
 *   images?: Array<{ src: string, x: number, y: number, width?: number, height?: number }>,
 *   width?: number,
 *   height?: number
 * }} options
 * @returns {Promise<string>} URL pública de la imagen subida o fallback
 */
async function generateCustomImage({
  background,
  texts = [],
  images = [],
  width = 1000,
  height = 600,
}) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Fondo
  try {
    const bg = await loadImage(background)
    ctx.drawImage(bg, 0, 0, width, height)
  } catch (err) {
    console.warn('⚠️ No se pudo cargar el background:', background, err.message)
    ctx.fillStyle = '#222'
    ctx.fillRect(0, 0, width, height)
  }

  // Textos
  for (const t of texts) {
    ctx.font = t.font || '30px sans-serif'
    ctx.fillStyle = t.color || '#fff'
    ctx.textAlign = t.align || 'left'
    ctx.textBaseline = t.baseline || 'top'

    if (t.strokeColor) {
      ctx.lineWidth = t.lineWidth || 2
      ctx.strokeStyle = t.strokeColor
      ctx.strokeText(t.text, t.x, t.y)
    }

    ctx.fillText(t.text, t.x, t.y)
  }

  // Imágenes encima
  for (const img of images) {
    try {
      const image = await loadImage(img.src)
      const w = img.width || image.width
      const h = img.height || image.height
      ctx.drawImage(image, img.x, img.y, w, h)
    } catch (err) {
      console.warn('⚠️ No se pudo cargar imagen:', img.src, err.message)
    }
  }

  const buffer = canvas.toBuffer('image/png')

  // Subir a ImgBB
  const url = await uploadToImgBB(buffer)

  // Fallback en caso de error
  return url || 'https://i.imgur.com/removed.png'
}

async function generateMatchPreviewImageURL({ divisionDoc, roundIndex, teamADoc, teamBDoc }) {
  const backgroundPath = path.resolve(__dirname, '../assets/matchPreview.png')

  const maxTextWidth = 200; // ancho máximo permitido para los nombres
  const baseFontSize = 32;

  const previewImageURL = await generateCustomImage({
    background: backgroundPath,
    texts: [
      {
        text: `DIVISIÓN ${divisionDoc.name.toUpperCase()}`,
        x: 500,
        y: 60,
        font: 'bold 48px Arial',
        color: divisionDoc.color,
        strokeColor: 'black',
        lineWidth: 4,
        align: 'center'
      },
      {
        text: `JORNADA ${roundIndex}`,
        x: 500,
        y: 480,
        font: 'bold 40px Arial',
        color: 'yellow',
        strokeColor: 'black',
        lineWidth: 3,
        align: 'center'
      },
      {
        text: teamADoc.name,
        x: 200,
        y: 300,
        font: `bold ${baseFontSize}px Arial`,
        color: teamADoc.color,
        strokeColor: 'black',
        lineWidth: 2,
        align: 'center',
        maxWidth: maxTextWidth
      },
      {
        text: teamBDoc.name,
        x: 800,
        y: 300,
        font: `bold ${baseFontSize}px Arial`,
        color: teamBDoc.color,
        strokeColor: 'black',
        lineWidth: 2,
        align: 'center',
        maxWidth: maxTextWidth
      }
    ],
    images: [
      { src: teamADoc.iconURL, x: 150, y: 150, width: 150, height: 150 },
      { src: teamBDoc.iconURL, x: 750, y: 150, width: 150, height: 150 }
    ]
  })

  return previewImageURL
}

/**
 * Genera la imagen de resultados de un partido a partir de un Match ya poblado.
 * @param {Object} match Match poblado con teamAId y teamBId
 * @returns {Promise<string>} URL pública de la imagen subida
 */
async function generateMatchResultsImageURL({ match }) {
  // Rutas absolutas de los assets
  const background = path.resolve(__dirname, '../assets/matchResults.webp')
  const crownIcon = path.resolve(__dirname, '../assets/winner.webp')
  const mvpIcon = path.resolve(__dirname, '../assets/starPlayer.webp')

  // Diseño según tu diseñador
  const design = {
    texto_jugadores: {
      azul: [
        { x: 130, y: 620 },
        { x: 130, y: 660 },
        { x: 130, y: 700 }
      ],
      rojo: [
        { x: 1070, y: 620 },
        { x: 1070, y: 660 },
        { x: 1070, y: 700 }
      ],
      fuente: 'Lilita One',
      tamaño_fuente: 36,
      color: '#FFFFFF'
    }
  }

  const texts = []
  const images = []

  const teamA = match.teamAId
  const teamB = match.teamBId

  // Dibujar nombres de jugadores
  teamA.players.forEach((player, i) => {
    texts.push({
      text: player,
      x: design.texto_jugadores.azul[i].x,
      y: design.texto_jugadores.azul[i].y,
      font: `${design.texto_jugadores.tamaño_fuente}px ${design.texto_jugadores.fuente}`,
      color: design.texto_jugadores.color,
      align: 'left',
      baseline: 'top'
    })
  })

  teamB.players.forEach((player, i) => {
    texts.push({
      text: player,
      x: design.texto_jugadores.rojo[i].x,
      y: design.texto_jugadores.rojo[i].y,
      font: `${design.texto_jugadores.tamaño_fuente}px ${design.texto_jugadores.fuente}`,
      color: design.texto_jugadores.color,
      align: 'left',
      baseline: 'top'
    })
  })

  // Dibujar MVP
  if (match.starPlayer) {
    await match.populate('starPlayer') // Para tener el nombre
    const mvpName = match.starPlayer.name

    // Buscar en qué equipo está
    let pos
    let idx = teamA.players.indexOf(mvpName)
    if (idx !== -1) pos = design.texto_jugadores.azul[idx]
    else {
      idx = teamB.players.indexOf(mvpName)
      if (idx !== -1) pos = design.texto_jugadores.rojo[idx]
    }

    if (pos) {
      images.push({
        src: mvpIcon,
        x: pos.x - 60, // al lado del nombre, ajustable
        y: pos.y,
        width: 50,
        height: 50
      })
    }
  }

  // Dibujar corona sobre el equipo ganador (lado azul)
  if (match.scoreA > match.scoreB || match.scoreB > match.scoreA) {
    images.push({
      src: crownIcon,
      x: design.texto_jugadores.azul[0].x, // encima del primer jugador del equipo ganador
      y: design.texto_jugadores.azul[0].y - 60,
      width: 100,
      height: 60
    })
  }

  // Generar imagen
  const resultsImageURL = await generateCustomImage({
    background,
    texts,
    images,
    width: 1500,
    height: 800
  })

  // Guardar URL en el match
  match.resultsImageURL = resultsImageURL
  await match.save()

  return resultsImageURL
}

module.exports = {
  uploadToImgBB,
  generateMatchPreviewImageURL,
  generateMatchResultsImageURL
}