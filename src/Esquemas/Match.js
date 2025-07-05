const { model, Schema, Types } = require('mongoose')

const MatchSchema = new Schema({
  season: { type: Types.ObjectId, ref: 'Season', required: true },
  division: { type: Types.ObjectId, ref: 'Division', required: true },
  roundIndex: { type: Number, required: true },

  teamA: { type: Types.ObjectId, ref: 'Team' },
  teamB: { type: Types.ObjectId, ref: 'Team' },

  scoreA: { type: Number, default: 0 },
  scoreB: { type: Number, default: 0 },

  scheduledAt: { type: Date, required: true },

  status: {
    type: String,
    enum: ['scheduled', 'played', 'cancelled'],
    default: 'scheduled'
  },

  imageURL: { type: String },

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
})

module.exports = model('Match', MatchSchema)