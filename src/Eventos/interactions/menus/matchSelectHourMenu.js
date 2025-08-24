const {
  ActionRowBuilder
} = require('discord.js')

const { getMatchSelectMinutesMenu } = require('../../../discord/menus/match.js')

const { getErrorEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  condition: (id) => id.startsWith('teamSelectHourMenu'),


  async execute(interaction) {
    try {
      const splittedId = interaction.customId.split(':')
      const matchIndex = splittedId[1]
      const day = splittedId[2]
      const hour = interaction.values[0]

      const row = new ActionRowBuilder().addComponents(getMatchSelectMinuteMenu({ matchIndex, day, hour }))

      await interaction.update({
        ephemeral: true,
        content: 'Selecciona minutos para el partido.',
        components: [row]
      })

    } catch (error) {
      console.error(error);
      return interaction.reply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: error.message })]
      })
    }
  }
}