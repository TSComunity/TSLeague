const { model, Schema, Types } = require('mongoose')

let TeamSchema = new Schema({
    name: { type: String, required: true, unique: true },
    iconURL: { type: String },
    color: { type: String },
    code: { type: String },

    divisionId: { type: Types.ObjectId, ref: 'Division' },

    members: [
        {
            userId: { type: Types.ObjectId, ref: 'User', required: true },
            role: { type: String, enum: ['leader', 'sub-leader', 'member' ], default: 'member' }
        }
    ],

    isDeleted: { type: Boolean, default: false, required: true },

    stats: {
        leaguesWon: { type: Number, default: 0 },
        matchesWon: { type: Number, default: 0 },
        matchesLost: { type: Number, default: 0 },
        setsWon: { type: Number, default: 0 },
        setsLost: { type: Number, default: 0 }
    },

    channelId: { type: String }
})

module.exports = model("Team", TeamSchema)