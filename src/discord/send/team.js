const { EmbedBuilder } = require("discord.js")
const configs = require("../../configs/league.js")

async function sendTeamAnnouncement({ client, team, content }) {
  try {
    const channel = await client.channels.fetch(team.channelId)
    if (!channel) return

    const embed = new EmbedBuilder()
      .setDescription(content)
      .setColor(team.color || 'Blue')

    await channel.send({
      content: `<@&${configs.roles.ping.id}>`,
      embeds: [embed],
    })

  } catch (error) {
    console.error('Error sending team announcement')
  }
}

module.exports = { sendTeamAnnouncement }