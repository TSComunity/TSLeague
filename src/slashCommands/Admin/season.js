const { SlashCommandBuilder } = require('discord.js')
const { startSeason, endSeason } = require('../../services/season.js')
const { getLastSeason } = require('../../utils/season.js')
const { addRound } = require('../../services/round.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../discord/embeds/management.js')
const { sendLog } = require('../../discord/send/staff.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('temporada')
    .setDescription('Gestiona la temporada')
    .addSubcommand(sub =>
      sub
        .setName('comenzar')
        .setDescription('Comienza una nueva temporada')
        .addStringOption(opt =>
          opt.setName('nombre')
            .setDescription('Nombre de la temporada')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('finalizar')
        .setDescription('Cuidado con este comando')
    )
    
    .addSubcommand(sub =>
      sub
        .setName('prueba')
        .setDescription('Cuidado con este comando')
    )
    .addSubcommand(sub =>
      sub
        .setName('prueba2')
        .setDescription('Cuidado con este comando')
    ),

  async execute(interaction, client) {
    const subcomand = interaction.options.getSubcommand()

    try {
      if (subcomand === 'comenzar') {
        const name = interaction.options.getString('nombre')
        const season = await startSeason({ name, client })
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `Temporada ** ${season.name}** comenzada.` })]
        })
        await sendLog({
          content: `Temporada **${season.name}** comenzada.`,
          client: interaction.client,
          type: 'success',
          userId: interaction.user.id,
          eventType: 'season'
        })
      }

      else if (subcomand === 'finalizar') {
        const season = await endSeason({ client })
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `Temporada **${season.name}** terminada.` })]
        })
        await sendLog({
          content: `Temporada **${season.name}** terminada.`,
          client: interaction.client,
          type: 'danger',
          userId: interaction.user.id,
          eventType: 'season'
        })
      } else if (subcomand === 'prueba') {
const Match = require('../../models/Match');


// Actualizar todos los sets con mapa antiguo a nuevo nombre
    const match = await Match.findById('68ed505976372519b88c5e9e')
        match.status = 'onGoing'
        match.sets[match.sets.length - 1].winner = null
        match.sets[match.sets.length - 1].starPlayerId = null
        console.log('a')
        await match.save()

} else if (subcomand === 'prueba2') {
  try {
    // Importa los modelos arriba si no lo has hecho ya
    const Match = require('../../models/Match')
    const Team = require('../../models/Team')
    const User = require('../../models/User')
    const Season = require('../../models/Season')

    const deleted = await Promise.allSettled([
      Match.deleteMany({}),
User.deleteMany({
  $or: [
    { brawlId: null },
    { brawlId: { $exists: false } },
    { brawlId: '' },
    { brawlId: 'undefined' },
    { brawlId: 'null' }
  ]
}),
      Season.deleteMany({})
    ])

    console.log('[prueba2] Resultados de borrado:')
    for (const [i, res] of deleted.entries()) {
      const name = ['Match', 'Team', 'User', 'Season'][i]
      if (res.status === 'fulfilled') {
        console.log(` - ${name}: borrado correcto`)
      } else {
        console.error(` - ${name}: error`, res.reason)
      }
    }

    await interaction.reply({
      content: '🧨 Todos los documentos de **Match**, **Team**, **User** y **Season** han sido eliminados.',
      ephemeral: true
    })

  } catch (err) {
    console.error('[prueba2] Error al borrar colecciones:', err)
    await interaction.reply({
      content: '❌ Error al eliminar las colecciones. Revisa la consola.',
      ephemeral: true
    })
  }
}
    } catch (error) {
      console.error(error)
      await interaction.reply({
          embeds: [getErrorEmbed({ error: error.message })]
      })
    }
  }
}