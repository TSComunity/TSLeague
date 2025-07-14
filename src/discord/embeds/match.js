const { EmbedBuilder } = require('discord.js')
const modesData = require('../../configs/gameModes.json')

function getModeOrMapName(id, type) {
    if (!id) return 'N/A'; // Si no hay ID, devuelve "N/A"

    if (type === 'mode') {
        const mode = modesData.find(m => m.id === id);
        return mode ? mode.name : 'Desconocido';
    } else if (type === 'map') {
        // Itera sobre todos los modos para encontrar el mapa
        for (const mode of modesData) {
            const map = mode.maps.find(m => m.id === id);
            if (map) return map.name;
        }
        return 'Desconocido';
    }
    return 'N/A';
}

const getMatchScheduledEmbed = ({ match }) => {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    )
}

const getMatchCancelledEmbed = ({ match }) => {
    return (
        new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Mantenimiento')
    )
}

const getMatchInfoEmbed = ({ match }) => {
    const { teamAId, teamBId, matchIndex, scoreA, scoreB, scheduledAt, status, set1, set2, set3 }

    const miliseconds = scheduledAt.getTime()

    const time = Math.floor(miliseconds / 1000)

    const set1ModeName = set1 ? getModeOrMapName(set1.modeId, 'mode') : 'N/A';
    const set1MapName = set1 ? getModeOrMapName(set1.mapId, 'map') : 'N/A';

    const set2ModeName = set2 ? getModeOrMapName(set2.modeId, 'mode') : 'N/A';
    const set2MapName = set2 ? getModeOrMapName(set2.mapId, 'map') : 'N/A';

    const set3ModeName = set3 ? getModeOrMapName(set3.modeId, 'mode') : 'N/A';
    const set3MapName = set3 ? getModeOrMapName(set3.mapId, 'map') : 'N/A';

    return (
        new EmbedBuilder()
            .setColor(() => {
                if (status === 'scheduled') return 'Yellow'
                if (status === 'cancelled') return 'Red'
                if (status === 'ended') return 'Green'
            }())
            .setDescription(`## ${match.teamAId.name} vs ${match.teamBId.name}`)
            .addFields(
                { name: 'Indice', value: `\`${matchIndex}\``, inline: true },
                { name: 'Horario', value: `<t:${time}>`, inline: true },
                { name: 'Estado', value: (() => {
                    if (status === 'scheduled') return '\`Programado\`'
                    if (status === 'cancelled') return '\`Cancelado\`'
                    if (status === 'ended') return '\`Terminado\`'
                })(), inline: true },

                { name: 'Set 1', value: `> Modo: \`${set1ModeName}\`\n> Mapa: \`${set1MapName}\``, inline: false },
                { name: 'Set 2', value: `> Modo: \`${set2ModeName}\`\n> Mapa: \`${set2MapName}\``, inline: false },
                { name: 'Set 3', value: `> Modo: \`${set3ModeName}\`\n> Mapa: \`${set3MapName}\``, inline: false }
            )
    )
}

module.exports = { getMatchScheduledEmbed, getMatchCancelledEmbed, getMatchInfoEmbed }