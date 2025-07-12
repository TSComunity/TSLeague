const { addPingRoleToUser } = require('./addPingRoleToUser.js')
const { roles } = require('../configs/league.js')
const Team = require('../Esquemas/Team.js')
const User = require('../Esquemas/User.js')

/**
 * Verifica y añade el rol de ping a todos los miembros de todos los equipos elegibles.
 * Esta función busca los equipos y sus miembros directamente en la base de datos.
 *
 * @param {import('discord.js').Client} client - La instancia del cliente de Discord (tu bot).
 */
const updateTeamsPingRole = async ({ client }) => {

    if (!client) {
        throw new Error('Faltan datos: client.')
    }

    const PING_ROLE_ID = roles.ping.id

    try {
        const teams = await Team.find({}).populate({
            path: 'members.userId',
            model: 'User', // El modelo a poblar
            select: 'discordId' // Solo necesitamos el discordId del usuario
        })

        if (!teams || teams.length === 0) {
            throw new Error('Advertencia: No se encontraron equipos en la base de datos.')
        }

        for (const team of teams) {
            if (!team.members || team.members.length === 0) return

            for (const teamMember of team.members) {
                // teamMember.userId será el objeto User poblado, o null si no se pudo poblar
                const userId = teamMember.userId?.discordId

                if (!userId) continue

                try {
                    // Llama a tu función `addPingRoleToUser`
                    const updatedMember = await addPingRoleToUser({ client, discordId: userId })
                } catch (memberError) {
                    throw new Error(`❌ Error procesando el rol para el usuario ${userId} en el equipo ${team.name}: ${memberError.message}`)
                }
            }
        }
    } catch (error) {
        throw new Error(`❌ Error al obtener los equipos o procesar roles: ${error.message}`)
    }
}

module.exports = { updateTeamsPingRole }