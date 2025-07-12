const { changeMemberRole } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  condition: (id) => id.startsWith('teamChangeMemberRoleTo'),

  async execute(interaction) {
    try {
      const splittedId = interaction.customId.split('_')
      const discordId = splittedId[2]
      const newRole = splittedId[1]

      const team = await changeMemberRole({ discordId, newRole })

      return interaction.reply({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Se ha actualizado el rol de <@${discordId}>.`})]
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