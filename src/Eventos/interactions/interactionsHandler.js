const fs = require('node:fs');
const { getErrorEmbed } = require('../../discord/embeds/management.js');

// Almacenadores de handlers como arrays en vez de Map
const buttonHandlers = [];
const modalHandlers = [];
const menusHandlers = [];

// Cargar botones
const buttonFiles = fs.readdirSync('./buttons');
for (const file of buttonFiles) {
  const button = require(`./buttons/${file}`);
  buttonHandlers.push({
    condition: button.condition || ((id) => id === button.customId),
    execute: button.execute
  });
}

// Cargar modales
const modalFiles = fs.readdirSync('./modals');
for (const file of modalFiles) {
  const modal = require(`./modals/${file}`);
  modalHandlers.push({
    condition: modal.condition || ((id) => id === modal.customId),
    execute: modal.execute
  });
}

// Cargar select menus
const selectFiles = fs.readdirSync('./menus');
for (const file of selectFiles) {
  const select = require(`./menus/${file}`);
  menusHandlers.push({
    condition: select.condition || ((id) => id === select.customId),
    execute: select.execute
  });
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.isButton()) {
        const handler = buttonHandlers.find(h => h.condition(interaction.customId));
        if (handler) return handler.execute(interaction, client);
      }

      if (interaction.isModalSubmit()) {
        const handler = modalHandlers.find(h => h.condition(interaction.customId));
        if (handler) return handler.execute(interaction, client);
      }

      if (interaction.isStringSelectMenu()) {
        const handler = menusHandlers.find(h => h.condition(interaction.customId));
        if (handler) return handler.execute(interaction, client);
      }

    } catch (err) {
      console.error('Error en interacción:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          ephemeral: true,
          embeds: [
            getErrorEmbed({
              error: 'Hubo un error inesperado. Intenta de nuevo o contacta con un administrador.'
            })
          ]
        });
      }
    }
  }
}