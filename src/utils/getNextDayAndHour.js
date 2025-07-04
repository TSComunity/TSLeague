/**
 * Devuelve la fecha del siguiente dia y hora en sistema es-ES.
 * @param {Number} day - dia de la semana en numero.
 * @param {Number} hour - hora del dia en numero (sin minutos).
 * @returns {Date} madridTime - fecha del siguiente dia y hora.
 */

const getNextDayAndHour = ({ day, hour }) => {
  const now = new Date()

  // Cuántos días faltan para el próximo dia
  const daysUntilMonday = (8 - day) % 7 || 7

  // Crear fecha base
  const nextMonday = new Date(now)
  nextMonday.setDate(now.getDate() + daysUntilMonday)
  nextMonday.setHours(hour, 0, 0, 0)

  // Corregir a horario de España
  const madridTime = new Date(nextMonday.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }))

  return madridTime
}

module.exports = { getNextDayAndHour }