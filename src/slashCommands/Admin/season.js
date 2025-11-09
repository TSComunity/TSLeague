const { SlashCommandBuilder } = require('discord.js')
const { startSeason, endSeason } = require('../../services/season.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../discord/embeds/management.js')
const { sendLog } = require('../../discord/send/staff.js')
const Season = require('../../models/Season.js') // Asegúrate de tener este modelo importado

module.exports = {
  data: new SlashCommandBuilder()
    .setName('temporada')
    .setDescription('Gestiona la temporada')
    .addSubcommand(sub =>
      sub
        .setName('comenzar')
        .setDescription('Comienza una nueva temporada')
        .addStringOption(opt =>
          opt
            .setName('nombre')
            .setDescription('Nombre de la temporada')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('finalizar')
        .setDescription('Finaliza la temporada actual')
    )
    .addSubcommand(sub =>
      sub
        .setName('solve')
        .setDescription('⚠️ Elimina TODAS las temporadas (uso de emergencia)')
    ),

  async execute(interaction, client) {
    const subcomand = interaction.options.getSubcommand()

    try {
      if (subcomand === 'comenzar') {
        const name = interaction.options.getString('nombre')
        const season = await startSeason({ name, client })

        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `Temporada **${season.name}** comenzada.` })],
        })

        await sendLog({
          content: `Temporada **${season.name}** comenzada.`,
          client: interaction.client,
          type: 'success',
          userId: interaction.user.id,
          eventType: 'season',
        })
      }

      else if (subcomand === 'finalizar') {
        const season = await endSeason({ client })

        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `Temporada **${season.name}** terminada.` })],
        })

        await sendLog({
          content: `Temporada **${season.name}** terminada.`,
          client: interaction.client,
          type: 'danger',
          userId: interaction.user.id,
          eventType: 'season',
        })
      }

      else if (subcomand === 'solve') {
        // ID autorizado — cámbialo por el tuyo
        const OWNER_ID = '838441772794511411' 

        if (interaction.user.id !== OWNER_ID) {
          await interaction.reply({
            embeds: [getErrorEmbed({ error: '🚪 Get out. No tienes permiso para usar este comando.' })],
            ephemeral: true
          })
          return
        }
        const deleted = await Season.deleteMany({})
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `✅ Se eliminaron **${deleted.deletedCount}** temporadas.` })],
          ephemeral: true,
        })
      }

    } catch (error) {
      console.error(error)
      await interaction.reply({
        embeds: [getErrorEmbed({ error: error.message })],
        ephemeral: true,
      })
    }
  },
}