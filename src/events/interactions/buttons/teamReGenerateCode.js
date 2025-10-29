const { updateTeamCode, checkTeamUserHasPerms } = require('../../../services/team.js')

const { getTeamInfoEmbed, getAddMemberInfoEmbed } = require('../../../discord/embeds/team.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { sendLog } = require('../../../discord/send/staff.js')

module.exports = {
  customId: 'teamReGenerateCode',

  async execute(interaction) {
    try {
        const discordId = interaction.user.id
        const currentEmbed = interaction.message.embeds[0]
        const perms = await checkTeamUserHasPerms({ discordId })

        if (!perms) {
            return interaction.reply({
                ephemeral: true,
                embeds: [getErrorEmbed({ error: 'No tienes permisos para utilizar esta interaccion.' })]
            })
        }

      const team = await updateTeamCode({ discordId: interaction.user.id })

      await sendLog({
        content: `Regeneró el código de invitación del equipo.`,
        client: interaction.client,
        type: 'info',
        userId: discordId,
        eventType: 'team'
      })

      if (currentEmbed.fields.length === 0) {
        await interaction.update({
          content: 'Equipo actualizado con exito.',
          embeds: [getAddMemberInfoEmbed({ teamCode: team.code })]
        })
      } else {
        await interaction.update({
        content: 'Equipo actualizado con exito.',
        embeds: [getTeamInfoEmbed({ perms, team })]
      })
      }


      return interaction.followUp({
        ephemeral: true,
        embeds: [getSuccesEmbed({ message: `Nuevo codigo del equipo: \`${team.code}\``})]
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