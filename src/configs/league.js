function calcMaxRounds(maxTeams) {
  if (maxTeams < 2) return 0 // menos de 2 equipos no hay rondas

  if (maxTeams % 2 === 0) {
    // número par de equipos
    return maxTeams - 1;
  } else {
    // número impar de equipos, uno descansa cada ronda
    return maxTeams
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
  "perms": {
    "channels": [
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ],
    "commands": [
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]
  },
  "season": {
    "maxRounds": calcMaxRounds(maxTeams)
  },
  "round": {
    "startDay": 1,
    "startHour": 19
  },
  "division": {
    maxTeams
  },
  "match": {
    "defaultStartDay": 6,
    "defaultStartHour": 19
  },
  "team": {
    "maxMembers": 5
  }
}