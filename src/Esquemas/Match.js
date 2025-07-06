const { model, Schema, Types } = require('mongoose')

const MatchSchema = new Schema({
  seasonId: { type: Types.ObjectId, ref: 'Season', required: true },
  divisionId: { type: Types.ObjectId, ref: 'Division', required: true },
  roundIndex: { type: Number, required: true },

  teamAId: { type: Types.ObjectId, ref: 'Team' },
  teamBId: { type: Types.ObjectId, ref: 'Team' },

  scoreA: { type: Number, default: 0 },
  scoreB: { type: Number, default: 0 },

  scheduledAt: { type: Date, required: true },

  status: {
    type: String,
    enum: ['scheduled', 'played', 'cancelled'],
    default: 'scheduled'
  },

  imageURL: { type: String },

  set1: { winner: { type: String, enum: ['A', 'B', 'draw', null], default: null } },
  set2: { winner: { type: String, enum: ['A', 'B', 'draw', null], default: null } },
  set3: { winner: { type: String, enum: ['A', 'B', 'draw', null], default: null } }
})

module.exports = model('Match', MatchSchema)