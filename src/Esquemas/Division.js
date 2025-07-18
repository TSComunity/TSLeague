const { model, Schema, Types } = require('mongoose')

const DivisionSchema = new Schema({
  name: { type: String, required: true },
  tier: { type: Number, required: true },
  emoji: { type: String, required: true }
})

module.exports = model("Division", DivisionSchema)