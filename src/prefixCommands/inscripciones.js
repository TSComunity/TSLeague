const {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  MessageFlags,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder
} = require('discord.js')

const { getTeamCreateButton, getTeamShowButton, getTeamJoinButton, getTeamLookingFotButton } = require('../discord/buttons/team.js')

module.exports = {
  name: 'inscribir',
  aliases: ['ins'],
  args: false,
  run: async (message, client, args) => {

const text1 = new TextDisplayBuilder().setContent(
`### Registro de equipos

Desde este panel puedes gestionar todo lo relacionado con los equipos de la liga:  
crear uno nuevo, unirte a uno ya existente o ver tu equipo actual.

Antes de gestionar o unirse a un equipo, es necesario vincular tu cuenta de Brawl Stars.  
Este paso nos permite acceder a tus estadísticas en tiempo real y ofrecer información precisa tanto a tu equipo como al resto de participantes de la liga.`
)

const text2 = new TextDisplayBuilder().setContent(
  `### Crear Equipo

Pulsa el botón **"Crear equipo"** para iniciar el proceso. Se te pedirá:

- Un nombre para el equipo  
- Un enlace al icono (imagen que lo represente)

Una vez creado, el equipo recibirá un **código de invitación único**, este sirve para invitar a nuevos miembros al equipo.  
Este código solo será visible para el líder y los sublíderes.`
)


const text3 = new TextDisplayBuilder().setContent(
  `### Ver Equipo

Al pulsar **"Ver equipo"**, podrás consultar la información de tu equipo.  
Dependiendo de tu rol, verás diferentes opciones:

**Miembros del equipo:**  
- Visualizar los integrantes y datos publicos del equipo
- Salir del equipo

**Líderes y sublíderes:**  
- Cambiar el nombre 
- Cambiar el icono  
- Cambiar el color  
- Gestionar miembros (asignar roles o expulsar)  
- Regenerar el código de invitación

El acceso a estas opciones está restringido según el rol para garantizar una gestión organizada.`
)


const text4 = new TextDisplayBuilder().setContent(
  `### Unirse a un Equipo

Para unirte a un equipo existente, necesitarás el **código de invitación del equipo**.  
Este código lo proporcionan el líder o los sublíderes del mismo.  

Introduce el código en el formulario y pasarás a formar parte del equipo al instante.`
)

    
    const separator = new SeparatorBuilder()

    const actionRow = new ActionRowBuilder().addComponents(
      getTeamCreateButton(),
      getTeamJoinButton()
    )
    const row2 = new ActionRowBuilder().addComponents(
      getTeamShowButton(),
      getTeamLookingFotButton()
    )
    const image = new MediaGalleryItemBuilder()
      .setURL("https://media.discordapp.net/attachments/1366297762496249906/1374654925295845446/TS_LEAGUE.png?ex=682ed6aa&is=682d852a&hm=c15d97f6f7fd0f756ab034df54af062f821d0a4425b4695d793a7655220ebd92&=&format=webp&quality=lossless&width=1872&height=433")
      .setDescription("tsleague")

    const mediaGallery = new MediaGalleryBuilder()
      .setId(1)
      .addItems([image])

    const container = new ContainerBuilder()
      .addMediaGalleryComponents([mediaGallery])
      .addSeparatorComponents(separator)
      .addTextDisplayComponents(text1)
      .addSeparatorComponents(separator)
      .addTextDisplayComponents(text2, text3, text4)
      .addSeparatorComponents(separator)
      .setAccentColor(0x1bfc62)
      .addActionRowComponents(actionRow, row2)

    await message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    })
  }
}