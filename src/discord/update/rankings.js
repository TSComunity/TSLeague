const {
  ContainerBuilder,
  TextDisplayBuilder,
  MediaComponentBuilder,
  ThumbnailBuilder,
  SectionBuilder,
  SeparatorBuilder,
  MessageFlags
} = require('discord.js');

const config = require('../../configs/league.js');

const { getLastSeason } = require('../../services/season.js')
const { getSeasonSummaryEmbed } = require('../embeds/season.js');

const maxTeams = config.division.maxTeams;

const updateRankingsEmbed = async ({ client }) => {
  const isV2 = (msg) =>
    (msg.flags & MessageFlags.IsComponentsV2) === MessageFlags.IsComponentsV2;

  const channel = await client.channels.fetch('1375108833558397053');
  if (!channel || !channel.isTextBased())
    throw new Error('Canal no encontrado o no es de texto.');

  const season = await getLastSeason()
  const { divisions } = season

  const fetchedMessages = await channel.messages.fetch({ limit: 100 });
  const sortedMessages = Array.from(fetchedMessages.values()).sort(
    (a, b) => a.createdTimestamp - b.createdTimestamp
  );
  const botMessages = sortedMessages.filter(
    (msg) => msg.author.id === client.user.id
  );

  const summaryMsg = botMessages.find((msg) => !isV2(msg));
  const divisionMsgs = botMessages.filter((msg) => isV2(msg));

  const expectedMessages = divisions.length;

  // 🟪 Actualiza mensaje de resumen o limpia todo si no existe
  if (!summaryMsg) {
    for (const msg of botMessages) {
      await msg.delete().catch(() => {});
    }
  } else {
    await summaryMsg.edit({
      embeds: [
        getSeasonSummaryEmbed({ season })
      ]
    });
  }

  // 🔁 Si faltan mensajes por divisiones, reinicia todo
  if (divisionMsgs.length < expectedMessages) {
    for (const msg of botMessages) {
      await msg.delete().catch(() => {});
    }

    await channel.send({
      embeds: [
        getSeasonSummaryEmbed({ season })
      ]
    });

    for (const division of divisions) {
    const teams = division.teams
      .sort((a, b) => b.points - a.points) // orden descendente por puntos
      .map((team, index) => ({ ...team, rank: index + 1 })); // asigna ranking


      const container = buildDivisionContainer(division, teams);
      await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    return;
  }

  // 🧩 Editar mensajes existentes por división
  for (let i = 0; i < divisions.length; i++) {
    const division = divisions[i];
    const msg = divisionMsgs[i];
    if (!msg) continue;

    const container = buildDivisionContainer(division, teams);
    await msg.edit({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }

  // ✂️ Eliminar mensajes sobrantes si hay extras
  if (divisionMsgs.length > expectedMessages) {
    for (let i = expectedMessages; i < divisionMsgs.length; i++) {
      await divisionMsgs[i].delete().catch(() => {});
    }
  }
};

// 🧠 Utilidad para construir el embed de una división
function buildDivisionContainer(division, teams) {
  const container = new ContainerBuilder()
    .setAccentColor(parseInt(division.color.replace('#', ''), 16))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## ${division.emoji || '🏆'} División ${division.name || 'Sin nombre'} — ${teams.length}/${maxTeams}`
      )
    );

  if (teams.length === 0) {
    container.addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('División sin equipos.'))
    return container
  }

  for (const team of teams) {
    const { teamId, points, rank } = team;
    const { name, iconURL } = teamId

    const thumbnailComponent = new ThumbnailBuilder({ media: { url: iconURL } });

    const sectionComponent = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent([
          `### ${rank}. ${name}`,
          `🏓 Puntos: ${points}`
        ].join('\n'))
      )
      .setThumbnailAccessory(thumbnailComponent)

    container
      .addSeparatorComponents(new SeparatorBuilder())
      .addSectionComponents(sectionComponent);
  }

  return container;
}

module.exports = { updateRankingsEmbed }