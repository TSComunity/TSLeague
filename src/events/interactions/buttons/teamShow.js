const { ActionRowBuilder } = require('discord.js')

const { checkUserIsVerified } = require('../../../services/user.js')
const { checkTeamUserHasPerms } = require('../../../services/team.js')
const { findTeam } = require('../../../utils/team.js')

const { getUserVerifyModal } = require('../../../discord/modals/user.js')
const { getUserBrawlIdInput } = require('../../../discord/inputs/user.js')

const { getTeamInfoEmbed } = require('../../../discord/embeds/team.js')
const { getErrorEmbed } = require('../../../discord/embeds/management.js')

const {
    getTeamLeftButton,
    getTeamChangeNameButton,
    getTeamChangeIconButton,
    getTeamChangeColorButton,
    getTeamManageMembersButton,
    getTeamReGenerateCodeButton
} = require('../../../discord/buttons/team.js')

module.exports = {
  customId: 'teamShow',

  async execute(interaction) {
    try {
        const isVerified = await checkUserIsVerified({ discordId: interaction.user.id })

        if (!isVerified) {
            const modal = getUserVerifyModal()

            const modalRow = new ActionRowBuilder().addComponents(getUserBrawlIdInput())
            modal.addComponents(modalRow)

            return interaction.showModal(modal)
        }

        const discordId = interaction.user.id
        const team = await findTeam({ discordId })
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

        return interaction.reply({
            ephemeral: true,
            embeds: [getTeamInfoEmbed({ team, perms })],
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