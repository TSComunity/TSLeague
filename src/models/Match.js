const { model, Schema, Types } = require('mongoose')

const MatchSchema = new Schema({
  matchIndex: { type: Number, required: true, unique: true },
  roundIndex: { type: Number, required: true },
  
  seasonId: { type: Types.ObjectId, ref: 'Season', required: true },
  divisionId: { type: Types.ObjectId, ref: 'Division', required: true },
  channelId: { type: String },
  infoMessageId: { type: String },
  onGoingMessageId: { type: String },

  teamAId: { type: Types.ObjectId, ref: 'Team' },
  teamBId: { type: Types.ObjectId, ref: 'Team' },

  scoreA: { type: Number, default: 0 },
  scoreB: { type: Number, default: 0 },

  scheduledAt: { type: Date },
  winner: { type: Types.ObjectId, ref: "Team" },

  status: {
    type: String,
    enum: ['scheduled', 'onGoing', 'played', 'cancelled'],
    default: 'scheduled'
  },
  reason: { type: String },

  sets: [
    { 
      map: { type: String, required: true },
      mode: { type: String, required: true },
      winner: { type: Types.ObjectId, ref: "Team" },
      starPlayerId: { type: Types.ObjectId, ref: 'User' }
    }
  ],

  starPlayerId: { type: Types.ObjectId, ref: 'User' },

  previewImageURL: { type: String },
  resultsImageURL: { type: String},

  proposedSchedule: {
    newDate: { type: Date },
    proposedBy: { type: Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'] }
  }
})

module.exports = model('Match', MatchSchema)