const { EmbedBuilder } = require("discord.js")
const emojis = require("../../configs/emojis.json")
const configs = require('../../configs/league.js')

function getUserBrawlStatsEmbed({ user, data, discordUser, isFreeAgent = false }) {
  if (!isFreeAgent) return

  return new EmbedBuilder()
    .setColor(data?.nameColor?.replace(/^#|0x/, "") ? parseInt(data.nameColor.replace(/^#|0x/, ""), 16) : "Blue")
    .setAuthor({
      name: `${data?.name || "Jugador"} (${data?.tag || "?"})`,
      iconURL: `https://cdn.brawlify.com/icon/${data?.icon?.id || "28000047"}.png`
    })
    .setThumbnail(discordUser?.avatarURL?.() || `https://cdn.brawlify.com/icon/${data?.icon?.id || "28000047"}.png`)
    .setDescription(`### ${emojis.member} <@${user.discordId}>${isFreeAgent ? ` — Agente Libre\n> Utiliza el boton Buscar Equipo de <#${configs.channels.freeAgents.id}> para gestionar el estado de Free Agente.` : ""}`)
    .addFields(
      {
        name: `Trofeos`,
        value: `${emojis.trophies} ${data?.trophies || "No disponible"}`,
        inline: true
      },
      {
        name: `Club`,
        value: `${emojis.club} ${data?.club?.name || "Sin club"}`,
        inline: true
      }
    )
}

module.exports = { getUserBrawlStatsEmbed }