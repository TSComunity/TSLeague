const { SlashCommandBuilder } = require('discord.js')
const { startSeason, endSeason } = require('../../services/season.js')
const { getLastSeason } = require('../../utils/season.js')
const { addRound } = require('../../services/round.js')
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
      if (subcomand === 'empezar') {
        const name = interaction.options.getString('nombre')
        const season = await startSeason({ name, client })
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `Temporada ** ${season.name}** comenzada.` })]
        })
      }

      else if (subcomand === 'terminar') {
        const season = await endSeason({ client })
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `Temporada **${season.name}** terminada.` })]
        })
      } else if (subcomand === 'prueba') {
        const season = await getLastSeason()
const summary = {
  name: season.name,
  status: season.status,
  divisions: season.divisions.map((div) => ({
    status: div.status,
    rounds: div.rounds.map((round) => ({
      roundIndex: round.roundIndex,
      matches: round.matches.map((m) => m.matchId?.toString() ?? 'N/A'),
      resting: round.resting.map((r) => r.teamId?.toString() ?? 'N/A')
    }))
  }))
}

interaction.reply({
  content: `\`\`\`json\n${JSON.stringify(summary, null, 2).slice(0, 1900)}\n\`\`\``
})

      } else if (subcomand === 'prueba2') {
        await addRound({ client })
        interaction.reply({
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