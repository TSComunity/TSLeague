const {
  ActionRowBuilder
} = require('discord.js')

const { getMatchSelectHourMenu } = require('../../../discord/menus/match.js')

const { getErrorEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  condition: (id) => id.startsWith('teamSelectDayMenu'),


  async execute(interaction) {
    try {
      const splittedId = interaction.customId.split(':')
      const matchIndex = splittedId[1]
      const day = interaction.values[0]

      const row = new ActionRowBuilder().addComponents(getMatchSelectHourMenu({ matchIndex, day }))

      await interaction.update({
        ephemeral: true,
        content: 'Selecciona una hora (horario español) para el partido.',
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