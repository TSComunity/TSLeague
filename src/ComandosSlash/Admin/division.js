const { SlashCommandBuilder } = require('discord.js')
const { createDivision, deleteDivision, updateDivision } = require('../../services/division.js')
const { getErrorEmbed, getSuccesEmbed } = require('../../discord/embeds/management.js')
const { sendLog } = require('../../discord/send/staff.js')

const colors = require('../../configs/colors.json')

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
        .addStringOption(opt =>
          opt.setName('color')
            .setDescription('Color de la división')
            .setRequired(true)
            .addChoices(...colors.map(color => ({
                name: `${color.emoji} ${color.label}`, // Mostramos emoji + nombre
                value: color.value
            })))
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
        .addStringOption(opt =>
          opt.setName('nuevo-color')
            .setDescription('Nuevo color')
            .setRequired(false)
            .addChoices(...colors.map(color => ({
                name: `${color.emoji} ${color.label}`, // Mostramos emoji + nombre
                value: color.value
            })))
        )
    ),

  async execute(interaction) {
    const subcomand = interaction.options.getSubcommand()

    try {
      if (subcomand === 'crear') {
        const name = interaction.options.getString('nombre')
        const tier = interaction.options.getInteger('tier')
        const emoji = interaction.options.getString('emoji')
        const color = interaction.options.getString('color')
        const división = await createDivision({ name, tier, emoji, color })
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `División **${división.emoji} ${división.name}** creada.` })]
        })
        await sendLog({
          content: `🟢 El usuario <@${interaction.user.id}> ha creado la división **${división.emoji} ${división.name}**\n- Tier: ${división.tier}\n- Color: ${división.color}\n- Emoji: ${división.emoji}`,
          client: interaction.client,
          type: 'success'
        })
      }

      else if (subcomand === 'eliminar') {
        const name = interaction.options.getString('nombre')
        const división = await deleteDivision({ name })
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `División **${división.emoji} ${división.name}** eliminada.` })]
        })
        await sendLog({
          content: `🔴 El usuario <@${interaction.user.id}> ha eliminado la división **${división.emoji} ${división.name}**\n- Tier: ${división.tier}\n- Color: ${división.color}\n- Emoji: ${división.emoji}`,
          client: interaction.client,
          type: 'danger'
        })
      }

      else if (subcomand === 'actualizar') {
        const name = interaction.options.getString('nombre')
        const newName = interaction.options.getString('nuevo-nombre')
        const newTier = interaction.options.getInteger('nuevo-tier')
        const newEmoji = interaction.options.getString('nuevo-emoji')
        const newColor = interaction.options.getString('nuevo-color')

        const división = await updateDivision({ name, newName, newTier, newEmoji, newColor })
        await interaction.reply({
          embeds: [getSuccesEmbed({ message: `División **${división.emoji} ${división.name}** actualizada.` })]
        })
        await sendLog({
          content: `🟡 El usuario <@${interaction.user.id}> ha actualizado la división **${división.emoji} ${división.name}**\n- Nuevo nombre: ${newName || 'Sin cambio'}\n- Nuevo tier: ${newTier || 'Sin cambio'}\n- Nuevo color: ${newColor || 'Sin cambio'}\n- Nuevo emoji: ${newEmoji || 'Sin cambio'}`,
          client: interaction.client,
          type: 'warning'
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