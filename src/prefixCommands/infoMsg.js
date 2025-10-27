const { EmbedBuilder, PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const emojis = require('../configs/emojis.json')

module.exports = {
    name: "infoMsg",
    args: false,
    run: async(message, client, args) => {
      if (message.author.id !== '838441772794511411') {
        return message.reply('No tienes permisos para usar este comando.')
      }
      const embeds = [
    new EmbedBuilder()
        .setColor(16733525)
        .setDescription("### Normas\n\n-  **Respeto obligatorio**\n> Todos los jugadores deben mantener una conducta respetuosa hacia sus compañeros, rivales y miembros del staff. No se tolerarán insultos, provocaciones ni comportamientos tóxicos.\n- **Región exclusiva (EMEA)**\n> Solo pueden participar jugadores de Europa, Oriente Medio y África para garantizar condiciones de conexión justas y evitar problemas de *delay* o latencia injustificable.\n- **Conducta deportiva**\n> Se espera una actitud ejemplar dentro y fuera del juego. Cualquier intento de hacer trampas, manipular resultados o eludir normas podrá conllevar sanciones, incluyendo descalificación del la liga o veto temporal.\n- **Decisiones del staff**\n> Las resoluciones tomadas por el staff son finales y de obligado cumplimiento, aunque siempre se priorizará la transparencia, el diálogo y la imparcialidad en cada caso."),
    new EmbedBuilder()
        .setColor(15965202)
        .setDescription("### Premios\n\nLos **premios de cada temporada** se otorgan exclusivamente a los equipos mejor clasificados de la **Primera División**, en función del rendimiento competitivo y de los criterios establecidos por la organización.\n\nLas recompensas pueden incluir:\n- 💎 **Pases de Batalla de Brawl Stars** o otros productos del juego.\n- 💰 **Premios en dinero** o tarjetas regalo digitales.\n- 🎁 **Productos físicos o digitales externos** (merchandising, dispositivos, etc.).\n\nAntes del inicio de cada temporada, el staff anunciará los **premios exactos y sus criterios de asignación**, de forma pública y transparente, asegurando que todos los participantes conozcan lo que se otorga y bajo qué condiciones."),
    new EmbedBuilder()
        .setColor(3447003)
        .setDescription("### Formato de la Liga\n\n* Cada división puede tener un máximo de 12 equipos.\n* El formato es **Round Robin**, donde todos los equipos se enfrentan entre sí una vez por temporada.\n* Cada partido se disputa al mejor de 3 modos y mapas distintos, seleccionados automáticamente por el bot mediante un algoritmo que:\n  > **•**  Evita repeticiones cercanas de mapas.\n  > **•**  Usa solo mapas competitivos oficiales.\n  > **•**  Mantiene un equilibrio entre todos los equipos.\n* La temporada finaliza automáticamente cuando todos los enfrentamientos de cada división han concluido.\n* Al cierre de la temporada:\n  > **•**  Los ascensos y descensos se calculan automáticamente según un algoritmo que analiza el rendimiento y la situación de cada división.\n  > **•**  El número de equipos que suben, bajan o son expulsados puede variar según la temporada.\n  > **•**  Se puede ver en todo momento la situación de cada equipo (ascenso, descenso o expulsión) en el canal <#1364999474564436068>, con emojis y actualizaciones automáticas."),
    new EmbedBuilder()
        .setColor(10181046)
        .setDescription("### Registro y Verificación\n\nPara crear, unirse o gestionar equipos, o activar el estado de agente libre (Free Agent), es obligatorio estar verificado con la ID de su cuenta de Brawl Stars. Si no se está verificado, al pulsar cualquier botón de equipo el bot abrirá un formulario para introducir la ID de la cuenta (ejemplo: `#2PGRGJUPR`).\n\nEn <#1393526853288853515> se pueden realizar las siguientes acciones:\n- **Crear Equipo**: \n> Abre un formulario donde se puede introducir el nombre y la URL de un icono para crear un equipo.\n- **Unirse a Equipo**: \n> Abre un formulario donde se puede introducir el código de invitación del equipo para unirse al mismo (disponible solo para líder y sub-líder).\n- **Mostrar Equipo**: \n> Muestra la información del equipo. Si el usuario es líder o sub-líder, permite gestionar el equipo; si no, solo permite ver los datos públicos y salir del equipo.\n- **Buscar Equipo** (Agente Libre):\n> Activa o desactiva el estado de agente libre, lo que permite que los miembros de equipos identifiquen fácilmente a los jugadores que buscan equipo en <#1424456781673009213>.")
        .setFooter({
            text: "El código de invitación nunca debe compartirse en público. Si se filtra, el líder o sub-líderes pueden regenerarlo en el panel del equipo.",
        }),
    new EmbedBuilder()
        .setColor(15844367)
        .setDescription("### Equipos y Agentes Libres\n\nCada equipo puede tener hasta 5 miembros, incluyendo un líder, cualquier número de sub-líderes y miembros regulares. Si todos los miembros abandonan un equipo, este se elimina automáticamente. Mientras que el líder tiene control total sobre el equipo, pudiendo modificar sub-líderes y miembros, los sub-líderes únicamente pueden expulsar o ascender a miembros, y los miembros regulares no disponen de permisos de gestión.\n\nUna vez que un equipo cuenta con al menos 3 miembros o está asignado a una división, el bot crea automáticamente un canal privado en una categoría especial destinada a los equipos. Cada canal es visible únicamente para los miembros del equipo correspondiente y el staff del servidor. Si el equipo deja de cumplir estos requisitos, el canal se elimina automáticamente.\n\nEn dicho canal se publican notificaciones relacionadas con el equipo, como asignaciones a divisiones, resultados de sus partidos y comunicados importantes. También se puede contactar directamente al staff en caso de dudas o incidencias.\n\nLos jugadores pueden marcarse y desmarcarse como Agente Libre usando el botón **Buscar Equipo (Agente Libre)** en <#1393526853288853515>. Si no están verificados, al pulsar el botón se abrirá un formulario para introducir la ID de su cuenta de Brawl Stars (por ejemplo, \`#2PGRGJUPR\`). Cuando un miembro entra a un equipo, el bot quita automáticamente su estado de Agente Libre.\n\nUna vez activado, el bot envia un mensaje en el canal <#1424456781673009213> y lo mantiene actualizado automáticamente con la ficha y estadísticas en tiempo real de Brawl Stars del jugador. Los equipos que buscan miembros pueden consultar este canal para fichar a jugadores disponibles, mientras que los jugadores que buscan equipo pueden marcarse como Agente Libre para aparecer en la lista y aumentar sus posibilidades de ser fichados."),
      ]
      const embeds2 = [
            new EmbedBuilder()
        .setColor(3426654)
        .setDescription("### Divisiones y Jornadas\n\nLos equipos se organizan en divisiones de hasta 12 participantes según su nivel competitivo. En <#1375108833558397053> se pueden consultar todas las divisiones ordenadas por nivel, con la lista de sus equipos, los miembros de cada uno y un botón **Ver Estadísticas** que muestra las estadísticas de Brawl Stars del equipo completo, además de permitir acceder a las de cada jugador mediante un menú desplegable.\n\nCada lunes a las 19:00 (hora española) se anuncia en <#1431372899855503421> la jornada semanal de la temporada, que incluye los nuevos partidos programados y, en su caso, los equipos que descansan esa semana. Los descansos pueden producirse cuando la división tiene un número impar de equipos o cuando un equipo ya ha disputado todos sus partidos.\n\nSi una división finaliza antes de completar todas las rondas porque todos los equipos ya se han enfrentado entre sí, su cierre se comunica en el siguiente mensaje de jornada, junto con los partidos y descansos del resto de divisiones. Cuando todas las divisiones han concluido, en lugar de anunciar una nueva jornada se publica oficialmente el fin de la temporada, mostrando los resultados de todas las divisiones, independientemente de si terminaron antes o al mismo tiempo."),
    new EmbedBuilder()
        .setColor(15105570)
        .setDescription("### Partidos y Resultados\n\nCada lunes, en el anuncio de jornada publicado en <#1431372899855503421>, se detallan los partidos de esa semana. En ese momento, el bot crea automáticamente un canal privado para cada partido dentro de una categoría exclusiva de partidos, accesible únicamente para los equipos implicados y el staff.\n\nDentro de cada canal, el bot envía un mensaje con los miembros de ambos equipos, los sets del partido y una imagen personalizada generada automáticamente, que representa visualmente el enfrentamiento. Junto a esta información aparece un botón Proponer Horario, que permite a los líderes acordar el día y la hora del encuentro.\n\nTodos los partidos deben jugarse dentro del rango de 12:00 a 23:30 (hora española) los viernes, sábados o domingos. Si los equipos no se ponen de acuerdo antes del viernes a las 11:59, el bot asignará automáticamente uno de esos tres días a las 19:00. Esta medida garantiza que todos los encuentros se jueguen y evita que un equipo pueda falsear su disponibilidad: si solo hubiera una fecha predeterminada y un equipo no pudiera jugar en esa fecha, el equipo rival podría inventar que solo puede jugar ese día y a esa hora y obtener la victoria automáticamente sin disputar el partido por ausencia del equipo rival.\n\nLos resultados se publican automáticamente en el canal del partido, en el canal del equipo y en <#1431372343393128518>, acompañados de otra imagen personalizada que representa de forma gráfica los resultados del partido y otorgando de forma automática 1 punto por cada set ganado a cada equipo, de modo que ambos pueden sumar puntos en un mismo partido (por ejemplo, un resultado 2–1 otorga 2 puntos al ganador y 1 al perdedor)."),
    new EmbedBuilder()
        .setColor(15158332)
        .setDescription("### Notificaciones y Rol de Avisos\n\nMientras un usuario sea miembro de un equipo, recibirá automáticamente el rol <@&1393563891044450434> para avisos importantes de la liga. Este rol es gestionado directamente por el bot, por lo que aunque se intente quitar manualmente, el bot lo volverá a asignar, garantizando que todos los participantes reciban siempre las comunicaciones relevantes.\n\nLos usuarios que no participan en la liga también pueden recibir este rol en <id:customize> si desean mantenerse informados sobre novedades importantes."),
    new EmbedBuilder()
        .setColor(3066993)
        .setDescription("### Soporte y Ayuda\n\nLos miembros de un equipo pueden utilizar el canal del equipo para cualquier duda, incidencia o consulta. Este canal es exclusivo y directo, lo que permite al staff gestionar todas las situaciones de manera organizada y mantener la información centralizada.\n\nLos usuarios que aún no tienen equipo pueden emplear el canal <#1163179831203221644> para consultas generales. Aunque esta vía no es tan exclusiva, garantiza que todos los usuarios puedan comunicarse con el staff y recibir soporte de manera eficiente.\n\nEl staff dispone de comandos que permiten utilizar las funcionalidades del bot de forma manual, asegurando que cualquier incidencia se pueda resolver directamente dentro de los canales correspondientes.\n\nLos usuarios pueden reportar problemas o errores directamente por los mismos canales de comunicación. Para cuestiones más técnicas o errores de código del bot, también pueden hacerlo [aquí](https://github.com/TSComunity/TSLeague/issues), como una alternativa adicional para situaciones que no se puedan gestionar únicamente dentro de los canales."),
];
const buttons = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setLabel('Registrarse')
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.com/channels/1093864130030612521/1393526853288853515'), // Cambia al enlace real
    new ButtonBuilder()
      .setLabel('Repo')
      .setStyle(ButtonStyle.Link)
      .setURL('https://github.com/TSComunity/TSLeague'),
    // Opcional
    // new ButtonBuilder()
    //   .setLabel('Errores')
    //   .setStyle(ButtonStyle.Link)
    //   .setURL('https://github.com/TSComunity/TSLeague/issues')
  );

        await message.channel.send({ embeds: embeds})
        await message.channel.send({ embeds: embeds2, components: [buttons]})
    }
 };