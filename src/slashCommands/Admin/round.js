const { SlashCommandBuilder } = require('discord.js')
const { skipRound } = require('../../services/round.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../discord/embeds/management.js')
const { sendLog } = require('../../discord/send/staff.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jornada')
    .setDescription('Gestiona las jornadas')
    .addSubcommand(sub =>
      sub
        .setName('saltar')
        .setDescription('Salta la jornada actual y programa la siguiente para 7 días después')
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand()

    try {
      if (subcommand === 'saltar') {
        const result = await skipRound()

        const dateString = new Date(result.newScheduledDate).toLocaleString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        })

        await interaction.reply({
          embeds: [getSuccesEmbed({ 
            message: `Jornada **${result.skippedRound}** saltada. Nueva fecha: ${dateString}`
          })]
        })

        await sendLog({
          content: `Jornada **${result.skippedRound}** saltada. Nueva fecha: ${dateString}`,
          client: interaction.client,
          type: 'success',
          userId: interaction.user.id,
          eventType: 'round'
        })
      }
    } catch (err) {
      console.error(err)
      await interaction.reply({ 
        embeds: [getErrorEmbed({ error: err.message })], 
        ephemeral: true 
      })
    }
  }
}