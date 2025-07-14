const ScheduledFunction = require('../Esquemas/ScheduledFunction.js')

const { getNextDayAndHour } = require('../utils/getNextDayAndHour.js')

const functionMap = {
  addRound: require('./round.js').addRound,
  // otras funciones programadas
}

/**
 * Programa una nueva función para ejecución futura.
 * @param {String} functionName - Nombre de la función en functionMap.
 * @param {Object} .parameters - Parámetros para la función (opcional).
 * @param {Number} day - Día de la semana (0=Domingo, 1=Lunes,…,6=Sábado).
 * @param {Number} hour - Hora (0-23).
 */
const addScheduledFunction = async ({
    functionName,
    parameters = {},
    day,
    hour
}) => {
    if (!functionName || day === undefined || hour === undefined) throw new Error('Faltan datos: functionName, day o hour.')

    const scheduledFor = getNextDayAndHour({ day, hour })
    const scheduledFunction = new ScheduledFunction({
    functionName,
    parameters,
    scheduledFor
    })
    
    await scheduledFunction.save()
}

/**
 * Busca y ejecuta todas las funciones programadas cuya fecha ya pasó,
 * ejecuta la función correspondiente y elimina el registro de la base de datos.
 * ¡No necesita parámetros!
 */
const executeDueScheduledFunctions = async ({ client }) => {
  const now = new Date()
  const dueFunctions = await ScheduledFunction.find({ scheduledFor: { $lte: now } })

  for (const job of dueFunctions) {
    const fn = functionMap[job.functionName]
    if (typeof fn === 'function') {
      try {
        await Promise.resolve(fn({ ...job.parameters, client }))
      } catch (err) {
        console.error(`Error ejecutando función programada "${job.functionName}":`, err)
      }
    } else {
      console.error(`Función no encontrada para "${job.functionName}"`)
    }
    // Eliminar el job tras ejecutarlo (o intentarlo)
    await ScheduledFunction.findByIdAndDelete(job._id)
  }
}

module.exports = { addScheduledFunction, executeDueScheduledFunctions }