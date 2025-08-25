const { DateTime } = require('luxon')
const configs = require('../configs/league.js')

/**
 * Devuelve la fecha del siguiente día y hora en horario de Madrid.
 * @param {Number} day - Día de la semana (0=domingo, 1=lunes, ..., 6=sábado)
 * @param {Number} hour - Hora del día (0-23)
 * @param {Number} minute - Minuto (0-59, opcional, por defecto 0)
 * @returns {Date} - Objeto Date en horario local con zona Madrid
 */
const getDate = ({ day, hour = 0, minute = 0 }) => {
  if (!Number.isInteger(day) || day < 0 || day > 6)
    throw new Error("El parámetro 'day' debe ser un número entre 0 y 6.")

  if (!Number.isInteger(hour) || hour < 0 || hour > 23)
    throw new Error("El parámetro 'hour' debe estar entre 0 y 23.")

  if (!Number.isInteger(minute) || minute < 0 || minute > 59)
    throw new Error("El parámetro 'minute' debe estar entre 0 y 59.")

  // Fecha actual en zona Madrid
  const now = DateTime.now().setZone('Europe/Madrid')

  // Día de la semana actual (0 = domingo)
  const todayWeekday = now.weekday % 7

  // Cuántos días faltan hasta el próximo día solicitado
  let daysToAdd = (day - todayWeekday + 7) % 7
  if (daysToAdd === 0 && (hour < now.hour || (hour === now.hour && minute <= now.minute))) {
    daysToAdd = 7 // Si es hoy pero ya pasó la hora, ir a la semana siguiente
  }

  // Crear el DateTime objetivo
  const scheduled = now.plus({ days: daysToAdd }).set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  })

  // Convertir a objeto Date para guardar en Mongo
  return scheduled.toJSDate()
}

/**
 * Checks if the deadline for proposing/accepting a schedule has already passed
 * and calculates the default date in case no agreement is reached.
 * 
 * @param {Date} [now=new Date()] - Current date
 * @returns {Object} { passed, deadline, defaultDate }
 */
function checkDeadline(match, now = new Date()) {
  if (match.scheduledAt) {
    // Ya tiene fecha, no hace falta aplicar la por defecto
    return { passed: false, deadline: null, defaultDate: match.scheduledAt }
  }

  // Deadline (jueves 23:59, por ejemplo)
  const deadline = getDate({
    day: configs.match.deadlineDay,
    hour: configs.match.deadlineHour,
    minute: configs.match.deadlineMinute
  })

  // Fecha por defecto (sábado 19:00, por ejemplo)
  const defaultDate = getDate({
    day: configs.match.defaultStartDay,
    hour: configs.match.defaultStartHour,
    minute: 0
  })

  return {
    passed: now > deadline,
    deadline,
    defaultDate
  }
}

module.exports = { getDate, checkDeadline }