const { changeMemberRole } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
  condition: (id) => id.startsWith('teamChangeMemberRoleTo'),

  async execute(interaction) {
    try {
      const splittedId = interaction.customId.split('_')
      const discordId = splittedId[2]
      const newRole = splittedId[1]

      let rol = ''
      if (newRole === 'leader') rol === '👑 Líder'
      if (newRole === 'sub-leader') rol === '⭐ Sublíder'
      if (newRole === 'member') rol === '👤 Miembro'


      const perms = await checkTeamUserHasPerms({ discordId })

      let components = []

      if (perms) {
          components.push(new ActionRowBuilder().addComponents(
              getTeamChangeNameButton(),
              getTeamChangeIconButton(),
              getTeamChangeColorButton(),
              getTeamManageMembersButton(),
              getTeamReGenerateCodeButton()
          ))
      }

      components.push(new ActionRowBuilder().addComponents(
          getTeamLeftButton()
      ))
      

      await changeMemberRole({ discordId, newRole })

      interaction.update({
        components
      })

      return interaction.followUp({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Se ha actualizado el rol de <@${discordId}> ha \`${rol}\`.`})]
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