const { SlashCommandBuilder } = require('discord.js')
const {
  getMatchInfo,
  cancelMatch,
  endMatch,
  changeMatchScheduledAt
} = require('../../services/match.js')

const { getMatchInfoEmbed } = require('../../discord/embeds/match.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../discord/embeds/management.js')

const { commands } = require('../../configs/league.js')
const ROLES_WITH_PERMS = commands.perms

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
        .setName('cambiar-horario')
        .setDescription('Cambia el horario de un partido')
        .addStringOption(opt =>
            opt.setName('indice-temporada').setDescription('El indice de la temporada').setRequired(true))
        .addAttachmentOption(opt =>
            opt.setName('nombre-equipo-a').setDescription('Nombre del primer equipo').setRequired(true))
        .addStringOption(opt =>
            opt.setName('nombre-equipo-b').setDescription('Nombre del segundo equipo').setRequired(true))
        .addIntegerOption(opt =>
          opt.setName('dia').setDescription('Dia del partido').setRequired(true)
            .addChoices(
                { name: 'Lunes', value: 1 },
                { name: 'Martesr', value: 2 },
                { name: 'Miércoles', value: 3 },
                { name: 'Jueves', value: 4 },
                { name: 'Viernes', value: 5 },
                { name: 'Sábado', value: 6 },
                { name: 'Domingo', value: 0 }

            ))
        .addIntegerOption(opt =>
            opt.setName('hora').setDescription('Hora del partido').setRequired(true)
            .addChoices(
                { name: '1', value: 1 },
                { name: '2', value: 2 },
                { name: '3', value: 3 },
                { name: '4', value: 4 },
                { name: '5', value: 5 },
                { name: '6', value: 6 },
                { name: '7', value: 7 },
                { name: '8', value: 8 },
                { name: '9', value: 9 },
                { name: '10', value: 10 },
                { name: '11', value: 11 },
                { name: '12', value: 12 },
                { name: '13', value: 13 },
                { name: '14', value: 14 },
                { name: '15', value: 15 },
                { name: '16', value: 16 },
                { name: '17', value: 17 },
                { name: '18', value: 18 },
                { name: '19', value: 19 },
                { name: '20', value: 20 },
                { name: '21', value: 21 },
                { name: '22', value: 22 },
                { name: '23', value: 23 }
            ))
        .addIntegerOption(opt =>
            opt.setName('minuto').setDescription('Minuto del partido').setRequired(true)
        .addChoices(
        { name: '00', value: 0 },
        { name: '05', value: 5 },
        { name: '10', value: 10 },
        { name: '15', value: 15 },
        { name: '20', value: 20 },
        { name: '25', value: 25 },
        { name: '30', value: 30 },
        { name: '35', value: 35 },
        { name: '40', value: 40 },
        { name: '45', value: 45 },
        { name: '50', value: 50 },
        { name: '55', value: 55 }
        ))
    ),

  async execute(interaction) {

    const member = interaction.member
    const hasPerms = member.roles.cache.some(role => ROLES_WITH_PERMS.includes(role.id))

    if (!hasPerms) {
        return interaction.reply({ embeds: [getErrorEmbed({ error: 'No tienes permisos para utilizar este comando.' })]})
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