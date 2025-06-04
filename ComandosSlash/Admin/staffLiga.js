const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const equiposData = require('../../Esquemas/SchemaEquipos'); // Ajusta según tu estructura

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staffliga')
        .setDescription('Comandos de administración de StaffLiga')
        .addSubcommand(subcommand =>
            subcommand
                .setName('divisiones')
                .setDescription('Asignar división a un equipo')
                .addStringOption(option =>
                    option.setName('equipo')
                        .setDescription('Nombre del equipo')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('division')
                        .setDescription('División a asignar')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Division A', value: 'Division A' },
                            { name: 'Division B', value: 'Division B' }
                        ))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('puntos')
                .setDescription('Administrar puntos de un equipo')
                .addStringOption(option =>
                    option.setName('accion')
                        .setDescription('Acción a realizar con los puntos')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Agregar', value: 'agregar' },
                            { name: 'Remover', value: 'remover' },
                            { name: 'Ver', value: 'ver' },
                        ))
                .addStringOption(option =>
                    option.setName('equipo')
                        .setDescription('Nombre del equipo')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addIntegerOption(option =>
                    option.setName('cantidad')
                        .setDescription('Cantidad de puntos (no necesario para ver)')
                        .setRequired(false)
                        .setMinValue(1))
        ),

    async execute(interaction) {
        const logChannelId = '1374691378604277760';
        const logChannel = await interaction.client.channels.fetch(logChannelId).catch(() => null);

        if (interaction.options.getSubcommand() === 'divisiones') {
            // Mismo código para divisiones (sin cambios)
            const nombreEquipo = interaction.options.getString('equipo');
            const divisionSin = interaction.options.getString('division');
            const division = divisionSin.replace('Division ', '');  // Esto quita "Division "



            const equipo = await equiposData.findOne({ Nombre: nombreEquipo });
            if (!equipo) {
                return interaction.reply({
                    content: `❌ No se encontró un equipo con el nombre **${nombreEquipo}**.`,
                    ephemeral: true
                });
            }

            equipo.Division = division;
            await equipo.save();

            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🔰 División asignada')
                    .setColor('#00FF7F')
                    .setDescription(`Se ha asignado la **${division}** al equipo **${nombreEquipo}**.`)
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setFooter({ text: 'StaffLiga | Sistema de División' })
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }

            return interaction.reply({
                content: `✅ El equipo **${nombreEquipo}** ha sido asignado a **${division}**.`,
                ephemeral: true
            });
        } 
        
        else if (interaction.options.getSubcommand() === 'puntos') {
            const accion = interaction.options.getString('accion');
            const nombreEquipo = interaction.options.getString('equipo');
            const cantidad = interaction.options.getInteger('cantidad');

            const equipo = await equiposData.findOne({ Nombre: nombreEquipo });
            if (!equipo) {
                return interaction.reply({
                    content: `❌ No se encontró un equipo con el nombre **${nombreEquipo}**.`,
                    ephemeral: true
                });
            }

            switch(accion) {
                case 'agregar':
                    if (!cantidad) {
                        return interaction.reply({ content: '❌ Debes especificar la cantidad de puntos para agregar.', ephemeral: true });
                    }
                    equipo.Puntos = (equipo.Puntos || 0) + cantidad;
                    await equipo.save();

                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('⭐ Puntos agregados')
                            .setColor('#00FF00')
                            .setDescription(`Se han agregado **${cantidad} puntos** al equipo **${nombreEquipo}**.\nTotal actual: **${equipo.Puntos} puntos**.`)
                            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                            .setFooter({ text: 'StaffLiga | Sistema de Puntos' })
                            .setTimestamp();

                        await logChannel.send({ embeds: [embed] });
                    }

                    return interaction.reply({
                        content: `✅ Se agregaron **${cantidad} puntos** al equipo **${nombreEquipo}**.\nTotal actual: **${equipo.Puntos} puntos**.`,
                        ephemeral: true
                    });

                case 'remover':
                    if (!cantidad) {
                        return interaction.reply({ content: '❌ Debes especificar la cantidad de puntos para remover.', ephemeral: true });
                    }
                    equipo.Puntos = Math.max((equipo.Puntos || 0) - cantidad, 0);
                    await equipo.save();

                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('⚠️ Puntos removidos')
                            .setColor('#FF4500')
                            .setDescription(`Se han removido **${cantidad} puntos** al equipo **${nombreEquipo}**.\nTotal actual: **${equipo.Puntos} puntos**.`)
                            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                            .setFooter({ text: 'StaffLiga | Sistema de Puntos' })
                            .setTimestamp();

                        await logChannel.send({ embeds: [embed] });
                    }

                    return interaction.reply({
                        content: `✅ Se removieron **${cantidad} puntos** al equipo **${nombreEquipo}**.\nTotal actual: **${equipo.Puntos} puntos**.`,
                        ephemeral: true
                    });

                case 'ver':
                    const puntos = equipo.Puntos || 0;
                    return interaction.reply({
                        content: `ℹ️ El equipo **${nombreEquipo}** tiene **${puntos} puntos** actualmente.`,
                        ephemeral: true
                    });

                default:
                    return interaction.reply({ content: '❌ Acción no válida.', ephemeral: true });
            }
        }
    },

    async autocomplete(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Aplica autocomplete para equipos en ambos subcomandos divison y puntos
        if (subcommand === 'divisiones' || subcommand === 'puntos') {
            // Cuando la opción en foco es 'equipo' hacemos autocomplete
            const focusedOption = interaction.options.getFocused(true);
            if (focusedOption.name === 'equipo') {
                const focusedValue = focusedOption.value;
                const equipos = await equiposData.find({
                    Nombre: { $regex: `^${focusedValue}`, $options: 'i' }
                }).limit(25);

                const choices = equipos.map(e => ({ name: e.Nombre, value: e.Nombre }));
                await interaction.respond(choices);
            }
        }
    }
};