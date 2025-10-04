  // services/dates.js
  // Versión definitiva: determinista, sin sorpresas los domingos,
  // defaultDate = próxima ocurrencia (entre defaultStartDays) -> la más cercana en el futuro
  // deadline = última ocurrencia pasada (<= now) del día/hora configurado
  // Logs mínimos incluidos para depuración.

  const { DateTime } = require('luxon')
  const configs = require('../configs/league.js')

  function validateConfigs() {
    if (!configs || !configs.match) throw new Error('configs.match no está definido')
    const m = configs.match
    if (!Number.isInteger(m.deadlineDay) || m.deadlineDay < 0 || m.deadlineDay > 6)
      throw new Error(`configs.match.deadlineDay inválido (${m.deadlineDay}). Debe ser 0..6 (0=domingo).`)
    if (!Number.isInteger(m.deadlineHour) || m.deadlineHour < 0 || m.deadlineHour > 23)
      throw new Error(`configs.match.deadlineHour inválido (${m.deadlineHour}). Debe ser 0..23.`)
    if (!Number.isInteger(m.deadlineMinute) || m.deadlineMinute < 0 || m.deadlineMinute > 59)
      throw new Error(`configs.match.deadlineMinute inválido (${m.deadlineMinute}). Debe ser 0..59.`)

    if (m.defaultStartDays) {
      if (!Array.isArray(m.defaultStartDays) || m.defaultStartDays.some(d => !Number.isInteger(d) || d < 0 || d > 6))
        throw new Error('configs.match.defaultStartDays debe ser Array de enteros 0..6 (0=domingo).')
    }
  }

  /**
   * Helpers de mapeo:
   * - Luxon: weekday = 1 (lunes) .. 7 (domingo)
   * - Aquí usamos índice 0=domingo .. 6=sábado (como tus configs)
   */
  function luxonWeekdayToIndex(luxonWeekday) {
    return luxonWeekday % 7 // domingo (7) -> 0, lunes (1)->1.. sábado(6)->6
  }

  /**
   * getNextOccurrence(day, hour, minute, now)
   * - Devuelve la próxima ocurrencia FUTURA del weekday `day` (0=domingo..6=sábado)
   *   Si hoy es el día objetivo y la hora objetivo aún no ha pasado -> devuelve hoy a esa hora.
   *   Si ya pasó -> devuelve la misma día en la semana siguiente.
   */
  function getNextOccurrence(day, hour = 0, minute = 0, now = new Date()) {
    if (!Number.isInteger(day) || day < 0 || day > 6) throw new Error("getNextOccurrence: 'day' debe ser 0..6 (0=domingo)")
    const dtNow = DateTime.fromJSDate(now).setZone('Europe/Madrid')
    const todayIdx = luxonWeekdayToIndex(dtNow.weekday)

    let daysToAdd = (day - todayIdx + 7) % 7

    // si es el mismo día, comprueba la hora
    const targetSameDay = dtNow.set({ hour, minute, second: 0, millisecond: 0 })
    if (daysToAdd === 0 && targetSameDay <= dtNow) {
      // ya ha pasado hoy -> next week
      daysToAdd = 7
    }

    const result = dtNow.plus({ days: daysToAdd }).set({ hour, minute, second: 0, millisecond: 0 })
    return result.toJSDate()
  }

  /**
   * getPreviousOccurrence(day, hour, minute, now)
   * - Devuelve la última ocurrencia PASADA (<= now) del weekday `day`.
   *   Si hoy es el día objetivo y la hora objetivo es > now, devuelve la semana anterior.
   */
  function getPreviousOccurrence(day, hour = 0, minute = 0, now = new Date()) {
    if (!Number.isInteger(day) || day < 0 || day > 6) throw new Error("getPreviousOccurrence: 'day' debe ser 0..6 (0=domingo)")
    const dtNow = DateTime.fromJSDate(now).setZone('Europe/Madrid')
    const todayIdx = luxonWeekdayToIndex(dtNow.weekday)

    let daysBack = (todayIdx - day + 7) % 7
    let candidate = dtNow.minus({ days: daysBack }).set({ hour, minute, second: 0, millisecond: 0 })

    // si candidate > now (ocurre en el futuro del mismo día), retroceder una semana
    if (candidate > dtNow) {
      candidate = candidate.minus({ weeks: 1 })
    }

    return candidate.toJSDate()
  }

  /**
   * pickClosestNextDay(defaultDayList, hour, minute, now)
   * - De la lista de dias permitidos, elige el que tenga la próxima ocurrencia más cercana en el tiempo.
   * - Devuelve { day, date }
   * - Esto evita usar random que introduce variabilidad indeseada.
   */
  function pickClosestNextDay(defaultDayList, hour = 0, minute = 0, now = new Date()) {
    if (!Array.isArray(defaultDayList) || defaultDayList.length === 0) {
      throw new Error('pickClosestNextDay: defaultDayList debe ser array no vacío')
    }

    const dtNow = DateTime.fromJSDate(now).setZone('Europe/Madrid')
    let best = null
    for (const d of defaultDayList) {
      if (!Number.isInteger(d) || d < 0 || d > 6) continue
      const candidateDate = DateTime.fromJSDate(getNextOccurrence(d, hour, minute, now)).setZone('Europe/Madrid')
      const diffMs = candidateDate.toMillis() - dtNow.toMillis()
      if (diffMs < 0) continue // no debería ocurrir, pero por seguridad ignoramos negativos
      if (!best || diffMs < best.diffMs) {
        best = { day: d, date: candidateDate.toJSDate(), diffMs }
      }
    }

    if (!best) {
      // fallback: tomar la primera y usar getNextOccurrence (no debería pasar)
      const fallbackDay = defaultDayList[0]
      return { day: fallbackDay, date: getNextOccurrence(fallbackDay, hour, minute, now) }
    }

    return { day: best.day, date: best.date }
  }

  function getDate({ day, hour = 0, minute = 0 }, now = new Date()) {
  if (!Number.isInteger(day) || day < 0 || day > 6)
    throw new Error("El parámetro 'day' debe ser un número entre 0 y 6 (0=domingo).")
  if (!Number.isInteger(hour) || hour < 0 || hour > 23)
    throw new Error("El parámetro 'hour' debe estar entre 0 y 23.")
  if (!Number.isInteger(minute) || minute < 0 || minute > 59)
    throw new Error("El parámetro 'minute' debe estar entre 0 y 59.")

  const dtNow = DateTime.fromJSDate(now).setZone('Europe/Madrid')
  const todayIdx = dtNow.weekday % 7 // Luxon: 1=lunes .. 7=domingo -> 0..6 con domingo=0

  let daysToAdd = (day - todayIdx + 7) % 7

  // Si es el mismo día, comprobar la hora
  const sameDayTarget = dtNow.set({ hour, minute, second: 0, millisecond: 0 })
  if (daysToAdd === 0 && sameDayTarget <= dtNow) {
    daysToAdd = 7 // ya pasó la hora de hoy → mover a la próxima semana
  }

  const result = dtNow.plus({ days: daysToAdd }).set({ hour, minute, second: 0, millisecond: 0 })
  return result.toJSDate()
}

  /**
   * checkDeadline(match, now = new Date())
   * - deadline: última ocurrencia pasada (<= now) del deadline configurado
   * - defaultDate: próxima ocurrencia FUTURA del día elegido entre defaultStartDays (la más cercana)
   *
   * Devuelve { passed, deadline, defaultDate }
   */
function checkDeadline(match, now = new Date()) {
  validateConfigs()

  if (match?.scheduledAt) {
    // Si ya tiene fecha programada, no aplicamos deadline
    return { passed: false, deadline: match.scheduledAt, defaultDate: match.scheduledAt }
  }

  const luxonNow = DateTime.fromJSDate(now).setZone('Europe/Madrid')

  // Calcular deadline: última ocurrencia pasada (<= now) del día/hora/minuto configurados
  const deadlineDate = getPreviousOccurrence(
    configs.match.deadlineDay,
    configs.match.deadlineHour ?? 0,
    configs.match.deadlineMinute ?? 0,
    now
  )
  const luxonDeadline = DateTime.fromJSDate(deadlineDate).setZone('Europe/Madrid')

  // Calcular defaultDate: día aleatorio de defaultStartDays, dentro de la semana actual
  const defaultDayList = configs.match.defaultStartDays
  const randomIndex = Math.floor(Math.random() * defaultDayList.length)
  const randomDay = defaultDayList[randomIndex]

  // Hora (fija o aleatoria)
  const hour = configs.match.defaultStartHour ?? Math.floor(Math.random() * 24)
  const minute = 0

  // Semana actual: domingo 00:00
  const dtNow = DateTime.fromJSDate(now).setZone('Europe/Madrid')
  const sunday = dtNow.startOf('week').minus({ days: 1 }) // domingo 00:00

  // Fecha random dentro de la semana actual
  const defaultDate = sunday.plus({ days: randomDay, hours: hour, minutes: minute }).toJSDate()
  const luxonDefault = DateTime.fromJSDate(defaultDate).setZone('Europe/Madrid')

  const passed = luxonNow.toMillis() > luxonDeadline.toMillis()

  return { passed, deadline: deadlineDate, defaultDate }
}

  module.exports = {
    getNextOccurrence,
    getPreviousOccurrence,
    pickClosestNextDay,
    getDate,
    checkDeadline
  }