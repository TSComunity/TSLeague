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
    console.error('❌ Error al subir imagen a ImgBB:', err.message)
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

/**
 * Genera la imagen previa de un partido y devuelve la URL.
 * @param {{
 *   divisionDoc: any,
 *   roundIndex: number,
 *   teamADoc: any,
 *   teamBDoc: any
 * }} options
 * @returns {Promise<string>}
 */
async function generateMatchPreviewImageURL({ divisionDoc, roundIndex, teamADoc, teamBDoc }) {
  const backgroundPath = path.resolve(__dirname, '../assets/matchPreview.png')

  const previewImageURL = await generateCustomImage({
    background: backgroundPath,
    texts: [
      {
        text: `DIVISIÓN ${divisionDoc.name.toUpperCase()}`,
        x: 500,
        y: 100,
        font: 'bold 48px Arial',
        color: divisionDoc.color,
        strokeColor: 'black',
        lineWidth: 4,
        align: 'center'
      },
      {
        text: `JORNADA ${roundIndex}`,
        x: 500,
        y: 180,
        font: 'bold 32px Arial',
        color: 'yellow',
        strokeColor: 'black',
        lineWidth: 2,
        align: 'center'
      },
      {
        text: teamADoc.name,
        x: 300,
        y: 300,
        font: 'bold 32px Arial',
        color: teamADoc.color,
        strokeColor: 'black',
        lineWidth: 2,
        align: 'center'
      },
      {
        text: teamBDoc.name,
        x: 700,
        y: 300,
        font: 'bold 32px Arial',
        color: teamBDoc.color,
        strokeColor: 'black',
        lineWidth: 2,
        align: 'center'
      }
    ],
    images: [
      { src: teamADoc.iconURL, x: 250, y: 400, width: 100, height: 100 },
      { src: teamBDoc.iconURL, x: 650, y: 400, width: 100, height: 100 }
    ]
  })

  console.log('✅ PreviewImageURL generada:', previewImageURL)
  return previewImageURL
}

module.exports = {
  generateCustomImage,
  generateMatchPreviewImageURL
}
