/**
 * Devuelve la fecha del siguiente dia y hora en sistema es-ES.
 * @param {Number} day - dia de la semana en numero.
 * @param {Number} hour - hora del dia en numero (sin minutos).
 * @returns {Date} madridTime - fecha del siguiente dia y hora.
 */

const getNextDayAndHour = ({ day, hour }) => {
    // Verificar tipo y valor de day
  if (typeof day !== "number" || !Number.isInteger(day)) {
    throw new TypeError("El día debe ser un número entero");
  }
  if (![5, 6, 0].includes(day)) {
    throw new RangeError("El día debe ser 5, 6 o 0");
  }

  // Verificar tipo y valor de hour
  if (typeof hour !== "number" || !Number.isInteger(hour)) {
    throw new TypeError("La hora debe ser un número entero");
  }
  if (hour < 0 || hour > 23) {
    throw new RangeError("La hora debe estar entre 0 y 23");
  }

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