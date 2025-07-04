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
                role: { type: String, enum: ['jugador', 'lider', 'sub-lider', 'coach'], default: 'jugador' },
            }
        ],
        default: []
    },

    active: { type: Boolean, default: false },
})

module.exports = model("Team", TeamSchema)