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

const getMatchSelectHourMenu = ({ matchIndex, day}) => {
  return new StringSelectMenuBuilder()
    .setCustomId(`matchSelectHourMenu:${matchIndex}:${day}`)
    .setPlaceholder("Elije una hora (España)")
    .addOptions(
      Array.from({ length: 6 }, (_, i) => {
        const h = (18 + i).toString().padStart(2, "0")
        return {
          label: `${h}:00 (España)`,
          value: h,
        }
      })
    )
}

const getMatchSelectMinuteMenu = ({ matchIndex, day, hour }) => {
  return new StringSelectMenuBuilder()
    .setCustomId(`matchSelectMinuteMenu:${matchIndex}:${day}:${hour}`)
    .setPlaceholder("Elije minutos")
    .addOptions([
      { label: "00", value: "00" },
      { label: "15", value: "15" },
      { label: "30", value: "30" },
      { label: "45", value: "45" },
    ])
}

module.exports = { getMatchSelectDayMenu, getMatchSelectHourMenu, getMatchSelectMinuteMenu }