const { ActionRowBuilder } = require('discord.js')
const User = require('../../../Esquemas/User.js')

const { checkUserIsVerified } = require('../../../services/user.js')
const { toggleFreeAgent } = require('../../../services/user.js')

const { getUserVerifyModal } = require('../../../discord/modals/user.js')
const { getUserBrawlIdInput } = require('../../../discord/inputs/user.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')

const configs = require('../../../configs/league.js')
const emojis = require('../../../configs/emojis.json')

// Cooldown Map
const cooldowns = new Map()

module.exports = {
    customId: 'teamLookingFor',

    async execute(interaction, client) {
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
            const hasTeam = await User.findOne({ discordId })?.teamId
            if (hasTeam) {
                return interaction.reply({
                    ephemeral: true,
                    content: '❌ No puedes usar esta opción porque ya perteneces a un equipo.'
                })
            }

            // Toggle agente libre
            const newStatus = await toggleFreeAgent({ client, discordId })
            const statusText = newStatus.isFreeAgent
                ? `Se ha activado tu estado de agente libre, se ha enviado un mensaje a <#${configs.channels.freeAgents.id}> con información actualizada cada 15 minutos de tu perfil de Brawl Stars.`
                : `Se ha desactivado tu estado de agente libre), tu mensaje buscando equipo de <#${configs.channels.freeAgents.id}> ha sido eliminado.`

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