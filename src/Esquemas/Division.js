const { model, Schema, Types } = require('mongoose')

const DivisionSchema = new Schema({
  name: { type: String, required: true },
  tier: { type: Number, required: true },
  emoji: { type: String, required: true },
  color: { type: String, required: true, default: 'Blue'}
})

module.exports = model("Division", DivisionSchema)