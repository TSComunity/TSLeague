function calcMaxRounds(maxTeams) {
  if (numEquipos < 2) return 0 // menos de 2 equipos no hay rondas

  if (numEquipos % 2 === 0) {
    // número par de equipos
    return numEquipos - 1;
  } else {
    // número impar de equipos, uno descansa cada ronda
    return numEquipos
  }
}

const maxTeams = 12

module.exports = {
  "channels": {
    "announcements": {
      "id": '1364999573495353437'
    },
    "logs": {
      "id": '1374691378604277760'
    }
  },
  "season": {
    "startDay": 1,
    "startHour": 18,
    "maxRounds": calcMaxRounds(maxTeams)
  },
  "round": {
    "startDay": 1,
    "startHour": 1
  },
  "division": {
    maxTeams
  },
  "match": {
    "defaultStartDay": 6,
    "defaultStartHour": 18
  },
  "team": {
    "maxMembers": 5
  }
}