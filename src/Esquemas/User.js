const { model, Schema, Types } = require('mongoose')

let UserSchema = new Schema({
    discordId: { type: String, required: true },
    brawlId: { type: String },

    isVerified: { type: Boolean, default: false }
})

module.exports = model("User", UserSchema)