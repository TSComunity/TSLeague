const { ButtonBuilder, ButtonStyle } = require('discord.js')

const getTeamSeeButton = () => {
    return (
        new ButtonBuilder()
        .setCustomId('teamSee')
        .setLabel('Ver Equipo')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary)
    )
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
        .setEmoji('🧑‍💼')
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
            .setLabel('Añadir miembro')
            .setEmoji('➕')
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
          .setEmoji('<:leader:1394257429373390878>')
          .setStyle(ButtonStyle.Danger)
    )
}

const getTeamChangeMemberRoleToSubLeader = ({ discordId }) => {
    return (
        new ButtonBuilder()
          .setCustomId(`teamChangeMemberRoleTo_sub-leader_${discordId}`)
          .setLabel('Cambiar a Sub-líder')
          .setEmoji('<:subleader:1394257347861286933>')
          .setStyle(ButtonStyle.Primary)
    )
}

const getTeamChangeMemberRoleToMember = ({ discordId }) => {
    return (
        new ButtonBuilder()
          .setCustomId(`teamChangeMemberRoleTo_member_${discordId}`)
          .setLabel('Cambiar a Miembro')
          .setEmoji('👤')
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

const getTeamStatsButton = () => {
    return (
        new ButtonBuilder()
        .setCustomId('teamStats')
        .setLabel('Ver Estadísticas')
        .setEmoji('👀')
        .setStyle(ButtonStyle.Primary)
    )
}

module.exports = {
    getTeamSeeButton,
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