const { ActionRowBuilder } = require('discord.js')

const Match = require('../../../Esquemas/Match.js')

const { checkTeamUserIsLeader } = require('../../../services/team.js')

const { getErrorEmbed, getSuccesEmbed } = require('../../../discord/embeds/management.js')
const { getMatchCancelInteractionButton } = require('../../../discord/buttons/match.js')
const { getMatchSelectDayMenu } = require('../../../discord/menus/match.js')

module.exports = {
  condition: (id) => id.startsWith('matchChangeSchedule'),

  async execute(interaction) {
    try {
      
        const perms = await checkTeamUserIsLeader({ discordId: interaction.user.id })

        if (!perms) {
            return interaction.reply({
                ephemeral: true,
                embeds: [getErrorEmbed({ error: 'Solo los líderes de los equipos pueden utilizar esta interacción.' })]
            })
        }

        const splittedId = interaction.customId.split(':')
        const matchIndex = splittedId[1]

        const match = await Match.findOne({ matchIndex })
          .populate({
            path: 'teamAId',             // primero poblamos el equipo completo
            model: 'Team',
            populate: {
              path: 'members.userId',    // luego poblamos los usuarios de los miembros
              model: 'User'
            }
          })
          .populate({
            path: 'teamBId',
            model: 'Team',
            populate: {
              path: 'members.userId',
              model: 'User'
            }
          })

        if (!match) {
            throw new Error('No se ha encontrado el partido-')
        }

        if (match.teamAId.members.find(m => m.userId.discordId === interaction.user.id) === undefined &&
            match.teamBId.members.find(m => m.userId.discordId === interaction.user.id) === undefined) {
            throw new Error('No eres miembro de ninguno de los equipos de este partido.')
        }

        await interaction.reply({
          ephemeral: true,
          content: '### Propuesta de cambio de horario\n> Día:\n> Hora:',
          components: [
            new ActionRowBuilder().addComponents(getMatchSelectDayMenu({ matchIndex: match.matchIndex })),
            new ActionRowBuilder().addComponents(getMatchCancelInteractionButton())
          ]
        })
    } catch (error) {
      console.error(error)
      return interaction.reply({
        ephemeral: true,
        embeds: [getErrorEmbed({ error: error.message })]
      })
    }
  }
}