const { model, Schema, Types } = require('mongoose');

let TeamSchema = new Schema({
    name: { type: String, required: true, unique: true },
    icon: { type: String },
    color: { type: String },
    code: { type: String, required: true, unique: true },

    division: { type: Types.ObjectId, ref: 'Division', required: true }, // Usar ./id de la division

    players: {
        type: [
            {
                discordId: { type: String, required: true },
                brawlId: { type: String },
                rol: { type: String, enum: ['lider', 'sub-lider', 'jugador' ], default: 'jugador' },
            }
        ],
        default: []
    },

    isEligible: { type: Boolean, default: false }  // Tiene al menos 3 miembros
})

module.exports = model("Team", TeamSchema)