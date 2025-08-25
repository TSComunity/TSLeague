const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { exec } = require("child_process");

// IDs permitidos
const allowedUsers = ["838441772794511411", "817515739711406140"];

module.exports = {
    name: "dev",
    aliases: ["mbot"],
    args: true,
    run: async (message, client, args) => {
        if (!allowedUsers.includes(message.author.id)) {
            return message.reply("No tienes permisos para usar este comando.");
        }

        const subcommand = args[0]?.toLowerCase();

        // IDs de PM2
        const pm2Ids = {
<<<<<<< HEAD
            comunity: 1,
            league: 8
=======
            comunity: 5,
            league: 4
>>>>>>> refs/remotes/origin/main
        };

        if (subcommand === "reiniciar") {
            const embed = new EmbedBuilder()
                .setTitle("Reiniciar bot")
                .setColor("#00ff99")
                .setDescription("Selecciona qué bot deseas reiniciar:");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("restart_comunity")
                    .setLabel("TS Comunity")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("restart_league")
                    .setLabel("TS League")
                    .setStyle(ButtonStyle.Secondary)
            );

            await message.channel.send({ embeds: [embed], components: [row] });

            const filter = i =>
                ["restart_comunity", "restart_league"].includes(i.customId) &&
                i.user.id === message.author.id;
            const collector = message.channel.createMessageComponentCollector({ filter, time: 15000, max: 1 });

            collector.on("collect", async interaction => {
                let botName = interaction.customId === "restart_comunity" ? "TS Comunity" : "TS League";
                let pm2Id = interaction.customId === "restart_comunity" ? pm2Ids.comunity : pm2Ids.league;

                await interaction.update({
                    content: `Reiniciando **${botName}** en 2 segundos...`,
                    embeds: [],
                    components: []
                });

                setTimeout(() => {
                    exec(`pm2 restart ${pm2Id}`, (error, stdout, stderr) => {
                        // No se puede enviar mensaje porque el bot se reinicia, pero puedes loguear si quieres
                    });
                }, 2000);
            });

            collector.on("end", collected => {
                if (collected.size === 0) {
                    message.channel.send("No se recibió confirmación, operación cancelada.");
                }
            });

        } else if (subcommand === "apagar") {
            const embed = new EmbedBuilder()
                .setTitle("Apagar bot")
                .setColor("#ff3333")
                .setDescription("Selecciona qué bot deseas apagar:");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("shutdown_comunity")
                    .setLabel("TS Comunity")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId("shutdown_league")
                    .setLabel("TS League")
                    .setStyle(ButtonStyle.Secondary)
            );

            await message.channel.send({ embeds: [embed], components: [row] });

            const filter = i =>
                ["shutdown_comunity", "shutdown_league"].includes(i.customId) &&
                i.user.id === message.author.id;
            const collector = message.channel.createMessageComponentCollector({ filter, time: 15000, max: 1 });

            collector.on("collect", async interaction => {
                let botName = interaction.customId === "shutdown_comunity" ? "TS Comunity" : "TS League";
                let pm2Id = interaction.customId === "shutdown_comunity" ? pm2Ids.comunity : pm2Ids.league;

                await interaction.update({
                    content: `Apagando **${botName}**...`,
                    embeds: [],
                    components: []
                });

                exec(`pm2 stop ${pm2Id}`, (error, stdout, stderr) => {
                    // No se puede enviar mensaje porque el bot se apaga, pero puedes loguear si quieres
                });
            });

            collector.on("end", collected => {
                if (collected.size === 0) {
                    message.channel.send("No se recibió confirmación, operación cancelada.");
                }
            });

        } else if (subcommand === "logs") {
            const embed = new EmbedBuilder()
                .setTitle("Ver logs de PM2")
                .setColor("#00ff99")
                .setDescription("Selecciona de qué bot quieres ver los logs:");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("logs_comunity")
                    .setLabel("TS Comunity")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("logs_league")
                    .setLabel("TS League")
                    .setStyle(ButtonStyle.Secondary)
            );

            await message.channel.send({ embeds: [embed], components: [row] });

            const filter = i =>
                ["logs_comunity", "logs_league"].includes(i.customId) &&
                i.user.id === message.author.id;
            const collector = message.channel.createMessageComponentCollector({ filter, time: 15000, max: 1 });

            collector.on("collect", async interaction => {
                let botName = interaction.customId === "logs_comunity" ? "TS Comunity" : "TS League";
                let pm2Id = interaction.customId === "logs_comunity" ? pm2Ids.comunity : pm2Ids.league;

                await interaction.update({
                    content: `Obteniendo logs de **${botName}**...`,
                    embeds: [],
                    components: []
                });

                exec(`pm2 logs ${pm2Id} --lines 20 --nostream`, (error, stdout, stderr) => {
                    if (error) {
                        return message.channel.send(`Error al obtener logs de PM2: \`${error.message}\``);
                    }
                    if (stderr) {
                        return message.channel.send(`stderr: \`${stderr}\``);
                    }
                    const output = stdout.length > 1900 ? stdout.slice(-1900) : stdout;
                    message.channel.send(`\`\`\`bash\n${output}\n\`\`\``);
                });
            });

            collector.on("end", collected => {
                if (collected.size === 0) {
                    message.channel.send("No se recibió confirmación, operación cancelada.");
                }
            });

        } else if (subcommand === "git") {
            const embed = new EmbedBuilder()
                .setTitle("Actualizando desde Git")
                .setColor("#00ff99")
                .setDescription("Obteniendo los últimos cambios del repositorio...");
            await message.channel.send({ embeds: [embed] });

            exec("git pull", (error, stdout, stderr) => {
                if (error) {
                    return message.channel.send(`Error: \`${error.message}\``);
                }
                if (stderr) {
                    return message.channel.send(`stderr: \`${stderr}\``);
                }
                message.channel.send(`\`\`\`bash\n${stdout}\n\`\`\``);
            });
        } else if (subcommand === "help") {
            const embed = new EmbedBuilder()
                .setTitle("Comandos de administración del bot")
                .setColor("#9f38f1")
                .setDescription("Lista de subcomandos disponibles para `dev`:")
                .addFields(
                    { name: "reiniciar", value: "Reinicia TS Comunity o TS League usando PM2 (requiere confirmación)." },
                    { name: "apagar", value: "Apaga TS Comunity o TS League usando PM2 (requiere confirmación)." },
                    { name: "git", value: "Hace git pull para traer los últimos cambios del repositorio." },
                    { name: "logs", value: "Muestra los últimos 20 logs del proceso PM2 del bot (elige el bot)." },
                    { name: "help", value: "Muestra este mensaje de ayuda." }
                );
            await message.channel.send({ embeds: [embed] });
        } else {
            message.reply("Comando no reconocido. Usa `reiniciar`, `apagar`, `git`, `logs` o `help`.");
        }
    }
};