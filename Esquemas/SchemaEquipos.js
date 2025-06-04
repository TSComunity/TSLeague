const { model, Schema } = require('mongoose');

let equiposSchema = new Schema({
    Puntos: { type: Number, required: false },
    PartidasJugadas: { type: Number, required: false },
    Division: { type: String, required: false },
    Codigo: { type: String, required: false },
    Color: { type: String, required: false },
    Nombre: { type: String, required: false },
    Icono: { type: String, required: false },
    Jugadores: {
        type: [
            {
                discordId: { type: String, required: false },
                brawlId: { type: String, required: false },
                jerarquia: { type: String, required: false },
            }
        ],
        required: false,
        default: []
    }
});

module.exports = model("equiposData", equiposSchema);