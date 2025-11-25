// render.js
const puppeteer = require('puppeteer')
const { uploadToImgBB } = require('./upload.js')
const fs = require('fs')
const path = require('path')

async function renderTemplate(templateName, data) {
  const templatePath = path.resolve(__dirname, 'templates', `${templateName}.html`)
  let html = await fs.promises.readFile(templatePath, 'utf8')

  // reemplazo de variables
  for (const [key, value] of Object.entries(data)) {
    html = html.replaceAll(`{{${key}}}`, value ?? '')
  }

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })

  const element = await page.$(`#capture`)

if (!element) throw new Error(`No se encontró el elemento con id "capture"`)

  const buffer = await element.screenshot({ type: 'png' })
  await browser.close()
  return buffer
}

async function generateImage(templateName, data) {
  const buffer = await renderTemplate(templateName, data)
  const url = await uploadToImgBB(buffer)
  return url
}

module.exports = { renderTemplate, generateImage }