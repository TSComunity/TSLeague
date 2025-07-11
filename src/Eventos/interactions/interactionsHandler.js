const path = require('path');
const fs = require('fs');

const buttonHandlers = new Map();
const modalHandlers = new Map();

// Carga todos los botones
const buttonFiles = fs.readdirSync('./buttons');
for (const file of buttonFiles) {
  const button = require(`./buttons/${file}`);
  buttonHandlers.set(button.customId, button);
}

// Carga todos los modales
const modalFiles = fs.readdirSync('./modals');
for (const file of modalFiles) {
  const modal = require(`./modals/${file}`);
  modalHandlers.set(modal.customId, modal);
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.isButton()) {
        const handler = buttonHandlers.get(interaction.customId);
        if (handler) return handler.execute(interaction, client);
      }

      if (interaction.isModalSubmit()) {
        const handler = modalHandlers.get(interaction.customId);
        if (handler) return handler.execute(interaction, client);
      }

    } catch (err) {
      console.error('Error en interacción:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          ephemeral: true,
          content: '❌ Hubo un error inesperado. Intenta de nuevo.'
        });
      }
    }
  }
}