const { ActionRowBuilder } = require('discord.js')

const { changeMemberRole, checkTeamUserHasPerms } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getTeamInfoEmbed } = require('../../../discord/embeds/team.js')

const {
    getTeamLeftButton,
    getTeamChangeNameButton,
    getTeamChangeIconButton,
    getTeamChangeColorButton,
    getTeamManageMembersButton,
    getTeamReGenerateCodeButton
} = require('../../../discord/buttons/team.js')

module.exports = {
  condition: (id) => id.startsWith('teamChangeMemberRoleTo'),

  async execute(interaction) {
    try {
      const splittedId = interaction.customId.split('_')
      const discordId = splittedId[2]
      const newRole = splittedId[1]

      let rol = ''
      if (newRole === 'leader') rol = '<:leader:1394257429373390878> Líder'
      if (newRole === 'sub-leader') rol = '<subleader:1394257347861286933> Sublíder'
      if (newRole === 'member') rol = '<:member:1394257533094461533> Miembro'


      const perms = await checkTeamUserHasPerms({ discordId: interaction.user.id })

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
      

      const team = await changeMemberRole({ discordId, newRole })

      await interaction.update({
        embeds: [getTeamInfoEmbed({ team })],
        components
      })

      await interaction.followUp({
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