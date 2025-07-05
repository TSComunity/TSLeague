const { model, Schema, Types } = require('mongoose')

const DivisionSchema = new Schema({
  name: { type: String, required: true },
  tier: { type: Number, required: true }
})

module.exports = model("Division", DivisionSchema)