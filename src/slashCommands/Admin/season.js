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
        const Team = require('../../models/Team.js')
        await Team.deleteOne({ name: 'añas'})

interaction.reply({
  content: `a`
})
      } else if (subcomand === 'prueba2') {
        await addRound({ client })
        await interaction.reply({
          content: 'a'
        })
      }
    } catch (error) {
      console.error(error)
      await interaction.reply({
          embeds: [getErrorEmbed({ error: error.message })]
      })
    }
  }
}