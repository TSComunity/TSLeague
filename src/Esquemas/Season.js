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
          points: { type: Number, default: 0 }
          // aqui se pueden poner mas stats como partidos jugados o racha
        }
      ],

      rounds: [
        {
          roundIndex: { type: Number, required: true }, // ej: 1 = primer finde
          
          set1: { mode: { type: String, required: true }, map: { type: String, required: true }, },
          set2: { mode: { type: String, required: true }, map: { type: String, required: true }, },
          set3: { mode: { type: String, required: true }, map: { type: String, required: true }, },

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