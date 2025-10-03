const { DateTime } = require('luxon')
const configs = require('../configs/league.js')

/**
 * Devuelve la fecha del siguiente día y hora en horario de Madrid.
 * Ej: si hoy ya ha pasado la hora, te lo manda a la semana siguiente.
 * 
 * @param {Number} day - Día de la semana (0=domingo, 1=lunes, ..., 6=sábado)
 * @param {Number} hour - Hora del día (0-23)
 * @param {Number} minute - Minuto (0-59, opcional, por defecto 0)
 * @returns {Date}
 */
const getDate = ({ day, hour = 0, minute = 0 }) => {
  if (!Number.isInteger(day) || day < 0 || day > 6)
    throw new Error("El parámetro 'day' debe ser un número entre 0 y 6.")
  if (!Number.isInteger(hour) || hour < 0 || hour > 23)
    throw new Error("El parámetro 'hour' debe estar entre 0 y 23.")
  if (!Number.isInteger(minute) || minute < 0 || minute > 59)
    throw new Error("El parámetro 'minute' debe estar entre 0 y 59.")

  const now = DateTime.now().setZone('Europe/Madrid')
  const todayWeekday = now.weekday % 7 // luxon: weekday = 1 (lunes)...7 (domingo)
  let daysToAdd = (day - todayWeekday + 7) % 7

  if (daysToAdd === 0 && (hour < now.hour || (hour === now.hour && minute <= now.minute))) {
    daysToAdd = 7 // si ya pasó la hora de hoy → semana que viene
  }

  const scheduled = now.plus({ days: daysToAdd }).set({
    hour,
    minute,
    second: 0,
    millisecond: 0
  })

  return scheduled.toJSDate()
}

/**
 * Variante: devuelve la fecha en la SEMANA ACTUAL (lunes-domingo).
 * Si ya pasó, la mueve a la semana siguiente.
 */
const getDateThisWeek = ({ day, hour = 0, minute = 0 }) => {
  const now = DateTime.now().setZone('Europe/Madrid')
  const luxonDay = day === 0 ? 7 : day // luxon usa 1=lunes ... 7=domingo
  const weekStart = now.startOf('week') // lunes 00:00
  let scheduled = weekStart.plus({ days: luxonDay - 1 }).set({
    hour,
    minute,
    second: 0,
    millisecond: 0
  })

  if (scheduled <= now) {
    scheduled = scheduled.plus({ days: 7 }) // mover a la siguiente semana
  }

  return scheduled.toJSDate()
}

/**
 * Comprueba si pasó el deadline y calcula la fecha por defecto.
 * 
 * @param {Object} match
 * @param {Date} [now=new Date()]
 * @returns {Object} { passed, deadline, defaultDate }
 */
function checkDeadline(match, now = new Date()) {
  if (match.scheduledAt) {
    return { passed: false, deadline: null, defaultDate: match.scheduledAt }
  }

  const luxonNow = DateTime.fromJSDate(now).setZone('Europe/Madrid')

  // Deadline = viernes de ESTA semana
  const deadline = getDateThisWeek({
    day: configs.match.deadlineDay,
    hour: configs.match.deadlineHour,
    minute: configs.match.deadlineMinute
  })

  // Default date = finde de ESTA semana
  let defaultDate = getDateThisWeek({
    day: configs.match.defaultStartDays[Math.floor(Math.random() * configs.match.defaultStartDays.length)],
    hour: configs.match.defaultStartHour,
    minute: 0
  })

  // Si ya pasó la fecha por defecto → semana siguiente
  if (DateTime.fromJSDate(defaultDate) <= luxonNow) {
    defaultDate = DateTime.fromJSDate(defaultDate).plus({ days: 7 }).toJSDate()
  }

  return {
    passed: luxonNow.toJSDate() > deadline,
    deadline,
    defaultDate
  }
}

module.exports = { getDate, getDateThisWeek, checkDeadline }
