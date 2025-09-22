const { model, Schema, Types } = require('mongoose')

const SeasonSchema = new Schema({
  seasonIndex: { type: Number, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },

  divisions: [
    {
      divisionId: { type: Types.ObjectId, ref: 'Division', required: true },
      status: { type: String, enum: ['active', 'ended'], default: 'active' },

      teams: [  
        {
          teamId: { type: Types.ObjectId, ref: 'Team', required: true },
          points: { type: Number, default: 0 },
          result: { 
            type: String,
            enum: ['promoted', 'relegated', 'stayed', 'expelled', 'winner', null],
            default: null
          }
        }
      ],

      rounds: [
        {
          roundIndex: { type: Number, required: true }, // ej: 1 = primer finde

          matches: [
            {
              matchId: { type: Types.ObjectId, ref: 'Match' }
            }
          ],
          resting: [
            {
              teamId: { type: Schema.Types.ObjectId, ref: 'Team' } // Equipos que descansan esa ronda
            }
          ]
        }
      ]
    }
  ]
})

module.exports = model("Season", SeasonSchema)