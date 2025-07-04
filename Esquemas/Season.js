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
              scoreA: { type: Number, default: 0 },
              scoreB: { type: Number, default: 0 },
              scheduledAt: { type: Date, required: true },
              status: {
                type: String,
                enum: ['scheduled', 'played', 'cancelled'],
                default: 'scheduled'
              },
              mode: { type: String, required: true },  // Ej: "Balón Brawl"
              map: { type: String, required: true },    // Ej: "Campo de juego"
              imageURL: { type: String }
            }
          ]
        }
      ]
    }
  ]
})

module.exports = model("Season", SeasonSchema)