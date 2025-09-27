const { EmbedBuilder } = require("discord.js")
const configs = require("../../configs/league.js")

async function sendTeamAnnouncement({ client, team, content = 'No se ha recibido ningun contenido.' }) {
  try {
    const channel = await client.channels.fetch(team.channelId)
    if (!channel) return

    const embed = new EmbedBuilder()
      .setDescription(content)
      .setColor(team.color || 'Blue')
      .setThumbnail(team.iconURL)

    await channel.send({
      content: `<@&${configs.roles.ping.id}>`,
      embeds: [embed],
    })

  } catch (error) {
    console.error('Error sending team announcement:', error)
  }
}

module.exports = { sendTeamAnnouncement }