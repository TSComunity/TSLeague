const { EmbedBuilder } = require('discord.js')

const getDivisionEndedEmbed = ({ division }) =>  {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    )
}

const getDivisionRankingEmbed = ({ division }) => {
  return
}


module.exports = { getDivisionEndedEmbed, getDivisionRankingEmbed }