const { SlashCommandBuilder } = require('discord.js')
const { createDivision, deleteDivision, updateDivision } = require('../../services/division.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../discord/embeds/management.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('division')
    .setDescription('Gestiona las divisiones')
    .addSubcommand(sub =>
      sub
        .setName('crear')
        .setDescription('Crea una nueva división')
        .addStringOption(opt =>
          opt.setName('nombre')
            .setDescription('Nombre de la división')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('tier')
            .setDescription('Tier de la división')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('emoji')
            .setDescription('Emoji de la división')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('eliminar')
        .setDescription('Elimina una división existente')
        .addStringOption(opt =>
          opt.setName('nombre')
            .setDescription('Nombre de la división a eliminar')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('actualizar')
        .setDescription('Actualiza una división')
        .addStringOption(opt =>
          opt.setName('nombre')
            .setDescription('Nombre actual de la división')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('nuevo-nombre')
            .setDescription('Nuevo nombre)')
            .setRequired(false)
        )
        .addIntegerOption(opt =>
          opt.setName('nuevo-tier')
            .setDescription('Nuevo tier')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName('nuevo-emoji')
            .setDescription('Nuevo emoji')
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    const subcomand = interaction.options.getSubcommand()

    try {
      if (subcomand === 'crear') {
        const name = interaction.options.getString('nombre')
        const tier = interaction.options.getInteger('tier')
        const emoji = interaction.options.getString('emoji')
        const división = await createDivision({ name, tier, emoji })
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `División creada: **${división.emoji} ${división.name}** (Tier ${división.tier})` })]
        })
      }

      else if (subcomand === 'eliminar') {
        const name = interaction.options.getString('nombre')
        const división = await deleteDivision({ name })
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `División eliminada: **${división.name}**` })]
        })
      }

      else if (subcomand === 'actualizar') {
        const name = interaction.options.getString('nombre')
        const newName = interaction.options.getString('nuevo-nombre')
        const newTier = interaction.options.getInteger('nuevo-tier')
        const newEmoji = interaction.options.getString('nuevo-emoji')

        const división = await updateDivision({ name, newName, newTier, newEmoji })
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `División actualizada: **${división.emoji} ${división.name}** (Tier ${división.tier})` })]
        })
      }
    } catch (error) {
      console.error(error)
      await interaction.reply({
          embeds: [getErrorEmbed({ error: error.message })]
      })
    }
  }
}