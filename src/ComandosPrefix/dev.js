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

        // IDs de PM2 y configuración de rutas
        const botConfigs = {
            comunity: {
                pm2Id: 1,
                name: "TS Comunity",
                // Opción 1: Usar directorio actual (más simple)
                path: "." // El bot ejecutará git pull donde esté corriendo
            },
            league: {
                pm2Id: 10,
                name: "TS League", 
                // Opción 2: Auto-detectar basado en PM2 (si están en directorios separados)
                path: null // Se detectará automáticamente
            }
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
                const botType = interaction.customId === "restart_comunity" ? "comunity" : "league";
                const config = botConfigs[botType];

                await interaction.update({
                    content: `Reiniciando **${config.name}** en 2 segundos...`,
                    embeds: [],
                    components: []
                });

                setTimeout(() => {
                    exec(`pm2 restart ${config.pm2Id}`, (error, stdout, stderr) => {
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
                const botType = interaction.customId === "shutdown_comunity" ? "comunity" : "league";
                const config = botConfigs[botType];

                await interaction.update({
                    content: `Apagando **${config.name}**...`,
                    embeds: [],
                    components: []
                });

                exec(`pm2 stop ${config.pm2Id}`, (error, stdout, stderr) => {
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
                const botType = interaction.customId === "logs_comunity" ? "comunity" : "league";
                const config = botConfigs[botType];

                await interaction.update({
                    content: `Obteniendo logs de **${config.name}**...`,
                    embeds: [],
                    components: []
                });

                exec(`pm2 logs ${config.pm2Id} --lines 20 --nostream`, (error, stdout, stderr) => {
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
            // 🆕 Git pull con auto-detección automática de rutas PM2
            await message.channel.send("🔍 Detectando rutas de los bots automáticamente...");

            exec("pm2 jlist", async (error, stdout, stderr) => {
                if (error) {
                    return message.channel.send(`❌ Error obteniendo info de PM2: \`${error.message}\``);
                }

                try {
                    const processes = JSON.parse(stdout);
                    const botPaths = new Map();
                    
                    // Detectar rutas de los bots configurados
                    processes.forEach(proc => {
                        if (proc.pm_id === 1) { // TS Comunity
                            botPaths.set('comunity', {
                                name: 'TS Comunity',
                                path: proc.pm2_env?.cwd,
                                pm_id: 1
                            });
                        } else if (proc.pm_id === 10) { // TS League
                            botPaths.set('league', {
                                name: 'TS League', 
                                path: proc.pm2_env?.cwd,
                                pm_id: 10
                            });
                        }
                    });

                    if (botPaths.size === 0) {
                        return message.channel.send("❌ No se encontraron los bots con ID 1 y 10 en PM2");
                    }

                    // Mostrar rutas detectadas
                    let detectedInfo = "🔍 **Rutas detectadas:**\n\n";
                    botPaths.forEach(bot => {
                        const pathStatus = bot.path ? `\`${bot.path}\`` : "❌ No detectada";
                        detectedInfo += `**${bot.name}** (PM2 ID: ${bot.pm_id}): ${pathStatus}\n`;
                    });
                    detectedInfo += "\n💡 Selecciona qué repositorio actualizar:";

                    const embed = new EmbedBuilder()
                        .setTitle("Git Pull - Rutas Detectadas")
                        .setColor("#f39c12")
                        .setDescription(detectedInfo);

                    // Crear botones solo para los bots detectados con ruta válida
                    const row = new ActionRowBuilder();
                    let validBots = 0;

                    if (botPaths.has('comunity') && botPaths.get('comunity').path) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId("git_comunity_auto")
                                .setLabel("TS Comunity")
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji("📁")
                        );
                        validBots++;
                    }

                    if (botPaths.has('league') && botPaths.get('league').path) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId("git_league_auto")
                                .setLabel("TS League")
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji("📁")
                        );
                        validBots++;
                    }

                    // Solo agregar botón "Ambos" si hay al menos 2 bots válidos
                    if (validBots >= 2) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId("git_both_auto")
                                .setLabel("Ambos proyectos")
                                .setStyle(ButtonStyle.Success)
                                .setEmoji("🚀")
                        );
                    }

                    if (validBots === 0) {
                        return message.channel.send("❌ No se detectaron rutas válidas para ningún bot");
                    }

                    await message.channel.send({ embeds: [embed], components: [row] });

                    // Collector para manejar la selección
                    const filter = i =>
                        ["git_comunity_auto", "git_league_auto", "git_both_auto"].includes(i.customId) &&
                        i.user.id === message.author.id;
                    const collector = message.channel.createMessageComponentCollector({ filter, time: 20000, max: 1 });

                    collector.on("collect", async interaction => {
                        const selection = interaction.customId;
                        
                        if (selection === "git_both_auto") {
                            // Actualizar ambos proyectos
                            await interaction.update({
                                content: "🔄 Actualizando **ambos repositorios** automáticamente...",
                                embeds: [],
                                components: []
                            });

                            let results = [];
                            for (const [botType, botInfo] of botPaths.entries()) {
                                if (botInfo.path) {
                                    results.push(`\n📁 **${botInfo.name}** (\`${botInfo.path}\`):`);
                                    
                                    try {
                                        const output = await new Promise((resolve, reject) => {
                                            exec(`cd "${botInfo.path}" && git pull`, (error, stdout, stderr) => {
                                                if (error) reject(error);
                                                else resolve(stdout || stderr || "Sin salida");
                                            });
                                        });
                                        results.push(`✅ \`\`\`bash\n${output}\`\`\``);
                                    } catch (error) {
                                        results.push(`❌ Error: \`${error.message}\``);
                                    }
                                }
                            }
                            
                            const finalMessage = results.join('\n');
                            if (finalMessage.length > 1900) {
                                message.channel.send("📋 **Resultados:**" + finalMessage.slice(0, 1900) + "\n...(truncado)");
                            } else {
                                message.channel.send("📋 **Resultados:**" + finalMessage);
                            }
                            
                        } else {
                            // Actualizar un solo proyecto
                            const botType = selection.includes('comunity') ? 'comunity' : 'league';
                            const botInfo = botPaths.get(botType);

                            await interaction.update({
                                content: `🔄 Actualizando **${botInfo.name}** automáticamente...\n📁 Ruta: \`${botInfo.path}\``,
                                embeds: [],
                                components: []
                            });

                            exec(`cd "${botInfo.path}" && git pull`, (error, stdout, stderr) => {
                                if (error) {
                                    return message.channel.send(`❌ Error actualizando ${botInfo.name}: \`${error.message}\``);
                                }
                                
                                const output = stdout || stderr || "Sin salida";
                                message.channel.send(`✅ **${botInfo.name} actualizado:**\n\`\`\`bash\n${output}\n\`\`\``);
                            });
                        }
                    });

                    collector.on("end", collected => {
                        if (collected.size === 0) {
                            message.channel.send("⏰ No se recibió selección, operación cancelada.");
                        }
                    });

                } catch (parseError) {
                    message.channel.send(`❌ Error procesando datos de PM2: \`${parseError.message}\``);
                }
            });

        } else if (subcommand === "help") {
            const embed = new EmbedBuilder()
                .setTitle("Comandos de administración del bot")
                .setColor("#9f38f1")
                .setDescription("Lista de subcomandos disponibles para `dev`:")
                .addFields(
                    { name: "reiniciar", value: "Reinicia TS Comunity o TS League usando PM2 (requiere confirmación)." },
                    { name: "apagar", value: "Apaga TS Comunity o TS League usando PM2 (requiere confirmación)." },
                    { name: "git", value: "🆕 Hace git pull del repositorio seleccionado (Comunity, League o ambos)." },
                    { name: "logs", value: "Muestra los últimos 20 logs del proceso PM2 del bot (elige el bot)." },
                    { name: "help", value: "Muestra este mensaje de ayuda." }
                );
            await message.channel.send({ embeds: [embed] });
        } else {
            message.reply("Comando no reconocido. Usa `reiniciar`, `apagar`, `git`, `logs` o `help`.");
        }
    }
};