// services/dates.js
// Version completa del archivo con getDate, getDateThisWeek y checkDeadline.
// Nota: aquí **domingo = 0** y los días se pasan como 0..6 (0=domingo, 1=lunes, ..., 6=sábado)

const { DateTime } = require('luxon')
const configs = require('../configs/league.js')

/**
 * Devuelve la fecha del siguiente día y hora en horario de Madrid.
 * Ej: si hoy ya ha pasado la hora, te lo manda a la semana siguiente.
 *
 * @param {Object} opts
 * @param {Number} opts.day - Día de la semana (0=domingo, 1=lunes, ..., 6=sábado)
 * @param {Number} [opts.hour=0] - Hora del día (0-23)
 * @param {Number} [opts.minute=0] - Minuto (0-59)
 * @param {Date} [now=new Date()] - (opcional) fecha de referencia para tests
 * @returns {Date}
 */
const getDate = ({ day, hour = 0, minute = 0 }, now = new Date()) => {
  if (!Number.isInteger(day) || day < 0 || day > 6)
    throw new Error("El parámetro 'day' debe ser un número entre 0 y 6 (0=domingo).")
  if (!Number.isInteger(hour) || hour < 0 || hour > 23)
    throw new Error("El parámetro 'hour' debe estar entre 0 y 23.")
  if (!Number.isInteger(minute) || minute < 0 || minute > 59)
    throw new Error("El parámetro 'minute' debe estar entre 0 y 59.")

  const dt = DateTime.fromJSDate(now).setZone('Europe/Madrid')

  // Luxon weekday: 1 (lunes) ... 7 (domingo)
  // Convertimos a 0..6 con 0=domingo:
  const todayWeekday = dt.weekday % 7 // domingo -> 0, lunes -> 1, ..., sábado -> 6

  let daysToAdd = (day - todayWeekday + 7) % 7

  // Si es el mismo día y la hora ya pasó, moverse a la próxima semana
  if (daysToAdd === 0) {
    const sameDayTarget = dt.set({ hour, minute, second: 0, millisecond: 0 })
    if (sameDayTarget <= dt) {
      daysToAdd = 7
    }
  }

  const scheduled = dt.plus({ days: daysToAdd }).set({
    hour,
    minute,
    second: 0,
    millisecond: 0
  })

  return scheduled.toJSDate()
}

/**
 * Devuelve la fecha correspondiente al día/hora indicado DENTRO de la semana actual.
 * - Semana considerada: domingo (0) .. sábado (6).
 * - Si el día/hora ya pasó en la semana actual, por defecto NO lo mueve a la siguiente semana.
 *   (Si quieres la versión que lo mueva, pásale { allowNextWeek: true } como 4º parámetro.)
 *
 * @param {Object} opts
 * @param {Number} opts.day - 0..6 (0=domingo)
 * @param {Number} [opts.hour=0]
 * @param {Number} [opts.minute=0]
 * @param {Date} [now=new Date()]
 * @param {Object} [options] - { allowNextWeek: boolean } (por defecto false)
 * @returns {Date}
 */
const getDateThisWeek = ({ day, hour = 0, minute = 0 }, now = new Date(), options = {}) => {
  const { allowNextWeek = false } = options

  if (!Number.isInteger(day) || day < 0 || day > 6)
    throw new Error("getDateThisWeek: 'day' debe ser 0..6 (0=domingo).")
  if (!Number.isInteger(hour) || hour < 0 || hour > 23)
    throw new Error("getDateThisWeek: 'hour' debe estar entre 0 y 23.")
  if (!Number.isInteger(minute) || minute < 0 || minute > 59)
    throw new Error("getDateThisWeek: 'minute' debe estar entre 0 y 59.")

  const dt = DateTime.fromJSDate(now).setZone('Europe/Madrid')

  // Queremos semana domingo..sábado.
  // Luxon weekday: 1 (lunes) .. 7 (domingo). Convertimos a offset desde domingo:
  const daysFromSunday = dt.weekday % 7 // domingo -> 0, lunes -> 1, ..., sábado -> 6
  const weekStart = dt.minus({ days: daysFromSunday }).startOf('day') // domingo 00:00

  // day: 0..6 donde 0 = domingo
  let scheduled = weekStart.plus({ days: day }).set({
    hour,
    minute,
    second: 0,
    millisecond: 0
  })

  if (allowNextWeek && scheduled <= dt) {
    scheduled = scheduled.plus({ days: 7 })
  }

  return scheduled.toJSDate()
}

/**
 * checkDeadline: determina si el plazo (deadline) de ESTA semana ya ha pasado.
 * - Si el match tiene scheduledAt -> skip.
 * - Usa getDateThisWeek para calcular el deadline de esta semana (semana domingo..sábado).
 *
 * @param {Object} match - documento match (puede ser Mongoose doc o plain object)
 * @param {Date} [now=new Date()]
 * @returns {{ passed: boolean, deadline: Date, defaultDate: Date }}
 */
function checkDeadline(match, now = new Date()) {
  // Log básico para depuración
  console.log('[checkDeadline] match:', match && match._id ? match._id.toString() : '(sin id)')

  if (match && match.scheduledAt) {
    console.log('[checkDeadline] match ya tiene scheduledAt -> skip')
    return { passed: false, deadline: null, defaultDate: match.scheduledAt }
  }

  const luxonNow = DateTime.fromJSDate(now).setZone('Europe/Madrid')

  // Deadline de ESTA semana (domingo..sábado)
  const deadlineDate = getDateThisWeek({
    day: configs.match.deadlineDay,
    hour: configs.match.deadlineHour,
    minute: configs.match.deadlineMinute
  }, now, { allowNextWeek: false }) // NO mover a siguiente semana

  const luxonDeadline = DateTime.fromJSDate(deadlineDate).setZone('Europe/Madrid')

  // Fecha por defecto de ESTA semana (también dentro de esta semana)
  const defaultDay =
    configs.match.defaultStartDays[
      Math.floor(Math.random() * configs.match.defaultStartDays.length)
    ]
  const defaultDateRaw = getDateThisWeek({
    day: defaultDay,
    hour: configs.match.defaultStartHour,
    minute: 0
  }, now, { allowNextWeek: false })

  const defaultDate = DateTime.fromJSDate(defaultDateRaw).setZone('Europe/Madrid').toJSDate()

  // Logs detallados
  console.log('[checkDeadline] now:', luxonNow.toISO())
  console.log('[checkDeadline] deadlineThisWeek:', luxonDeadline.toISO())
  console.log('[checkDeadline] defaultDateThisWeek:', DateTime.fromJSDate(defaultDate).toISO())

  // passed = true si ya ha pasado el deadline de ESTA semana
  const passed = luxonNow.toMillis() > luxonDeadline.toMillis()

  console.log('[checkDeadline] result -> passed:', passed)

  return {
    passed,
    deadline: deadlineDate,
    defaultDate
  }
}

module.exports = { getDate, getDateThisWeek, checkDeadline }