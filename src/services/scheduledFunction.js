const ScheduledFunction = require('../Esquemas/ScheduledFunction.js')

const { getDate } = require('../utils/date.js')

const functionMap = {
  addRound: async (params) => {
    const { addRound } = require('./round.js')
    return await addRound(params)
  },
  // ...
}

/**
* Programa una nueva funciÃ³n para ejecuciÃ³n futura.
* @param {String} functionName - Nombre de la funciÃ³n en functionMap.
* @param {Object} .parameters - ParÃ¡metros para la funciÃ³n (opcional).
* @param {Number} day - DÃ­a de la semana (0=Domingo, 1=Lunes,â€¦,6=SÃ¡bado).
* @param {Number} hour - Hora (0-23).
*/

const addScheduledFunction = async ({
functionName,
parameters = {},
day,
hour
}) => {

if (!functionName || day === undefined || hour === undefined) throw new Error('Faltan datos: functionName, day o hour.')

const scheduledFor = getDate({ day, hour })

const scheduledFunction = new ScheduledFunction({

functionName,

parameters,

scheduledFor

})


await scheduledFunction.save()

}



/**

* Busca y ejecuta todas las funciones programadas cuya fecha ya pasÃ³,

* ejecuta la funciÃ³n correspondiente y elimina el registro de la base de datos.

* Â¡No necesita parÃ¡metros!

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

console.error(`Error ejecutando funcion programada "${job.functionName}":`, err)

}

} else {

console.error(`Funcion no encontrada para "${job.functionName}"`)

}

// Eliminar el job tras ejecutarlo (o intentarlo)

await ScheduledFunction.findByIdAndDelete(job._id)

}

}


module.exports = { addScheduledFunction, executeDueScheduledFunctions }