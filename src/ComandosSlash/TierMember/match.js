const { SlashCommandBuilder } = require('discord.js')
const {
  getMatchInfo,
  cancelMatch,
  endMatch,
  changeMatchScheduledAt
} = require('../../services/match.js')

const { getMatchInfoEmbed } = require('../../discord/embeds/match.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../discord/embeds/management.js')

const { config } = require('../../configs/league.js')
const ROLES_WITH_PERMS = config.commands.perms

module.exports = {
  data: new SlashCommandBuilder()
    .setName('partido')
    .setDescription('Gestiona los partidos')

    // /partido ver
    .addSubcommand(sub =>
      sub
        .setName('ver-datos')
        .setDescription('Ver los datos de un partido')
        .addStringOption(opt =>
            opt.setName('indice-temporada').setDescription('El indice de la temporada').setRequired(true))
        .addAttachmentOption(opt =>
            opt.setName('nombre-equipo-a').setDescription('Nombre del primer equipo').setRequired(true))
        .addStringOption(opt =>
            opt.setName('nombre-equipo-b').setDescription('Nombre del segundo equipo').setRequired(true))
    )

    // /partido cancelar
    .addSubcommand(sub =>
      sub
        .setName('cancelar')
        .setDescription('Cancela un partido')
        .addStringOption(opt =>
            opt.setName('indice-temporada').setDescription('El indice de la temporada').setRequired(true))
        .addAttachmentOption(opt =>
            opt.setName('nombre-equipo-a').setDescription('Nombre del primer equipo').setRequired(true))
        .addStringOption(opt =>
            opt.setName('nombre-equipo-b').setDescription('Nombre del segundo equipo').setRequired(true))
        .addStringOption(opt =>
            opt.setName('motivo').setDescription('Motivo del cancelamiento').setRequired(true))
    )

    // /partido terminar
    .addSubcommand(sub =>
      sub
        .setName('terminar')
        .setDescription('Termina un partido')
        .addStringOption(opt =>
            opt.setName('indice-temporada').setDescription('El indice de la temporada').setRequired(true))
        .addAttachmentOption(opt =>
            opt.setName('nombre-equipo-a').setDescription('Nombre del primer equipo').setRequired(true))
        .addStringOption(opt =>
            opt.setName('nombre-equipo-b').setDescription('Nombre del segundo equipo').setRequired(true))
    )

    // /partido cambiar-horario
    .addSubcommand(sub =>
      sub
        .addStringOption(opt =>
            opt.setName('indice-temporada').setDescription('El indice de la temporada').setRequired(true))
        .addAttachmentOption(opt =>
            opt.setName('nombre-equipo-a').setDescription('Nombre del primer equipo').setRequired(true))
        .addStringOption(opt =>
            opt.setName('nombre-equipo-b').setDescription('Nombre del segundo equipo').setRequired(true))
        .addIntegerOption(opt =>
          opt.setName('dia').setDescription('Dia del partido').setRequired(true)
            .addChoices(
                { label: 'Lunes', value: 1 },
                { label: 'Martesr', value: 2 },
                { label: 'Miércoles', value: 3 },
                { label: 'Jueves', value: 4 },
                { label: 'Viernes', value: 5 },
                { label: 'Sábado', value: 6 },
                { label: 'Domingo', value: 0 }

            ))
        .addIntegerOption(opt =>
            opt.setName('hora').setDescription('Hora del partido').setRequired(true)
            .addChoices(
                { label: '1', value: 1 },
                { label: '2', value: 2 },
                { label: '3', value: 3 },
                { label: '4', value: 4 },
                { label: '5', value: 5 },
                { label: '6', value: 6 },
                { label: '7', value: 7 },
                { label: '8', value: 8 },
                { label: '9', value: 9 },
                { label: '10', value: 10 },
                { label: '11', value: 11 },
                { label: '12', value: 12 },
                { label: '13', value: 13 },
                { label: '14', value: 14 },
                { label: '15', value: 15 },
                { label: '16', value: 16 },
                { label: '17', value: 17 },
                { label: '18', value: 18 },
                { label: '19', value: 19 },
                { label: '20', value: 20 },
                { label: '21', value: 21 },
                { label: '22', value: 22 },
                { label: '23', value: 23 }
            ))
        .addIntegerOption(opt =>
            opt.setName('minuto').setDescription('Minuto del partido').setRequired(true)
        .addChoices(
        { label: '00', value: 00 },
        { label: '05', value: 05 },
        { label: '10', value: 10 },
        { label: '15', value: 15 },
        { label: '20', value: 20 },
        { label: '25', value: 25 },
        { label: '30', value: 30 },
        { label: '35', value: 35 },
        { label: '40', value: 40 },
        { label: '45', value: 45 },
        { label: '50', value: 50 },
        { label: '55', value: 55 }
        ))
    ),

  async execute(interaction) {

    const member = interaction.member
    const hasPerms = member.roles.cache.some(role => ROLES_WITH_PERMS.includes(role.name))

    if (!hasPerms) {
        return await interaction.reply({ embeds: [getErrorEmbed({ error: 'No tienes permiso para usar este comando.' })]})
    }

    const sub = interaction.options.getSubcommand()

    try {
      if (sub === 'ver-datos') {
        const seasonIndex = interaction.options.getString('indice-temporada')
        const teamAName = interaction.options.getString('nombre-equipo-a')
        const teamBName = interaction.options.getString('nombre-equipo-b')

        const match = await getMatchInfo({ seasonIndex, teamAName, teamBName })
        await interaction.reply({
            embeds: [getMatchInfoEmbed({ match })]
        })

      } else if (sub === 'cancelar') {
        const seasonIndex = interaction.options.getString('indice-temporada')
        const teamAName = interaction.options.getString('nombre-equipo-a')
        const teamBName = interaction.options.getString('nombre-equipo-b')
        const reason = interaction.options.getString('motivo')

        const match = await cancelMatch({ seasonIndex, teamAName, teamBName, reason })
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `Cancelado el partido entre **${match.teamAId.name}** y **${match.teamBId.name}**.` })]
        })

      } else if (sub === 'terminar') {
        const seasonIndex = interaction.options.getString('indice-temporada')
        const teamAName = interaction.options.getString('nombre-equipo-a')
        const teamBName = interaction.options.getString('nombre-equipo-b')

        const match = await endMatch({ seasonIndex, teamAName, teamBName })
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `Terminado el partido entre **${match.teamAId.name}** y **${match.teamBId.name}**.` })]
        })

      } else if (sub === 'cambiar-horario') {
        const seasonIndex = interaction.options.getString('indice-temporada')
        const teamAName = interaction.options.getString('nombre-equipo-a')
        const teamBName = interaction.options.getString('nombre-equipo-b')
        const day = interaction.options.getInteger('dia')
        const hour = interaction.options.getInteger('hora')
        const minute = interaction.options.getInteger('minuto')

        const match = await changeMatchScheduledAt({ seasonIndex, teamAName, teamBName, day, hour, minute })
        await interaction.reply({
          embeds: [getSuccesEmbed({ message:`Cambiada la fecha del partido entre **${match.teamAId.name}** y **${match.teamBId.name}**.` })]
        })
      }

    } catch (error) {
      console.error(error)
      await interaction.reply(
        {
          embeds: [getErrorEmbed({ error: error.message })]
        }
      )
    }
  }
}