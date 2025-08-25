const {
  ActionRowBuilder
} = require('discord.js')

const { getMatchSelectHourMenu } = require('../../../discord/menus/match.js')
const { getMatchCancelInteractionButton } = require('../../../discord/buttons/match.js')

const { getErrorEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  condition: (id) => id.startsWith('matchSelectDayMenu'),

  async execute(interaction) {
    try {
      const splittedId = interaction.customId.split(':')
      const matchIndex = splittedId[1]
      const day = interaction.values[0]

      const getDay = (day) => {
        if (day === '1') return 'Lunes'
        if (day === '2') return 'Martes'
        if (day === '3') return 'Miércoles'
        if (day === '4') return 'Jueves'
        if (day === '5') return 'Viernes'
        if (day === '6') return 'Sábado'
        if (day === '0') return 'Domingo'
        return null
      }

      const row = new ActionRowBuilder().addComponents(getMatchSelectHourMenu({ matchIndex, day }))
      const row2 = new ActionRowBuilder().addComponents(getMatchCancelInteractionButton())
      await interaction.update({
        ephemeral: true,
        content: `### Propuesta de cambio de horario\n> Día: ${getDay(day)}\n> Hora:`,
        components: [row, row2]
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