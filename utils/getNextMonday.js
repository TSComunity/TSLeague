const getNextMonday = () => {
  const now = new Date()

  // Día actual (0 = domingo, 1 = lunes, ..., 6 = sábado)
  const day = now.getDay()

  // Cuántos días faltan para el próximo lunes
  const daysUntilMonday = (8 - day) % 7 || 7

  // Crear fecha base
  const nextMonday = new Date(now)
  nextMonday.setDate(now.getDate() + daysUntilMonday)
  nextMonday.setHours(17, 0, 0, 0); // 17:00 en hora local

  // Corregir a horario de España
  const madridTime = new Date(nextMonday.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }));

  return madridTime;
};

module.exports = { getNextMonday }