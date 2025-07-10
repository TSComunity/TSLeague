const { model, Schema, Types } = require('mongoose')

let TeamSchema = new Schema({
    name: { type: String, required: true, unique: true },
    iconURL: { type: String },
    color: { type: String },
    code: { type: String, required: true, unique: true },

    divisionId: { type: Types.ObjectId, ref: 'Division', required: true }, // Usar ./id de la division

    members: [
        {
            userId: { type: Types.ObjectId, ref: 'User', required: true },
            rol: { type: String, enum: ['leader', 'sub-leader', 'member' ], default: 'member' }
        }
    ],

    // Aquí se pueden añadir stats totales como total de partidas jugadas, total de puntos en ligas, racha...

    isEligible: { type: Boolean, default: false }  // Tiene al menos 3 miembros
})

module.exports = model("Team", TeamSchema)