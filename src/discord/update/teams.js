const {
    ContainerBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder,
    SectionBuilder,
    SeparatorBuilder
} = require('discord.js')

const Division = require('../../Esquemas/Division.js')
const Team = require('../../Esquemas/Team.js')

const config = require('../../configs/league.js')
const maxTeams = config.division.maxTeams

const updateTeamsEmbed = async () => {
    const channel = await client.channels.fetch('ID_DEL_CANAL_CLASIFICACIONES')
    if (!channel || !channel.isTextBased()) throw new Error('Canal no encontrado o no es de texto.')

    const message = await channel.messages.fetch('ID_MENSAJE_1')
    if (!message) throw new Error('Mensaje no encontrado.')

    const divisions = await Division.find().sort({ tier: 1 }).exec()
    const components = []

    for (const division of divisions) {
        const teams = await Team.find({ divisionId: division._id })
            .populate('members.userId')
            .sort({ name: 1 })
            .exec()

        const container = new ContainerBuilder()
            .setAccentColor(0x1bfc62)
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`### 🏆 División ${division.name || 'Sin nombre'} — ${teams.length}/${maxTeams}`)
            )

        for (const team of teams) {
            const { name, iconURL, color, members } = team
            const mappedMembers = members.map(m => `<@${m.userId.discordId}>`).join(', ') || 'Sin miembros'

            const thumbnailComponent = new ThumbnailBuilder({
                media: {
                    url: iconURL
                }
            })

            const sectionComponent = new SectionBuilder()
                .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(name)
                )
                .addThumbnailComponents(thumbnailComponent)


            container
                .addSeparatorComponents(new SeparatorBuilder())
                .addsectionComponents(sectionComponent)
        }

        components.push(container)
    }

    await message.edit({
        components,
        flags: MessageFlags.IsComponentsV2
    })
}

module.exports = { updateTeamsEmbed }