const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, StringSelectMenuComponentBuilder } = require('discord.js')

const getMatchSelectDayMenu = ({ matchIndex }) => {
    return(
        new StringSelectMenuBuilder()
                .setCustomId(`matchSelectDayMenu:${matchIndex}`)
                .setPlaceholder('Elije un día')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Viernes')
                        .setValue('5')
                        .setEmoji('🇻'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Sábado')
                        .setValue('6')
                        .setEmoji('🇸'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Domingo')
                        .setValue('0')
                        .setEmoji('🇩')
                )
    )
}

const getMatchSelectHourMenu = ({ matchIndex, day }) => {
  return new StringSelectMenuBuilder()
    .setCustomId(`matchSelectHourMenu:${matchIndex}:${day}`)
    .setPlaceholder("Elige una hora (horario español)")
    .addOptions([
    { label: '12:00', value: '12:00' },
    { label: '12:30', value: '12:30' },
    { label: '13:00', value: '13:00' },
    { label: '13:30', value: '13:30' },
    { label: '14:00', value: '14:00' },
    { label: '14:30', value: '14:30' },
    { label: '15:00', value: '15:00' },
    { label: '15:30', value: '15:30' },
    { label: '16:00', value: '16:00' },
    { label: '16:30', value: '16:30' },
    { label: '17:00', value: '17:00' },
    { label: '17:30', value: '17:30' },
    { label: '18:00', value: '18:00' },
    { label: '18:30', value: '18:30' },
    { label: '19:00', value: '19:00' },
    { label: '19:30', value: '19:30' },
    { label: '20:00', value: '20:00' },
    { label: '20:30', value: '20:30' },
    { label: '21:00', value: '21:00' },
    { label: '21:30', value: '21:30' },
    { label: '22:00', value: '22:00' },
    { label: '22:30', value: '22:30' },
    { label: '23:00', value: '23:00' },
    { label: '23:30', value: '23:30' }
    ])
}

module.exports = { getMatchSelectDayMenu, getMatchSelectHourMenu }