const { model, Schema, Types } = require('mongoose')

let TeamSchema = new Schema({
    name: { type: String, required: true, unique: true },
    iconURL: { type: String },
    color: { type: String },
    code: { type: String, required: true, unique: true },

    divisionId: { type: Types.ObjectId, ref: 'Division' }, // Usar ./id de la division

    members: [
        {
            userId: { type: Types.ObjectId, ref: 'User', required: true },
            role: { type: String, enum: ['leader', 'sub-leader', 'member' ], default: 'member' }
        }
    ],

    // Aquí se pueden añadir stats totales como total de partidas jugadas, total de puntos en ligas, racha...

    channelId: { type: String }
})

module.exports = model("Team", TeamSchema)