const { getLastSeason } = require('../../services/season.js')
const { getSeasonSummaryEmbed } = require('../embeds/season.js')
const { getDivisionRankingEmbed } = require('../embeds/division.js')
const { channels } = require('../../configs/league.js')

const updateRankingsEmbed = async ({ client }) => {
  const season = await getLastSeason()
  if (!season || !season.divisions?.length) {
    throw new Error('No hay divisiones en la temporada actual.')
  }

  const channel = await client.channels.fetch(channels.rankings.id)
  if (!channel || !channel.isTextBased()) {
    throw new Error('Canal no encontrado o no es de texto.')
  }

  // 📨 Obtener mensajes del canal (orden cronológico ascendente)
  const fetchedMessages = await channel.messages.fetch({ limit: 100 })
  const botMessages = fetchedMessages
    .filter(msg => msg.author.id === client.user.id)
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)

  const messagesArray = Array.from(botMessages.values())
  const expectedMessages = season.divisions.length + 1

  // ❌ Si hay MENOS mensajes de los necesarios
  if (messagesArray.length < expectedMessages) {
    // 🔥 Eliminar todos los mensajes del bot
    for (const msg of messagesArray) {
      await msg.delete().catch(() => {})
    }

    // 🟢 Volver a enviar los necesarios
    const summaryEmbed = getSeasonSummaryEmbed({ season })
    await channel.send({ embeds: [summaryEmbed] })

    for (const division of season.divisions) {
      const divisionEmbed = getDivisionRankingEmbed({ division })
      await channel.send({ embeds: [divisionEmbed] })
    }

    return
  }

  // ✅ Suficientes mensajes: editar
  const summaryMsg = messagesArray[0]
  await summaryMsg.edit({
    embeds: [getSeasonSummaryEmbed({ season })]
  })

  for (let i = 0; i < season.divisions.length; i++) {
    const division = season.divisions[i]
    const msg = messagesArray[i + 1] // +1 porque el primero es el resumen

    if (msg) {
      await msg.edit({
        embeds: [getDivisionRankingEmbed({ division })]
      })
    }
  }

  // ✂️ Si hay mensajes SOBRANTES, eliminarlos
  if (messagesArray.length > expectedMessages) {
    for (let i = expectedMessages; i < messagesArray.length; i++) {
      const msg = messagesArray[i]
      await msg.delete().catch(() => {})
    }
  }
}

module.exports = { updateRankingsEmbed }