const { ButtonBuilder, ButtonStyle } = require('discord.js')

const getTeamCreateButton = () => {
    return new ButtonBuilder()
      .setCustomId('teamCreate')
      .setLabel('Crear Equipo')
      .setEmoji('<:teamCreate:1396237918003007588>')
      .setStyle(ButtonStyle.Primary);
}

const getTeamSeeButton = () => {
    return (
        new ButtonBuilder()
        .setCustomId('teamSee')
        .setLabel('Ver Equipo')
        .setEmoji('<:teamSee:1402339812022685887>')
        .setStyle(ButtonStyle.Secondary)
    )
}

const getTeamJoinButton = () => {
    return new ButtonBuilder()
      .setCustomId('teamJoin')
      .setLabel('Unirse a un Equipo')
      .setEmoji('👥')
      .setStyle(ButtonStyle.Success)
}

const getTeamLeftButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('teamLeave')
            .setLabel('Salir del Equipo')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🚪')
    )
}

const getTeamChangeNameButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('teamChangeName')
            .setLabel('Cambiar Nombre')
            .setEmoji('📛')
            .setStyle(ButtonStyle.Secondary)
    )
}

const getTeamChangeIconButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('teamChangeIcon')
            .setLabel('Cambiar Icono')
            .setEmoji('🖼️')
            .setStyle(ButtonStyle.Secondary)
    )
}

const getTeamChangeColorButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('teamChangeColor')
            .setLabel('Cambiar Color')
            .setEmoji('🎨')
            .setStyle(ButtonStyle.Secondary)
    )
}

const getTeamManageMembersButton = () => {
    return (
        new ButtonBuilder()
        .setCustomId('teamManageMembers')
        .setLabel('Gestionar Jugadores')
        .setEmoji('<:members:1395916668869283860>')
        .setStyle(ButtonStyle.Secondary)
    )
}

const getTeamReGenerateCodeButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('teamReGenerateCode')
            .setLabel('Regenerar Código')
            .setEmoji('🔑')
            .setStyle(ButtonStyle.Secondary)
    )
}

const getTeamAddMemberButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('teamAddMember')
            .setLabel('Añadir Miembro')
            .setEmoji('<:addMember:1402340233139196018>')
            .setStyle(ButtonStyle.Primary)
    )
}

const getTeamChangeMemberRoleButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('teamChangeMemberRole')
            .setLabel('Gestionar Roles')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Secondary)
    )
}

const getTeamKickMemberButton = () => {
    return (
        new ButtonBuilder()
            .setCustomId('teamKickMember')
            .setLabel('Expulsar miembro')
            .setEmoji('❌')
            .setStyle(ButtonStyle.Danger)
    )
}

const getTeamChangeMemberRoleToLeader = ({ discordId }) => {
    return (
        new ButtonBuilder()
          .setCustomId(`teamChangeMemberRoleTo_leader_${discordId}`)
          .setLabel('Cambiar a Líder')
          .setEmoji('<:leader:1395916423695564881>')
          .setStyle(ButtonStyle.Danger)
    )
}

const getTeamChangeMemberRoleToSubLeader = ({ discordId }) => {
    return (
        new ButtonBuilder()
          .setCustomId(`teamChangeMemberRoleTo_sub-leader_${discordId}`)
          .setLabel('Cambiar a Sub-líder')
          .setEmoji('<:subleader:1395916298025832519>')
          .setStyle(ButtonStyle.Primary)
    )
}

const getTeamChangeMemberRoleToMember = ({ discordId }) => {
    return (
        new ButtonBuilder()
          .setCustomId(`teamChangeMemberRoleTo_member_${discordId}`)
          .setLabel('Cambiar a Miembro')
          .setEmoji('<:member:1402254138632572999>')
          .setStyle(ButtonStyle.Secondary)
    )
}

const getTeamCancelButton = () => {
    return (
        new ButtonBuilder()
        .setCustomId('teamCancel')
        .setLabel('Cancelar')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger)
    )
}

const getTeamStatsButton = ({ teamName }) => {
    return (
        new ButtonBuilder()
        .setCustomId(`teamStats-${teamName}`)
        .setLabel('Ver Estadísticas')
        .setEmoji('👀')
        .setStyle(ButtonStyle.Primary)
    )
}

module.exports = {
    getTeamCreateButton,
    getTeamSeeButton,
    getTeamJoinButton,
    getTeamLeftButton,
    getTeamChangeNameButton,
    getTeamChangeIconButton,
    getTeamChangeColorButton,
    getTeamManageMembersButton,
    getTeamReGenerateCodeButton,
    getTeamAddMemberButton,
    getTeamChangeMemberRoleButton,
    getTeamKickMemberButton,
    getTeamChangeMemberRoleToLeader,
    getTeamChangeMemberRoleToSubLeader,
    getTeamChangeMemberRoleToMember,
    getTeamCancelButton,
    getTeamStatsButton
}