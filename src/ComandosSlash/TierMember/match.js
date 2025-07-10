const { SlashCommandBuilder } = require('discord.js')
const {
  getMatchInfo,
  cancelMatch,
  endMatch,
  changeMatchScheduledAt
} = require('../../services/match.js')

const { getErrorEmbed } = require('../../discord/embed/management.js')

const { config } = require('../../configs/league.js')
const ROLES_WITH_PERMS = config.perms.commands

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
          opt.setName('nombre').setDescription('Nombre del equipo').setRequired(true))
        .addAttachmentOption(opt =>
            opt.setName('icono').setDescription('Ícono del equipo').setRequired(true))
        .addStringOption(opt =>
          opt.setName('color').setDescription('Color del equipo').setRequired(true))
    )

    // /partido cancelar
    .addSubcommand(sub =>
      sub
        .setName('cancelar')
        .setDescription('Cancela un partido')
        .addStringOption(opt =>
          opt.setName('nombre').setDescription('Nombre actual del equipo').setRequired(true))
        .addStringOption(opt =>
          opt.setName('nuevo_nombre').setDescription('Nuevo nombre del equipo').setRequired(false))
        .addAttachmentOption(opt =>
            opt.setName('nuevo_icono').setDescription('Ícono del equipo').setRequired(true))
        .addStringOption(opt =>
          opt.setName('nuevo_color').setDescription('Nuevo color').setRequired(false))
    )

    // /partido terminar
    .addSubcommand(sub =>
      sub
        .setName('terminar')
        .setDescription('Termina un partido')
        .addStringOption(opt =>
          opt.setName('equipo').setDescription('Nombre del equipo').setRequired(true))
        .addStringOption(opt =>
          opt.setName('division').setDescription('Nombre de la división').setRequired(true))
    )

    // /partido cambiar-horario
    .addSubcommand(sub =>
      sub
        .setName('cambiar-horario')
        .setDescription('Cambia el horario de un partido')
        .addStringOption(opt =>
          opt.setName('equipo').setDescription('Nombre del equipo').setRequired(true))
    ),

  async execute(interaction) {

    const member = interaction.member
    const hasPerms = member.roles.cache.some(role => ROLES_WITH_PERMS.includes(role.name))

    if (!hasPerms) {
        const embed = getErrorEmbed({ error: 'No tienes permiso para usar este comando.' })
        return await interaction.reply({ embeds: [embed]})
    }

    const sub = interaction.options.getSubcommand()

    try {
      if (sub === 'crear') {
        const name = interaction.options.getString('nombre')
        const iconAttachment = interaction.options.getAttachment('icono')
        const iconURL = iconAttachment.url
        const color = interaction.options.getString('color')
        const presidentDiscordId = interaction.user.id
        const team = await createTeam({ name, iconURL, color, presidentDiscordId })
        await interaction.reply(`Equipo **${team.name}** creado.`)

      } else if (sub === 'actualizar') {
        const oldName = interaction.options.getString('nombre')
        const newName = interaction.options.getString('nuevo_nombre')
        const iconAttachment = interaction.options.getAttachment('nuevo_icono')
        const iconURL = iconAttachment.url
        const color = interaction.options.getString('nuevo_color')
        const team = await updateTeam({ oldName, newName, iconURL, color })
        await interaction.reply(`Equipo **${oldName}** actualizado.`)

      } else if (sub === 'añadir') {
        const teamName = interaction.options.getString('equipo')
        const divisionName = interaction.options.getString('division')
        const team = await addTeamToDivision({ teamName, divisionName })
        await interaction.reply(`Equipo **${team.name}** añadido a la división **${team.divisionId.name}**.`)

      } else if (sub === 'eliminar') {
        const teamName = interaction.options.getString('equipo')
        const team = await removeTeamFromDivision({ teamName })
        await interaction.reply(`Equipo **${team.name}** eliminado de su división.`)

      } else if (sub === 'expulsar') {
        const teamName = interaction.options.getString('equipo')
        const discordId = interaction.options.getString('usuario')
        const team = await removeMemberFromTeam({ teamName, discordId })
        await interaction.reply(`Miembro <@${discordId}> expulsado de **${team.name}**.`)

      } else if (sub === 'rol') {
        const teamName = interaction.options.getString('equipo')
        const discordId = interaction.options.getString('usuario')
        const newRol = interaction.options.getString('rol')
        const team = await changeMemberRole({ teamName, discordId, newRol })
        await interaction.reply(`Rol del usuario <@${discordId}> actualizado en **${team.name}** a ${newRol}.`)

      } else if (sub === 'regenerar_codigo') {
        const teamName = interaction.options.getString('equipo')
        const team = await updateTeamCode({ teamName })
        await team.save()
        await interaction.reply({
            content: `Nuevo código generado para el equipo **${team.name}**: \`${team.code}\``,
            ephemeral: true
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