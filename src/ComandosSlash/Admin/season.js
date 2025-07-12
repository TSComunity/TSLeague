const { SlashCommandBuilder } = require('discord.js')
const { startSeason, endSeason } = require('../../services/division.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../discord/embeds/management.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('temporada')
    .setDescription('Gestiona la temporada')
    .addSubcommand(sub =>
      sub
        .setName('empezar')
        .setDescription('Crea una nueva temporada')
        .addStringOption(opt =>
          opt.setName('nombre')
            .setDescription('Nombre de la temporada')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('terminar')
        .setDescription('Cuidado con este comando')
    ),

  async execute(interaction) {
    const subcomand = interaction.options.getSubcommand()

    try {
      if (subcomand === 'empezar') {
        const name = interaction.options.getString('nombre')
        const season = await startSeason({ name })
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `Temporada ${season.seasonIndex} comenzada` })]
        })
      }

      else if (subcomand === 'terminar') {
        const season = await endSeason()
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `Temporada ${season.seasonIndex} terminada` })]
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