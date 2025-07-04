const { model, Schema, Types } = require('mongoose')

const SeasonSchema = new Schema({
  seasonIndex: { type: Number, required: true, unique: true },
  startDate: { type: Date, required: true },
  active: { type: Boolean, default: true },

  divisions: [
    {
      division: { type: Types.ObjectId, ref: 'Division', required: true },

      teams: [
        {
          team: { type: Types.ObjectId, ref: 'Team', required: true },
          points: { type: Number, default: 0 },
          playedGames: { type: Number, default: 0 }
        }
      ],

      rounds: [
        {
          roundIndex: { type: Number, required: true, unique: true }, // ej: 1 = primer finde
          matches: [
            {
              teamA: { type: Types.ObjectId, ref: 'Team', required: true },
              teamB: { type: Types.ObjectId, ref: 'Team', required: true },
              
              scoreA: { type: Number, default: 0 },  // sets ganados
              scoreB: { type: Number, default: 0 },  // sets ganados

              scheduledAt: { type: Date, required: true },

              status: {
                type: String,
                enum: ['scheduled', 'played', 'cancelled'],
                default: 'scheduled'
              },

              imageURL: { type: String },  // imagen general del partido

              sets: [
                {
                  mode: { type: String, required: true },
                  map: { type: String, required: true },
                  winner: {
                    type: String,
                    enum: ['A', 'B', 'draw', null],
                    default: null
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
})

module.exports = model("Season", SeasonSchema)