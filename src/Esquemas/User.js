const { model, Schema, Types } = require('mongoose')

let UserSchema = new Schema({
    discordId: { type: String, required: true },
    brawlId: { type: String },

    teamId: { type: Types.ObjectId, ref: 'Team' }, // Usar ./id de la division

    isVerified: { type: Boolean, default: false },

    isFreeAgent: { type: Boolean, default: false },
    freeAgentMessageId: { type: String }
})

module.exports = model("User", UserSchema)