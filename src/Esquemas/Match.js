const { model, Schema, Types } = require('mongoose')

const MatchSchema = new Schema({
  matchIndex: { type: Number, required: true },
  roundIndex: { type: Number, required: true },
  
  seasonId: { type: Types.ObjectId, ref: 'Season', required: true },
  divisionId: { type: Types.ObjectId, ref: 'Division', required: true },
  channelId: { type: String },

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
  reason: { type: String },

  sets: [
    {
      map: { type: String, required: true },
      mode: { type: String, required: true },
      winner: { type: Schema.Types.ObjectId, ref: "Team", default: null }
    }
  ],

  previewImageURL: { type: String },
  resultsImageURL: { type: String}
})

module.exports = model('Match', MatchSchema)