const { EmbedBuilder } = require("discord.js")
const emojis = require("../../configs/emojis.json")
const configs = require('../../configs/league.js')

async function getUserStatsEmbed({ client, user, data, isFreeAgent = false }) {
  const discordUser = await client.users.fetch(user.discordId).catch(() => null)

  // 🔹 Stats de liga
  const matchesPlayed = user.leagueStats.matchesWon + user.leagueStats.matchesLost
  const matchesWinrate = matchesPlayed > 0
    ? ((user.leagueStats.matchesWon / matchesPlayed) * 100).toFixed(1)
    : 0
  const matchesLoserate = matchesPlayed > 0
    ? ((user.leagueStats.matchesLost / matchesPlayed) * 100).toFixed(1)
    : 0

  const setsPlayed = user.leagueStats.setsWon + user.leagueStats.setsLost
  const setsWinrate = setsPlayed > 0
    ? ((user.leagueStats.setsWon / setsPlayed) * 100).toFixed(1)
    : 0
  const setsLoserate = setsPlayed > 0
    ? ((user.leagueStats.setsLost / setsPlayed) * 100).toFixed(1)
    : 0

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
        name: "Partidos Jugados",
        value: `${emojis.match} \`${matchesPlayed}\``,
        inline: true
      },
      {
        name: "Partidos Ganados",
        value: `\`${user.leagueStats.matchesWon} ( ${matchesWinrate}% )\``,
        inline: true
      },
      {
        name: "Partidos Perdidos",
        value: `\`${user.leagueStats.matchesLost} ( ${matchesLoserate}% )\``,
        inline: true
      },
      {
        name: "Sets Jugados",
        value: `${emojis.match} \`${setsPlayed}\``,
        inline: true
      },
      {
        name: "Sets Ganados",
        value: `\`${user.leagueStats.setsWon} ( ${setsWinrate}% )\``,
        inline: true
      },
      {
        name: "Sets Perdidos",
        value: `\`${user.leagueStats.setsLost} ( ${setsLoserate}% )\``,
        inline: true
      },
      {
        name: "Jugador Estelar",
        value: `\`${user.leagueStats.starPlayerCount}\``,
        inline: true
      },
      {
        name: `Trofeos`,
        value: `${emojis.trophies} ${data?.trophies || "No disponible"}`,
        inline: true
      },
      {
        name: `Club`,
        value: `${emojis.club} ${data?.club?.name || "Sin club"}`,
        inline: true
      },
      // 🔹 Aquí podrías añadir stats de Brawl (copas totales, promedio, etc.) usando el array `data`
    )
}

module.exports = { getUserStatsEmbed }