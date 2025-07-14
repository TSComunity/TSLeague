const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js')
const colors = require('../../configs/colors.json')

const getTeamChangeColorMenu = () => {
  return new StringSelectMenuBuilder()
    .setCustomId('teamChangeColorMenu')
    .setPlaceholder('Elige un color para tu equipo')
    .addOptions(
      colors.map(color =>
        new StringSelectMenuOptionBuilder()
          .setLabel(color.label)
          .setValue(color.value)
          .setEmoji(color.emoji)
      )
    )
}

const getTeamKickMemberMenu = ({ options }) => {
    return(
        new StringSelectMenuBuilder()
                .setCustomId('teamkickMemberMenu')
                .setPlaceholder('Selecciona un miembro para expulsarlo')
                .addOptions(options)
    )
}
const getTeamChangeMemberRoleMenu = ({ options }) => {
    return (
        new StringSelectMenuBuilder()
        .setCustomId('teamChangeMemberRole')
        .setPlaceholder('Selecciona un miembro para cambiar su rol')
        .addOptions(options)
    )
}


module.exports = { getTeamChangeColorMenu, getTeamKickMemberMenu, getTeamChangeMemberRoleMenu }