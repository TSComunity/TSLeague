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
            // 🆕 NUEVA FUNCIONALIDAD: Git pull con auto-detección de rutas
            const embed = new EmbedBuilder()
                .setTitle("Actualizar desde Git")
                .setColor("#f39c12")
                .setDescription("Selecciona qué repositorio deseas actualizar:")
                .setFooter({ text: "💡 Si no sabes las rutas, usa 'Detectar rutas' primero" });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("git_detect")
                    .setLabel("Detectar rutas PM2")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("🔍"),

            );

            await message.channel.send({ embeds: [embed], components: [row] });

            const filter = i =>
                ["git_current", "git_detect", "git_manual"].includes(i.customId) &&
                i.user.id === message.author.id;
            const collector = message.channel.createMessageComponentCollector({ filter, time: 30000, max: 1 });

            collector.on("collect", async interaction => {
                const selection = interaction.customId;
                
                if (selection === "git_detect") {
                    // Opción 2: Auto-detectar rutas usando PM2
                    await interaction.update({
                        content: "🔍 Detectando rutas de los procesos PM2...",
                        embeds: [],
                        components: []
                    });

                    exec("pm2 jlist", (error, stdout, stderr) => {
                        if (error) {
                            return message.channel.send(`❌ Error obteniendo info de PM2: \`${error.message}\``);
                        }

                        try {
                            const processes = JSON.parse(stdout);
                            let detectedPaths = "🔍 **Rutas detectadas:**\n\n";
                            
                            processes.forEach(proc => {
                                if ([1, 10].includes(proc.pm_id)) {
                                    const botName = proc.pm_id === 1 ? "TS Comunity" : "TS League";
                                    const cwd = proc.pm2_env?.cwd || "No detectada";
                                    detectedPaths += `**${botName}** (ID: ${proc.pm_id}):\n\`${cwd}\`\n\n`;
                                }
                            });
                            
                            detectedPaths += "💡 **¿Quieres hacer git pull en alguna de estas rutas?**";
                            message.channel.send(detectedPaths);
                            
                            // Crear botones para las rutas detectadas
                            const pathButtons = new ActionRowBuilder();
                            processes.forEach(proc => {
                                if ([1, 10].includes(proc.pm_id) && proc.pm2_env?.cwd) {
                                    const botName = proc.pm_id === 1 ? "Comunity" : "League";
                                    pathButtons.addComponents(
                                        new ButtonBuilder()
                                            .setCustomId(`gitpath_${proc.pm_id}`)
                                            .setLabel(`Git pull ${botName}`)
                                            .setStyle(ButtonStyle.Primary)
                                    );
                                }
                            });
                            
                            if (pathButtons.components.length > 0) {
                                message.channel.send({ 
                                    content: "Selecciona en qué proyecto hacer git pull:",
                                    components: [pathButtons] 
                                });
                                
                                // Collector para los botones de rutas
                                const pathFilter = i => 
                                    i.customId.startsWith('gitpath_') && 
                                    i.user.id === message.author.id;
                                const pathCollector = message.channel.createMessageComponentCollector({ 
                                    filter: pathFilter, 
                                    time: 15000, 
                                    max: 1 
                                });
                                
                                pathCollector.on("collect", async pathInteraction => {
                                    const pm2Id = pathInteraction.customId.split('_')[1];
                                    const targetProcess = processes.find(p => p.pm_id == pm2Id);
                                    const targetPath = targetProcess.pm2_env.cwd;
                                    const botName = pm2Id === "1" ? "TS Comunity" : "TS League";
                                    
                                    await pathInteraction.update({
                                        content: `🔄 Ejecutando git pull en **${botName}**...\n📁 Ruta: \`${targetPath}\``,
                                        components: []
                                    });
                                    
                                    exec(`cd "${targetPath}" && git pull`, (error, stdout, stderr) => {
                                        if (error) {
                                            return message.channel.send(`❌ Error en ${botName}: \`${error.message}\``);
                                        }
                                        
                                        const output = stdout || stderr || "Sin salida";
                                        message.channel.send(`✅ **${botName} actualizado:**\n\`\`\`bash\n${output}\n\`\`\``);
                                    });
                                });
                            }
                            
                        } catch (parseError) {
                            message.channel.send(`❌ Error parseando datos de PM2: \`${parseError.message}\``);
                        }
                    });
                    
                } else if (selection === "git_manual") {
                    // Opción 3: Especificar ruta manualmente
                    await interaction.update({
                        content: "✏️ **Especificar ruta manualmente:**\n\nResponde con la ruta donde quieres hacer git pull.\n\n💡 Ejemplos:\n• `~/mi-proyecto`\n• `/home/usuario/ts-bot`\n• `../otro-directorio`\n\n⏰ Tienes 30 segundos...",
                        embeds: [],
                        components: []
                    });

                    const msgFilter = m => m.author.id === message.author.id;
                    const msgCollector = message.channel.createMessageCollector({ 
                        filter: msgFilter, 
                        time: 30000, 
                        max: 1 
                    });

                    msgCollector.on('collect', userMsg => {
                        const userPath = userMsg.content.trim();
                        
                        userMsg.reply(`🔄 Ejecutando git pull en: \`${userPath}\``);
                        
                        exec(`cd "${userPath}" && git pull`, (error, stdout, stderr) => {
                            if (error) {
                                return message.channel.send(`❌ Error: \`${error.message}\`\n💡 Verifica que la ruta existe y es un repositorio git`);
                            }
                            
                            const output = stdout || stderr || "Sin salida";
                            message.channel.send(`✅ **Git pull completado en** \`${userPath}\`:\n\`\`\`bash\n${output}\n\`\`\``);
                        });
                    });

                    msgCollector.on('end', collected => {
                        if (collected.size === 0) {
                            message.channel.send("⏰ Tiempo agotado. No se especificó ninguna ruta.");
                        }
                    });
                }
            });

            collector.on("end", collected => {
                if (collected.size === 0) {
                    message.channel.send("⏰ No se recibió confirmación, operación cancelada.");
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