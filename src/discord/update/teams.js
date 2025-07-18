const {
  ContainerBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SectionBuilder,
  SeparatorBuilder,
  MessageFlags
} = require('discord.js')

const Division = require('../../Esquemas/Division.js')
const Team = require('../../Esquemas/Team.js')
const config = require('../../configs/league.js')

const maxTeams = config.division.maxTeams

const updateTeamsEmbed = async ({ client }) => {
  const channel = await client.channels.fetch('1375108833558397053')
  if (!channel || !channel.isTextBased()) throw new Error('Canal no encontrado o no es de texto.')

  // 📨 Obtener mensajes del bot (orden cronológico ascendente)
  const fetchedMessages = await channel.messages.fetch({ limit: 100 })
  const botMessages = fetchedMessages
    .filter(msg => msg.author.id === client.user.id)
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)

  const messagesArray = Array.from(botMessages.values())
  const divisions = await Division.find().sort({ tier: 1 }).exec()
  const expectedMessages = divisions.length

  // ❌ Si hay MENOS mensajes de los necesarios
  if (messagesArray.length < expectedMessages) {
    // 🔥 Eliminar todos los mensajes del bot
    for (const msg of messagesArray) {
      await msg.delete().catch(() => {})
    }

    // 🟢 Reenviar todos los embeds desde cero
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
        const { name, iconURL, members } = team
        const thumbnailComponent = new ThumbnailBuilder({ media: { url: iconURL } })
        const sectionComponent = new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(name)
          )
          .addThumbnailComponents(thumbnailComponent)

        container
          .addSeparatorComponents(new SeparatorBuilder())
          .addSectionComponents(sectionComponent)
      }

      await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      })
    }

    return
  }

  // ✅ Editar mensajes existentes
  for (let i = 0; i < divisions.length; i++) {
    const division = divisions[i]
    const msg = messagesArray[i]
    if (!msg) continue

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
      const { name, iconURL } = team
      const thumbnailComponent = new ThumbnailBuilder({ media: { url: iconURL } })
      const sectionComponent = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(name)
        )
        .addThumbnailComponents(thumbnailComponent)

      container
        .addSeparatorComponents(new SeparatorBuilder())
        .addSectionComponents(sectionComponent)
    }

    await msg.edit({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    })
  }

  // ✂️ Eliminar mensajes sobrantes
  if (messagesArray.length > expectedMessages) {
    for (let i = expectedMessages; i < messagesArray.length; i++) {
      const msg = messagesArray[i]
      await msg.delete().catch(() => {})
    }
  }
}

module.exports = { updateTeamsEmbed }