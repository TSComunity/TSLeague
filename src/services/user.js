const Team = require('../Esquemas/Team.js')
const User = require('../Esquemas/User.js')

const { roles, guild: configGuild } = require('../configs/league.js')


/**
 * Actualiza la elegibilidad de un equipo dependiendo de si tiene al menos 3 miembros y devuelve su elegibilidad.
 * @param {Object} team - Equipo a checkear.
 * @returns {Boolean} isEligible - Si es elegible o no.
 */
const checkUserVerification = async ({ discordId }) => {
    console.log('aaaaaaaa')
    const user = await User.findOne({ discordId })
    if (!user) return false

    const isVerified = !!user.brawlId
    user.isVerified = isVerified
    await user.save()
    return isVerified
}

const verifyUser = async ({ discordId, brawlId }) => {
    if (!discordId || !brawlId) {
        throw new Error('Faltan datos: discordId o brawlId.')
    }
    const user = await User.findOne({ discordId })
    if (!user) {
        await User.create({ discordId, brawlId: brawlId.startsWith('#') ? brawlId.toUpperCase() : `#${brawlId.toUpperCase()}`})
        return
    }
    
    // se puede verificar si existe llamando a la api de brawl

    user.brawlId = brawlId.startsWith('#') ? brawlId.toUpperCase() : `#${brawlId.toUpperCase()}`
    await user.save()
    return user
}


const addPingRoleToUser = async ({ client, discordId }) => {
    if (!client || !discordId) {
        throw new Error('Faltan datos: client o discordId.')
    }

    try {
        // Obtener la Guild usando el ID de tu archivo de configuración
        const guildInstance = await client.guilds.fetch(configGuild.id)

        if (!guildInstance) {
            throw new Error(`No se encontró el servidor con el ID ${configGuild.id}.`)
        }

        // Obtener el rol de ping usando el ID de tu archivo de configuración
        const pingRole = guildInstance.roles.cache.get(roles.ping.id)

        if (!pingRole) {
            throw new Error(`No se encontró un rol con el ID ${roles.ping.id} en el servidor ${guildInstance.name}.`)
        }

        const member = await guildInstance.members.fetch(discordId)

        if (!member) {
            throw new Error(`No se encontró al miembro con el ID ${discordId} en el servidor ${guildInstance.name}.`)
        }

        // Verificar si el miembro ya tiene el rol
        if (member.roles.cache.has(pingRole.id)) {
            return member // Ya lo tiene, no hacemos nada más
        }

        // Añadir el rol
        const updatedMember = await member.roles.add(pingRole)
        console.log(`Rol "${pingRole.name}" añadido a ${updatedMember.user.tag} correctamente.`)
        return updatedMember

    } catch (error) {
        // Propagar el error con un mensaje más descriptivo si es necesario
        throw new Error(`Error al añadir el rol al miembro con ID ${discordId}: ${error.message}`)
    }
}


/**
 * Verifica y añade el rol de ping a todos los miembros de todos los equipos elegibles.
 * Esta función busca los equipos y sus miembros directamente en la base de datos.
 *
 * @param {import('discord.js').Client} client - La instancia del cliente de Discord (tu bot).
 */
const updateUsersPingRole = async ({ client }) => {

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

/**
 * Obtiene el nombre visible de un usuario en un servidor (nickname o username).
 * @param {string} userId - El ID del usuario.
 * @returns {Promise<string>} El nickname si lo tiene, o el username.
 */
const getUserDisplayName = async ({ guild, discordId }) => {
  try {
    const member = await guild.members.fetch(discordId)
    return member.displayName
  } catch (error) {
    throw new Error(`No se pudo obtener el nombre del usuario ${discordId}`)
  }
}

module.exports = { checkUserVerification, verifyUser, addPingRoleToUser, updateUsersPingRole, getUserDisplayName }