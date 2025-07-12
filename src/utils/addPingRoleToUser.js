const { roles, guild: configGuild } = require('../configs/league.js')

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
        throw new Error(`Error al añadir/verificar el rol al miembro con ID ${discordId}: ${error.message}`)
    }
}

module.exports = { addPingRoleToUser }