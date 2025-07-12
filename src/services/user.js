const User = require('../Esquemas/User.js')

/**
 * Actualiza la elegibilidad de un equipo dependiendo de si tiene al menos 3 miembros y devuelve su elegibilidad.
 * @param {Object} team - Equipo a checkear.
 * @returns {Boolean} isEligible - Si es elegible o no.
 */
const checkUserVerification = async ({ discordId }) => {
    const user = await User.findOne({ discordId })
    if (!user) throw new Error('No se encontro el usuario.')

    const isVerified = (user.brawlId)
    user.isVerified = isVerified
    await user.save()
    return isVerified
}

const verifyUser = async ({ discordId, brawlId }) => {
    const user = await User.findOne({ discordId })
    if (!user) throw new Error('No se encontro el usuario.')
    
    // se puede verificar si existe llamando a la api de brawl

    user.brawlId = brawlId
    await user.save()
    return user
}

module.exports = { checkUserVerification, verifyUser }