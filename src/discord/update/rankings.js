const client = require('../../index.js')

const { getLastSeason } = require('../../services/season.js')

const { getSeasonSummaryEmbed } = require('../embeds/season.js')
const { getDivisionRankingEmbed } = require('../embeds/division.js')

const updateRankingsEmbed = async () => {
  const season = await getLastSeason()

  const channel = await client.channels.fetch('ID_DEL_CANAL_CLASIFICACIONES')
  if (!channel || !channel.isTextBased()) {
    throw new Error('Canal no encontrado o no es de texto.')
  }

  const message1 = await channel.messages.fetch('ID_MENSAJE_1')
  if (!message1) {
    throw new Error('Mensaje 1 no encontrado.')
  }

  const message2 = await channel.messages.fetch('ID_MENSAJE_2')
  if (!message1) {
    throw new Error('Mensaje 2 no encontrado.')
  }

  await message1.edit({
    embeds: [getSeasonSummaryEmbed({ season })]
  })

  if (!season.divisions) {
    throw new Error('No se han encontrado divisiones.')
  }

  let divisionsEmbeds = []

  for (const division of season.divisions) {
    divisionsEmbeds.push(getDivisionRankingEmbed({ division }))
  }

  await message2.edit({
    embeds: divisionsEmbeds
  })
}

module.exports = { updateRankingsEmbed }