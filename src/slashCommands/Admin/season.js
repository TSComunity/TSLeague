const { SlashCommandBuilder } = require('discord.js');
const { startSeason, endSeason } = require('../../services/season.js');
const { getErrorEmbed, getSuccesEmbed } = require('../../discord/embeds/management.js');
const { sendLog } = require('../../discord/send/staff.js');
const Season = require('../../models/Season.js'); 
const fs = require('fs');
const path = require('path');
const { GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType } = require('discord.js');
const emojis = require('../../configs/emojis.json');
const configs = require('../../configs/league.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('temporada')
    .setDescription('Gestiona la temporada')
    .addSubcommand(sub =>
      sub
        .setName('comenzar')
        .setDescription('Comienza una nueva temporada')
        .addStringOption(opt =>
          opt
            .setName('nombre')
            .setDescription('Nombre de la temporada')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('finalizar')
        .setDescription('Finaliza la temporada actual')
    )
    .addSubcommand(sub =>
      sub
        .setName('solve')
        .setDescription('⚠️ Elimina TODAS las temporadas (uso de emergencia)')
    )
    // Nuevos subcomandos:
    .addSubcommand(sub =>
      sub
        .setName('datos')
        .setDescription('Muestra los datos JSON de la temporada activa')
    )
    .addSubcommand(sub =>
      sub
        .setName('crear-evento')
        .setDescription('Crea o sobreescribe el scheduled event de la temporada actual')
    )
    .addSubcommand(sub =>
      sub
        .setName('agreglar-sets')
        .setDescription('Agrega sets aleatorios a la última ronda de cada división que no los tenga (uso de emergencia)')
    ),

  async execute(interaction, client) {
    const subcomand = interaction.options.getSubcommand();
    const guild = interaction.guild;

    try {
      // ---------- EXISTENTES ----------
      if (subcomand === 'comenzar') {
        const name = interaction.options.getString('nombre');
        const season = await startSeason({ name, client });

        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `Temporada **${season.name}** comenzada.` })],
        });

        await sendLog({
          content: `Temporada **${season.name}** comenzada.`,
          client: interaction.client,
          type: 'success',
          userId: interaction.user.id,
          eventType: 'season',
        });
      }

      else if (subcomand === 'finalizar') {
        const season = await endSeason({ client });

        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `Temporada **${season.name}** terminada.` })],
        });

        await sendLog({
          content: `Temporada **${season.name}** terminada.`,
          client: interaction.client,
          type: 'danger',
          userId: interaction.user.id,
          eventType: 'season',
        });
      }

      else if (subcomand === 'solve') {
        const OWNER_ID = '838441772794511411'; 
        if (interaction.user.id !== OWNER_ID) {
          await interaction.reply({
            embeds: [getErrorEmbed({ error: '🚪 Get out. No tienes permiso para usar este comando.' })],
            ephemeral: true
          });
          return;
        }
        const deleted = await Season.deleteMany({});
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `✅ Se eliminaron **${deleted.deletedCount}** temporadas.` })],
          ephemeral: true,
        });
      }

      // ---------- NUEVOS ----------
      else if (subcomand === 'datos') {
        const season = await Season.findOne({ status: 'active' }).populate('divisions.divisionId').lean();
        if (!season) return interaction.reply({ embeds: [getErrorEmbed({ error: 'No hay temporada activa.' })] });

        await interaction.reply({
          embeds: [getSuccesEmbed({
            message: 'Datos de la temporada activa',
            description: '```json\n' + JSON.stringify(season, null, 2) + '\n```'
          })]
        });
      }

      else if (subcomand === 'crear-evento') {
        const season = await Season.findOne({ status: 'active' }).populate('divisions.divisionId');
        if (!season) return interaction.reply({ embeds: [getErrorEmbed({ error: 'No hay temporada activa.' })] });
        if (!guild) return interaction.reply({ embeds: [getErrorEmbed({ error: 'No se encontró la guild.' })] });

        const guildObj = await client.guilds.fetch(guild.id);

        // Eliminar evento anterior si existe
        if (season.scheduledEventId) {
          const oldEvent = await guildObj.scheduledEvents.fetch(season.scheduledEventId).catch(() => null);
          if (oldEvent) await oldEvent.delete();
          season.scheduledEventId = null;
          await season.save();
        }

        const maxRounds = Math.max(0, ...season.divisions.map(d => d.rounds?.length || 0));
        const roundNumberPadded = String(maxRounds).padStart(2, '0');

        const imagePath = path.join(__dirname, '../assets/tsLeagueBanner.webp');
        const imageBuffer = fs.readFileSync(imagePath);
        const imageBase64 = `data:image/webp;base64,${imageBuffer.toString('base64')}`;

        const eventName = `TS League — T${season.seasonIndex} · J${roundNumberPadded}`;
        const description = [
          `${emojis.season} Temporada ${season.name}`,
          `${emojis.round} Jornada: ${roundNumberPadded}`,
          `${emojis.match} Partidos: ${
            season.divisions.reduce((acc, d) => acc + d.rounds.reduce((a, r) => a + r.matches.length, 0), 0)
          }`
        ].join('\n');

        const ev = await guildObj.scheduledEvents.create({
          name: eventName,
          scheduledStartTime: new Date(Date.now() + 5 * 1000),
          privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
          entityType: GuildScheduledEventEntityType.StageInstance,
          channel: configs.channels.stage.id,
          description,
          image: imageBase64
        });

        if (ev?.id) {
          season.scheduledEventId = ev.id;
          await season.save();
        }

        await interaction.reply({ embeds: [getSuccesEmbed({ message: `Scheduled Event creado: **${eventName}**` })] });
      } else if (subcommand === 'agreglar-sets') {
        const season = await Season.findOne({ status: 'active' });
        if (!season) return interaction.reply({ embeds: [getErrorEmbed({ error: 'No hay temporada activa.' })] });

        let divisionsUpdated = 0;
        for (const division of season.divisions) {
          const lastRound = division.rounds[division.rounds.length - 1];
          if (lastRound && (!lastRound.sets || lastRound.sets.length === 0)) {
            lastRound.sets = [
              {
                mode: 'bounty',
                map: 'Layer Cake'
              },
              {
                mode: 'gemGrab',
                map: 'Crystal Arcade'
              },
              {
                mode: 'knockout',
                map: 'Goldarm Gulch'
              }
            ]
            divisionsUpdated++;
          }
        }
        await season.save();
        
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `Sets agregados a la última ronda de **${divisionsUpdated}** divisiones.` })]
        });
      }

    } catch (err) {
      console.error(err);
      await interaction.reply({ embeds: [getErrorEmbed({ error: err.message })], ephemeral: true });
    }
  }
};