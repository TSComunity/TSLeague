const { model, Schema, Types } = require('mongoose')

const SeasonSchema = new Schema({
  seasonIndex: { type: Number, required: true, unique: true },
  startDate: { type: Date, required: true },
  endData: { type: Date },
  active: { type: Boolean, default: true },

  divisions: [
    {
      division: { type: Types.ObjectId, ref: 'Division', required: true },

      teams: [
        {
          team: { type: Types.ObjectId, ref: 'Team', required: true },
          points: { type: Number, default: 0 },
          rank: { type: Number, default: null },
          playedGames: { type: Number, default: 0 }
        }
      ],

      rounds: [
        {
          roundIndex: { type: Number, required: true }, // ej: 1 = primer finde
          matches: [{ type: Types.ObjectId, ref: 'Match' }],
          resting: [{ type: Schema.Types.ObjectId, ref: 'Team' }] // equipos que descansan esa ronda
        }
      ]
    }
  ]
})

module.exports = model("Season", SeasonSchema)