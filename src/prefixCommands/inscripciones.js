const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  MessageFlags
} = require('discord.js');

const {
  getTeamCreateButton,
  getTeamShowButton,
  getTeamJoinButton,
  getTeamLookingFotButton
} = require('../discord/buttons/team.js');

module.exports = {
  name: 'inscribir',
  aliases: ['ins'],
  args: false,
  run: async (message, client, args) => {

    const separator = new SeparatorBuilder();

    const text = new TextDisplayBuilder().setContent(
`### Registro

Para crear, unirse o gestionar equipos, o activar el estado de agente libre (Free Agent), es obligatorio estar verificado con la ID de su cuenta de Brawl Stars. Si no se está verificado, al pulsar cualquier botón de equipo el bot abrirá un formulario para introducir la ID de la cuenta (ejemplo: \`#2PGRGJUPR\`).

Desde este panel se pueden realizar las siguientes acciones:
- **Crear Equipo**: 
> Abre un formulario donde se puede introducir el nombre y la URL de un icono para crear un equipo.
- **Unirse a Equipo**: 
> Abre un formulario donde se puede introducir el código de invitación del equipo para unirse al mismo (disponible solo para líder y sub-líder).
- **Mostrar Equipo**: 
> Muestra la información del equipo. Si el usuario es líder o sub-líder, permite gestionar el equipo; si no, solo permite ver los datos públicos y salir del equipo.
- **Buscar Equipo** (Agente Libre):
> Activa o desactiva el estado de agente libre, lo que permite que los miembros de equipos identifiquen fácilmente a los jugadores que buscan equipo.`
    );

    const actionRow1 = new ActionRowBuilder().addComponents(
      getTeamCreateButton(),
      getTeamJoinButton()
    );

    const actionRow2 = new ActionRowBuilder().addComponents(
      getTeamShowButton(),
      getTeamLookingFotButton()
    );

    const container = new ContainerBuilder()
      .addSeparatorComponents(separator)
      .addTextDisplayComponents(text)
      .addSeparatorComponents(separator)
      .setAccentColor(0x9B59B6) // color cambiado
      .addActionRowComponents(actionRow1, actionRow2);

    await message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};
