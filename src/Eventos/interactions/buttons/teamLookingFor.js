const { ActionRowBuilder } = require('discord.js')

const { checkUserIsVerified } = require('../../../services/user.js')
const { findTeam } = require('../../../utils/team.js')
const { toggleFreeAgent } = require('../../../services/team.js')

const { getUserVerifyModal } = require('../../../discord/modals/user.js')
const { getUserBrawlIdInput } = require('../../../discord/inputs/user.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')

const emojis = require('../../../configs/emojis.json')

// Cooldown Map
const cooldowns = new Map()

module.exports = {
    customId: 'teamLookingFor',

    async execute(interaction) {
        try {
            const discordId = interaction.user.id

            // Cooldown: 30 segundos
            const now = Date.now()
            const cooldownAmount = 30 * 1000
            if (cooldowns.has(discordId)) {
                const expirationTime = cooldowns.get(discordId) + cooldownAmount
                if (now < expirationTime) {
                    const remaining = Math.ceil((expirationTime - now) / 1000)
                    return interaction.reply({
                        ephemeral: true,
                        content: `${emojis.schedule} Debes esperar ${remaining} segundos antes de volver a usar esta interacción.`
                    })
                }
            }

            cooldowns.set(discordId, now)

            // Verificar usuario
            const isVerified = await checkUserIsVerified({ discordId })
            if (!isVerified) {
                const modal = getUserVerifyModal()
                const modalRow = new ActionRowBuilder().addComponents(getUserBrawlIdInput())
                modal.addComponents(modalRow)
                return interaction.showModal(modal)
            }

            // Verificar si tiene equipo
            const team = await findTeam({ discordId })
            if (team) {
                return interaction.reply({
                    ephemeral: true,
                    content: '❌ No puedes usar esta opción porque ya estás en un equipo.'
                })
            }

            // Toggle free agent
            const newStatus = await toggleFreeAgent({ discordId })
            const statusText = newStatus
                ? `Se ha activado tu estado de jugador libre (free agent), se ha enviado un mensaje a <#${configs.channels.freeAgents.id}> con información actualizada cada 15 minutos de tu perfil de Brawl Stars.`
                : `Se ha desactivado tu estado de jugador libre (free agent), tu mensaje buscando equipo de <@${configs.channels.freeAgents.id}> ha sido eliminado.`

            return interaction.reply({
                ephemeral: true,
                embeds: [getSuccesEmbed({ message: statusText })]
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
