const {
ActionRowBuilder
} = require('discord.js')
const User = require('../../../Esquemas/User.js')
const { getUserBrawlData } = require('../../../utils/user.js')
const { getUserStatsEmbed } = require('../../../discord/embeds/user.js')
const { getErrorEmbed } = require('../../../discord/embeds/management.js')

module.exports = {
condition: (id) => id.startsWith('teamStatsMenu'),

async execute(interaction) {
    try {
    const discordId = interaction.values[0]
    const user = await User.findOne({ discordId })
    if (!user) throw new Error('No se encontro el usuario.')

    const data = await getUserBrawlData({ brawlId: user.brawlId })

    await interaction.reply({
        ephemeral: true,
        embeds: [getUserStatsEmbed({ client: interaction.client, user, data })]
    })

    } catch (error) {
    console.error(error);
    return interaction.reply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: error.message })]
    })
    }
}
}