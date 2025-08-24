// utils/generateImage.js
const { createCanvas, loadImage } = require('canvas')
const fs = require('fs')
const axios = require('axios')
const { IMGBB_API_KEY } = require('../configs/configs.js')

/**
 * Sube el buffer a imgBB y devuelve la URL pública.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function uploadToImgBB(buffer) {
  const base64Image = buffer.toString('base64')
  const formData = new URLSearchParams()
  formData.append('key', IMGBB_API_KEY)
  formData.append('image', base64Image)

  const response = await axios.post('https://api.imgbb.com/1/upload', formData)
  return response.data.data.url
}

/**
 * Genera una imagen personalizada y la sube a imgBB.
 * @param {{
 *   background: string,
 *   texts?: Array<{ text: string, x: number, y: number, font?: string, color?: string, align?: string, baseline?: string, strokeColor?: string, lineWidth?: number }>,
 *   images?: Array<{ src: string, x: number, y: number, width?: number, height?: number }>,
 *   width?: number,
 *   height?: number,
 *   outputPath?: string
 * }} options
 * @returns {Promise<string>} URL pública de la imagen subida
 */
async function generateCustomImage({
  background,
  texts = [],
  images = [],
  width = 1000,
  height = 600,
  outputPath,
}) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Fondo
  const bg = await loadImage(background)
  ctx.drawImage(bg, 0, 0, width, height)

  // Textos
  for (const t of texts) {
    ctx.font = t.font || '30px sans-serif'
    ctx.fillStyle = t.color || '#000'
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
    const image = await loadImage(img.src)
    const w = img.width || image.width
    const h = img.height || image.height
    ctx.drawImage(image, img.x, img.y, w, h)
  }

  const buffer = canvas.toBuffer('image/png')

  // Guardar local (opcional)
  if (outputPath) {
    fs.writeFileSync(outputPath, buffer)
  }

  // Subir a imgBB y devolver URL
  const url = await uploadToImgBB(buffer)
  return url
}
const generateMatchPreviewImageURL = async ({
    divisionDoc,
    roundIndex,
    teamADoc,
    teamBDoc
  }) => {
  const previewImageURL = await generateCustomImage({
    background: '../../assets/matchInfo.png',
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
        y: 400,
        font: 'bold 32px Arial',
        color: 'yellow',
        strokeColor: 'black',
        lineWidth: 2,
        align: 'center'
      },
      {
        text: teamADoc.name,
        x: 500,
        y: 100,
        font: 'bold 32px Arial',
        color: teamADoc.color,
        strokeColor: 'black',
        lineWidth: 2,
        align: 'center'
      },
      {
        text: teamBDoc.name,
        x: 500,
        y: 100,
        font: 'bold 32px Arial',
        color: teamBDoc.color,
        strokeColor: 'black',
        lineWidth: 2,
        align: 'center'
      }
    ],
    images: [
      {
        src: teamADoc.iconURL,
        x: 200,
        y: 400,
        width: 100,
        height: 100,
      },
      {
        src: teamBDoc.iconURL,
        x: 500,
        y: 400,
        width: 100,
        height: 100,
      },
    ]
  })
  return previewImageURL
}

module.exports = { generateCustomImage, generateMatchPreviewImageURL }