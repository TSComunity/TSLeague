const { EmbedBuilder } = require("discord.js")
const { checkDeadline } = require("../utlis/date.js")

module.exports = {
  name: "checkDeadline",
  aliases: ["cd"],
  args: false,
  run: async (message, client, args) => {
    try {
      // Opcional: permitir pasar fecha como argumento
      const dateArg = args[0] ? new Date(args[0]) : new Date();

      const result = checkDeadline({ scheduledAt: null }, dateArg); 
      // Cambia { scheduledAt: ... } si quieres probar con partidos reales

      const embed = new EmbedBuilder()
        .setTitle("Resultado de checkDeadline")
        .setColor("Blue")
        .addFields(
          { name: "Ahora", value: dateArg.toString(), inline: false },
          { name: "Deadline", value: result.deadline.toString(), inline: false },
          { name: "Fecha por defecto", value: result.defaultDate.toString(), inline: false },
          { name: "¿Pasado?", value: result.passed ? "Sí ✅" : "No ❌", inline: true }
        );

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Error en checkDeadline:", err);
      await message.channel.send(`Ocurrió un error: ${err.message}`);
    }
  },
};