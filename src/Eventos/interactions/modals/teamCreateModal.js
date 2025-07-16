const { ActionRowBuilder } = require('discord.js')

const { createTeam } = require('../../../services/team.js')

const { getErrorEmbed } = require('../../../discord/embeds/management.js')
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
  customId: 'teamCreateModal',

  async execute(interaction, client) {
    try {
      const name = interaction.fields.getTextInputValue('teamNameInput').trim()
      const iconURL = interaction.fields.getTextInputValue('teamIconInput').trim()

      const team = await createTeam({ name, iconURL, presidentDiscordId: interaction.user.id })

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

      return interaction.reply({
        ephemeral: true,
        content: 'Equipo creado con exito.',
        embeds: [getTeamInfoEmbed({ team, perms: true })],
        components
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