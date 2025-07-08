const client = require('../../index.js')

const Season = require('../../Esquemas/season.js')

const { getActiveSeason } = require('../../services/season.js')

const { getSeasonSummaryEmbed } = require('../embeds/season.js')
const { getDivisionRankingEmbed } = require('../embeds/division.js')

const { channels } = require('../../configs/league.js')
const { announcements } = channels
const id1 = '123'
const id2 = '234'

const updateDivisionsEmbed = async () => {
    const channel = await client.channels.fetch(announcements.id)

    if (!channel) {
        throw new Error('No se ha encontrado el canal de anuncios')
    }

    const [msg1, msg2] = await Promise.all([
        channel.messages.fetch(id1).catch(error => {
            console.error(`Error al obtener el mensaje con ID ${id1}:`, error)
            return null
        }),
        channel.messages.fetch(id2).catch(error => {
            console.error(`Error al obtener el mensaje con ID ${id2}:`, error)
            return null
        })
    ])

    if (!msg1 && !msg2) {
        console.warn('No se pudo obtener el mensaje 1 ni el mensaje 2. Saliendo.')
        return
    }

    let seasonState = {
        hasActiveSeason: false,
        seasonData: null,
        hasSeasonsCreated: false,
    }

    try {
        const season = await getActiveSeason()
        seasonState.hasActiveSeason = true
        seasonState.seasonData = season
        seasonState.hasSeasonsCreated = true
    } catch (error) {
        const season = Season.find()

        if (seasons && season.length > 0) {
            seasonState.hasSeasonsCreated = true
        }
    }

    // Ahora, pedimos los embeds a nuestra nueva función, pasándole el estado
    const { embedForMsg1, embedForMsg2 } = getEmbedsForSeasonState(seasonState)

    // Finalmente, intentamos actualizar los mensajes, si existen
    if (msg1) {
        await msg1.edit({ embeds: embedForMsg1 ? [embedForMsg1] : [] })
        console.log('Mensaje 1 actualizado.')
    } else {
        console.warn('El mensaje 1 no fue encontrado, no se puede actualizar.')
    }

    if (msg2) {
        await msg2.edit({ embeds: embedForMsg2 ? [embedForMsg2] : [] })
        console.log('Mensaje 2 actualizado.')
    } else {
        console.warn('El mensaje 2 no fue encontrado, no se puede actualizar.')
    }
}