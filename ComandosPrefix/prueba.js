const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "prueba",
  aliases: [],
  args: false,
  run: async (message, client, args) => {
    const playerTag = "#2CRPQC9V";
    const encodedTag = encodeURIComponent(playerTag);
    const url = `https://api.brawlstars.com/v1/players/${encodedTag}/battlelog`;

    try {
      const applicationEmojis = await client.application.emojis.fetch();

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${process.env.APITOKEN}` },
      });

      const parseBattleTime = (raw) => {
        const iso = raw.replace(
          /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.000Z$/,
          "$1-$2-$3T$4:$5:$6.000Z"
        );
        const date = new Date(iso);
        return date.toLocaleString("es-ES", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "UTC",
        });
      };

      const emojiMap = {
        gemGrab: "<:atrapagemas:1375082350605766879>",
        knockout: "<:noqueo:1375082367869517867>",
        bounty: "<:caza:1375082403944730694>",
        heist: "<:atraco:1375082426367348767>",
        brawlBall: "<:balon:1375082446235762688>",
      };

      const modeTranslations = {
        brawlBall: "Balón Brawl",
        gemGrab: "Atrapagemas",
        showdown: "Supervivencia",
        duoShowdown: "Supervivencia Dúo",
        heist: "Atraco",
        bounty: "Caza Estelar",
        siege: "Asedio",
        hotZone: "Zona Restringida",
        knockout: "Noqueo",
        duels: "Duelo",
        wipeout: "Barrido",
        bossFight: "Lucha contra el Jefe",
        roboRumble: "Asalto al Robot",
        bigGame: "Gran Juego",
        volleyBrawl: "Brawl Voleibol",
        trophyThieves: "Ladrones de Trofeos",
        payload: "Carga",
        hunters: "Cazadores",
        wipeout_v2: "Barrido 2.0"
      };

      const friendlyBattles = response.data.items.filter(
        (item) => item.battle?.type === "friendly"
      );

      if (friendlyBattles.length === 0) {
        return message.channel.send("❌ No se encontraron partidas amistosas recientes.");
      }

      const battle = friendlyBattles[0];
      const time = parseBattleTime(battle.battleTime);
      const rawMode = battle.event?.mode || "Desconocido";
      const translatedMode = modeTranslations[rawMode] || rawMode;
      const modeEmoji = emojiMap[rawMode] || "📜";
      const mapName = battle.event?.map || "Mapa desconocido";

      let modeColor = "#0099ff";
      try {
        const modesRes = await axios.get("https://api.brawlify.com/v1/gamemodes");
        const mode = modesRes.data.find((m) => m.hash.toLowerCase() === rawMode.toLowerCase());
        if (mode && mode.color) modeColor = mode.color;
      } catch {
        // default color
      }

      let mapImageUrl = null;
      if (battle.event?.id) {
        try {
          const mapResponse = await axios.get(
            `https://api.brawlify.com/v1/maps/${battle.event.id}`
          );
          mapImageUrl = mapResponse.data.imageUrl || null;
        } catch {
          mapImageUrl = null;
        }
      }

      const starPlayerTag = battle.battle.starPlayer?.tag;
      const winningTeamIndex = battle.battle.result === "victory" ? 0 : 1;

      let teamsText = "";
      if (battle.battle.teams && battle.battle.teams.length) {
        battle.battle.teams.forEach((team, idx) => {
          const isWinner = idx === winningTeamIndex;
          const trophy = isWinner ? " 🏆" : "";
          teamsText += `**Equipo ${idx + 1}${trophy}:**\n`;

          team.forEach((player) => {
            const baseName = player.name || "Jugador desconocido";
            const brawlerId = player.brawler?.id;
            let emojiText = ":question:";

            if (brawlerId) {
              const emoji = applicationEmojis.find(
                (e) => e.name === brawlerId.toString()
              );
              if (emoji) {
                emojiText = emoji.animated
                  ? `<a:${emoji.name}:${emoji.id}>`
                  : `<:${emoji.name}:${emoji.id}>`;
              }
            }

            const isStar = starPlayerTag && player.tag === starPlayerTag;
            const playerDisplay = isStar ? `**${baseName}** ⭐` : baseName;

            teamsText += `- ${emojiText} ${playerDisplay}\n`;
          });
        });
      }

      const embed = new EmbedBuilder()
        .setDescription(`## ${modeEmoji} ${translatedMode}`)
        .setColor(modeColor)
        .addFields({
          name: `🕒 ${time}`,
          value: `🗺️ Mapa: **${mapName}**\n\n${teamsText}`,
        });

      if (mapImageUrl) embed.setImage(mapImageUrl);

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(
        "Error al obtener el battlelog o los emojis:",
        error.response?.data || error.message
      );
      await message.channel.send(
        "❌ No se pudo obtener el registro de partidas o los emojis. Verifica el tag, el token y que los emojis estén subidos correctamente a tu aplicación."
      );
    }
  },
};