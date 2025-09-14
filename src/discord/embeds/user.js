const { EmbedBuilder } = require("discord.js")
const emojis = require("../../configs/emojis.json")
const configs = require('../../configs/league.js')

async function getUserStatsEmbed({ client, user, data, isFreeAgent = false }) {
  const discordUser = await client.users.fetch(user.discordId).catch(() => null)

  // Stats de liga (defensivo por si faltan campos)
  const matchesWon = Number(user.leagueStats?.matchesWon || 0)
  const matchesLost = Number(user.leagueStats?.matchesLost || 0)
  const matchesPlayed = matchesWon + matchesLost
  const matchesWinrate = matchesPlayed > 0 ? ((matchesWon / matchesPlayed) * 100).toFixed(1) : 0
  const matchesLoserate = matchesPlayed > 0 ? ((matchesLost / matchesPlayed) * 100).toFixed(1) : 0

  const setsWon = Number(user.leagueStats?.setsWon || 0)
  const setsLost = Number(user.leagueStats?.setsLost || 0)
  const setsPlayed = setsWon + setsLost
  const setsWinrate = setsPlayed > 0 ? ((setsWon / setsPlayed) * 100).toFixed(1) : 0
  const setsLoserate = setsPlayed > 0 ? ((setsLost / setsPlayed) * 100).toFixed(1) : 0

  // Color seguro
  const rawColor = String(data?.nameColor || "")
  const hex = rawColor.replace(/^#|0x/, "")
  const color = (/^[0-9A-Fa-f]{6}$/.test(hex) ? parseInt(hex, 16) : "Blue")

  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: `${data?.name || "Jugador"} (${data?.tag || "?"})`,
      iconURL: `https://cdn.brawlify.com/icon/${data?.icon?.id || "28000047"}.png`
    })
    .setThumbnail(discordUser?.avatarURL?.() || `https://cdn.brawlify.com/icon/${data?.icon?.id || "28000047"}.png`)

  // Descripción garantizada (nunca vacía)
  const memberEmoji = emojis?.member || "👤"
  const freeAgentText = isFreeAgent
    ? ` — Agente Libre\n> Utiliza el botón **Buscar Equipo** de <#${configs?.channels?.freeAgents?.id || "0"}> para gestionar el estado de Agente Libre.`
    : ""
  const description = `### ${memberEmoji} <@${user.discordId}>${freeAgentText}`.trim() || "\u200B"
  embed.setDescription(description)

  // Campos defensivos: asegurar strings no vacíos
  const safe = v => (v === undefined || v === null || String(v) === "") ? "\u200B" : String(v)

  embed.addFields(
    { name: "Partidos Jugados", value: safe(`${emojis?.match || ""} \`${matchesPlayed}\``), inline: true },
    { name: "Partidos Ganados", value: safe(`\`${matchesWon} ( ${matchesWinrate}% )\``), inline: true },
    { name: "Partidos Perdidos", value: safe(`\`${matchesLost} ( ${matchesLoserate}% )\``), inline: true },
    { name: "Sets Jugados", value: safe(`${emojis?.match || ""} \`${setsPlayed}\``), inline: true },
    { name: "Sets Ganados", value: safe(`\`${setsWon} ( ${setsWinrate}% )\``), inline: true },
    { name: "Sets Perdidos", value: safe(`\`${setsLost} ( ${setsLoserate}% )\``), inline: true },
    { name: "Jugador Estelar", value: safe(`\`${user.leagueStats?.starPlayerCount || 0}\``), inline: true },
    { name: "Trofeos", value: safe(`${emojis?.trophies || ""} ${data?.trophies || "No disponible"}`), inline: true },
    { name: "Club", value: safe(`${emojis?.club || ""} ${data?.club?.name || "Sin club"}`), inline: true }
  )

  if (isFreeAgent) embed.setTimestamp()

  return embed
}

module.exports = { getUserStatsEmbed }