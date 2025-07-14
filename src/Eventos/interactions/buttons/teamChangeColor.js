const { ActionRowBuilder } = require('discord.js')

const { checkTeamUserHasPerms } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getTeamChangeColorMenu } = require('../../../discord/menus/team.js')

module.exports = {
  customId: 'teamChangeColor',

  async execute(interaction) {
    try {
        const discordId = interaction.user.id
        const perms = await checkTeamUserHasPerms({ discordId })

        if (!perms) {
            return interaction.reply({
                ephemeral: true,
                embeds: [getErrorEmbed({ error: 'No tienes permisos para utilizar esta interaccion.' })]
            })
        }

        const row = new ActionRowBuilder().addComponents(getTeamChangeColorMenu())

        const team = await removeMemberFromTeam({ discordId })

        return interaction.reply({
                ephemeral: true,
                components: [row],
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