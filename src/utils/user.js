const { BRAWL_STARS_API_KEY } = require('../configs/configs.js')

function getUserBrawlData({ brawlId }) {
  return fetch(`https://api.brawlstars.com/v1/players/${encodeURIComponent(brawlId)}`, {
    headers: {
      Authorization: `Bearer ${BRAWL_STARS_API_KEY}`,
    },
  })
    .then(res => {
      if (!res.ok) {
        console.error("Error en API Brawl:", res.status)
        return null
      }
      return res.json()
    })
    .catch(err => {
      console.error("Error al obtener datos de Brawl:", err)
      return null
    })
}

module.exports = { getUserBrawlData }