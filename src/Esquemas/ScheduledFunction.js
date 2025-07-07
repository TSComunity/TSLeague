const { model, Schema } = require('mongoose')

const ScheduledFunctionSchema = new Schema({
  functionName: { type: String, required: true },
  parameters: { type: Schema.Types.Mixed },
  scheduledFor: { type: Date, required: true }
})

module.exports = model('ScheduledFunction', ScheduledFunctionSchema)