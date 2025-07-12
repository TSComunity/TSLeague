const fs = require('node:fs');

const { getErrorEmbed } = require('../../discord/embeds/management.js')

const buttonHandlers = new Map();
const modalHandlers = new Map();
const menusHandlers = new Map();

// Cargar botones
const buttonFiles = fs.readdirSync('./buttons');
for (const file of buttonFiles) {
  const button = require(`./buttons/${file}`);
  buttonHandlers.set(button.customId, button);
}

// Cargar modales
const modalFiles = fs.readdirSync('./modals');
for (const file of modalFiles) {
  const modal = require(`./modals/${file}`);
  modalHandlers.set(modal.customId, modal);
}

// Cargar select menus
const selectFiles = fs.readdirSync('./menus');
for (const file of selectFiles) {
  const select = require(`./menus/${file}`);
  selectHandlers.set(select.customId, select);
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

      if (interaction.isStringSelectMenu()) {
        const handler = menusHandlers.get(interaction.customId);
        if (handler) return handler.execute(interaction, client);
      }

    } catch (err) {
      console.error('Error en interacción:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          ephemeral: true,
          embeds: [getErrorEmbed({ error: 'Hubo un error inesperado. Intenta de nuevo o contacta con un administrador.' })]
        });
      }
    }
  }
}