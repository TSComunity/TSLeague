const { SlashCommandBuilder } = require('discord.js')
const { createDivision, deleteDivision, updateDivision } = require('../../services/division.js')
const { getErrorEmbed } = require('../../discord/embeds/management.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('división')
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
          opt.setName('nuevo_nombre')
            .setDescription('Nuevo nombre)')
            .setRequired(false)
        )
        .addIntegerOption(opt =>
          opt.setName('nuevo_tier')
            .setDescription('Nuevo tier')
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    const subcomand = interaction.options.getSubcommand()

    try {
      if (subcomand === 'crear') {
        const name = interaction.options.getString('nombre')
        const tier = interaction.options.getInteger('tier')
        const división = await createDivision({ name, tier })
        await interaction.reply(`✅ División creada: **${división.name}** (Tier ${división.tier})`)
      }

      else if (subcomand === 'eliminar') {
        const name = interaction.options.getString('nombre')
        const división = await deleteDivision({ name: nombre })
        await interaction.reply(`🗑️ División eliminada: **${división.name}**`)
      }

      else if (subcomand === 'actualizar') {
        const name = interaction.options.getString('nombre')
        const newName = interaction.options.getString('nuevo_nombre')
        const newTier = interaction.options.getInteger('nuevo_tier')

        const división = await updateDivision({ name, newName, newTier })

        await interaction.reply(`🔁 División actualizada: **${división.name}** (Tier ${división.tier})`)
      }
    } catch (error) {
      await interaction.reply(
        {
          embeds: [getErrorEmbed({ error: error.message })]
        }
      )
    }
  }
}