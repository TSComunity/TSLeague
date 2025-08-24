const { ActionRowBuilder } = require('discord.js')

const Match = require('../../../Esquemas/Match.js')

const { checkTeamUserIsLeader } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getMatchSelectDayMenu } = require('../../../discord/menus/match.js')

module.exports = {
  condition: (id) => id.startsWith('teamChangeSchedule'),

  async execute(interaction) {
    try {
      
        const perms = await checkTeamUserIsLeader({ discordId: interaction.user.id })

        if (!perms) {
            return interaction.reply({
                ephemeral: true,
                embeds: [getErrorEmbed({ error: 'Solo los líderes de los equipos pueden utilizar esta interacción.' })]
            })
        }

        const splittedId = interaction.customId.split(':')
        const matchIndex = splittedId[1]

        const match = await Match.findOne({ matchIndex })
        if (!match) {
            throw new Error('No se ha encontrado el partido-')
        }

        await interaction.reply({
          ephemeral: true,
          content: 'Selecciona un día para el partido.',
          components: [new ActionRowBuilder().addComponents(getMatchSelectDayMenu({ matchIndex: match.matchIndex}))],
        })
    } catch (error) {
      console.error(error)
      return interaction.reply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: error.message })]
      })
    }
  }
}