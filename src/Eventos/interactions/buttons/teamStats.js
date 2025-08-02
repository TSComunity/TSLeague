const { ActionRowBuilder } = require('discord.js')

const Team = require('../../../Esquemas/Team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getTeamStatsEmbed } = require('../../../discord/embeds/team.js')

module.exports = {
  condition: (id) => id.startsWith('teamStats'),

  async execute(interaction) {
    try {
        const splittedId = interaction.customId.split('-')
        const teamName = splittedId[1]

        const team = await Team.findOne({ name: teamName })
            .populate('members.userId')
        if (!team) throw new Error('No se ha encontrado el equipo.')

        interaction.reply({
            embeds: [getTeamStatsEmbed]
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