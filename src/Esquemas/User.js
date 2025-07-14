const { model, Schema, Types } = require('mongoose')

let UserSchema = new Schema({
    discordId: { type: String, required: true },
    brawlId: { type: String },

    teamId: { type: Types.ObjectId, ref: 'Team' }, // Usar ./id de la division

    isVerified: { type: Boolean, default: false }
})

module.exports = model("User", UserSchema)