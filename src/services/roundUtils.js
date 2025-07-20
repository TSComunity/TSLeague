const getCurrentRoundNumber =  ({ season }) => {
  const roundCounts = season.divisions.map(div => div.rounds?.length || 0)

  if (!roundCounts.length) return 0 // No hay divisiones

  return Math.max(...roundCounts)
}

module.exports = { getCurrentRoundNumber }