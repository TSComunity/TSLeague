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
  "guild": {
    "id": '1093864130030612521'
  },
  "categories": {
    "matches": {
      "id": '1394250453579202690'
    }
  },
  "channels": {
    "announcements": {
      "id": '1364999573495353437',
    },
    "logs": {
      "id": '1374691378604277760'
    },
    "rankings": {
      "id": '1364999474564436068'
    },
    "teams": {
      "id": '1375108833558397053'
    },
    "perms": [
      '1106553480803516437',
      '1107345436492185753',
      '1106553536839422022',
      '1363927756617941154',
      '1202685031219200040',
      '1107329826982989906',
      '1377754136824778885'
    ]
  },
  "roles": {
    "ping": {
      "id": '1393563891044450434'
    }
  },
  "commands": {
    "perms": [
      '1106553480803516437',
      '1107345436492185753',
      '1106553536839422022',
      '1363927756617941154',
      '1202685031219200040',
      '1377754136824778885'
    ]
  },
  "season": {
    "maxRounds": calcMaxRounds(maxTeams)
  },
  "round": {
    "startDay": 0,
    "startHour": 20
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