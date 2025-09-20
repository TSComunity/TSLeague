const { ActionRowBuilder } = require('discord.js')

const { createTeam, checkTeamUserHasPerms } = require('../../../services/team.js')

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
const { sendLog } = require('../../../discord/send/staff.js')

module.exports = {
  customId: 'teamCreateModal',

  async execute(interaction, client) {
    try {
      function isValidURL({ url }) {
        if (!url || typeof url !== 'string') return false

        try {
          const parsed = new URL(url)

          // Verificar protocolo
          if (!['http:', 'https:'].includes(parsed.protocol)) return false

          // Verificar que no tenga espacios
          if (/\s/.test(url)) return false

          // Verificar que tenga hostname
          if (!parsed.hostname) return false

          return true
        } catch {
          return false
        }
      }

      const name = interaction.fields.getTextInputValue('teamNameInput').trim()
      const iconURL = interaction.fields.getTextInputValue('teamIconInput').trim()

      const isValid = isValidURL({ url: iconURL})

      if (!isValid) {
        return interaction.reply({
          ephemeral: true,
          embeds: [getErrorEmbed({ error: `**${iconURL}** no es una URL válida.` })]
        })
      }

      const team = await createTeam({ name, iconURL, presidentDiscordId: interaction.user.id })
      const perms = await checkTeamUserHasPerms({ discordId: interaction.user.id })

      await sendLog({
        content: `El usuario <@${interaction.user.id}> ha creado el equipo **${team.name}** con icono: ${iconURL}`,
        client,
        type: 'success',
        userId: interaction.user.id,
        eventType: 'team'
      })

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