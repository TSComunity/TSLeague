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
    // Madrugada primero (intervalos de 30 min)
    { label: '00:30', value: '00:30' },
    { label: '01:00', value: '01:00' },
    { label: '01:30', value: '01:30' },
    { label: '02:00', value: '02:00' },
    { label: '02:30', value: '02:30' },
    { label: '03:00', value: '03:00' },

    // Tarde - noche (14:00 a 23:30 cada 30 min)
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