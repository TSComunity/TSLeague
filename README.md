# TSLeague

[![Stars](https://img.shields.io/github/stars/Zer0Dev-exe/TSLeague?style=for-the-badge&color=yellow)](https://github.com/Zer0Dev-exe/TSLeague/stargazers)
[![Forks](https://img.shields.io/github/forks/Zer0Dev-exe/TSLeague?style=for-the-badge&color=blue)](https://github.com/Zer0Dev-exe/TSLeague/network/members)
[![Issues](https://img.shields.io/github/issues/Zer0Dev-exe/TSLeague?style=for-the-badge&color=orange)](https://github.com/Zer0Dev-exe/TSLeague/issues)
[![Licencia](https://img.shields.io/badge/Licencia-CC%20BY--NC--ND%204.0-red?style=for-the-badge)](https://creativecommons.org/licenses/by-nc-nd/4.0/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E=20.10.0-green?style=for-the-badge&logo=node.js&logoColor=white)](#)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-blueviolet?style=for-the-badge&logo=discord&logoColor=white)](#)

---

## Descripción general

**TSLeague** es un sistema avanzado de automatización y gestión para ligas competitivas de Brawl Stars dentro de Discord, orientado a reducir la carga del staff y ofrecer una experiencia profesional y visualmente cuidada a los jugadores y organizadores.

- **Servidor oficial:** [discord.gg/8nu3ZdDkp7](https://discord.gg/8nu3ZdDkp7)

---

## Características destacadas

- **Automatización total de la liga:** Generación de jornadas, partidos, canales, roles, embeds, imágenes y avisos sin intervención manual.
- **Gestión dinámica y parametrizable:** Todas las reglas (nº de equipos por división, modos, mapas, horarios, puntos, colores, límites, permisos...) son configurables desde `/src/configs/`.
- **Imágenes customizadas en tiempo real:** El bot genera imágenes de presentación y resultados de los partidos usando Canvas y las sube automáticamente a ImgBB para visualización en Discord.
- **Paneles y menús interactivos:** Uso intensivo de modals, botones y menús select para gestionar equipos, partidos y usuarios de forma visual y segura.
- **Integración con la API de Brawl Stars:** Verificación, stats y rankings de jugadores y equipos con datos oficiales en tiempo real.
- **Funciones programadas (scheduling):** El sistema permite programar tareas y eventos (rondas, deadlines, limpieza de equipos, etc) que se ejecutan automáticamente.
- **Logs y avisos inteligentes:** Toda acción relevante se loguea y los canales de clasificaciones/divisiones se actualizan en tiempo real.
- **Arquitectura robusta y mantenible:** Separación clara de servicios, eventos, comandos, utilidades, configuraciones y modelos de datos.

---

## Estructura del repositorio

- **/src/**
  - **ComandosSlash/**  
    Comandos slash organizados por rol (admin, staff, tier, usuario) para gestión avanzada y segura de toda la liga.
  - **ComandosPrefix/**  
    Comandos tradicionales de prefijo para utilidades, pruebas, administración legacy y paneles rápidos.
  - **discord/**
    - **buttons/**, **menus/**, **modals/**, **embeds/**, **inputs/**  
      Todos los componentes visuales interactivos de Discord (botones, menús select, modals, embeds, inputs de texto...) con lógica desacoplada.
    - **send/**  
      Utilidades para enviar mensajes y logs a canales específicos (anuncios, logs, equipos...).
    - **update/**  
      Scripts para actualizar de forma automática y robusta los paneles de divisiones, rankings y equipos.
  - **services/**  
    - Lógica de negocio de alto nivel: gestión de equipos, divisiones, partidos, rondas, usuarios, puntos, matches, scheduling de funciones, generación de sets, matchmaking, etc.
    - Incluye algoritmos para evitar partidos repetidos, control de elegibilidad de equipos, y limpieza/actualización autónoma de entidades.
  - **Esquemas/**  
    Modelos de datos Mongoose: Season, Division, Team, Match, User, ScheduledFunction.
  - **configs/**  
    - **league.js:** Configuración general de la liga (canales, roles, límites, parámetros de partidos y equipos).
    - **colors.json, emojis.json, gameModes.json:** Paletas de colores, emojis custom y modos/mapas con pesos y assets para sorteos y lógica visual.
  - **utils/**  
    - Funciones utilitarias para fechas, rounds, matches, mapas, generación de imágenes (canvas.js), etc.
  - **Handlers/**  
    - Carga dinámica y modular de eventos, comandos y comandos de prefijo.
  - **Eventos/**  
    - Listeners de eventos Discord.js para interacciones, botones, menús, modals y mensajes.
    - Handlers desacoplados para facilitar el desarrollo y pruebas.
  - **assets/**  
    - Recursos gráficos de fondo y de apoyo para la generación de imágenes customizadas (por ejemplo: backgrounds de partidos).

---

## Implementación técnica y detalles interesantes

- **Node.js requerido:**  
  **Se recomienda Node.js `>= 20.10.0`** (por uso de dependencias modernas y mejor compatibilidad con Discord.js v14 y Canvas).
- **Imágenes customizadas:**  
  El bot usa Canvas y recursos de `/src/assets/` para generar imágenes de partidos, combina iconos, nombres, colores y textos, y sube el resultado automáticamente a ImgBB para integrarlo en los embeds de Discord.
- **Scheduling y automatización:**  
  El sistema de funciones programadas permite automatizar tareas críticas como el avance de jornadas, deadlines, limpieza de entidades, asignación de horarios, etc. Se ejecutan mediante jobs internos y pueden extenderse fácilmente.
- **Configuración avanzada:**  
  Prácticamente todo es editable desde `/src/configs/`:  
    - Tamaño máximo de equipos/divisiones/partidos.
    - Modos y mapas disponibles y sus pesos.
    - Horarios, permisos, límites y assets visuales.
    - Emojis custom para cada aspecto de la liga.
- **Control y logs:**  
  El staff dispone de comandos y paneles para reiniciar bots, ver logs PM2, actualizar desde git y gestionar el sistema con seguridad (ver `/src/ComandosPrefix/dev.js`).
- **Robustez:**  
  El sistema está preparado para limpiar equipos vacíos, canales huérfanos, errores en la creación de canales/partidos, y para reiniciar cualquier panel visual de forma automática en caso de desincronización.

---

## Créditos y licencia

Desarrollado por **@tumonulo** sobre la idea y propiedad intelectual original de **@Zer0Dev-exe**.

Este proyecto está protegido bajo la licencia [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/).

- **Atribución obligatoria.**
- **Prohibido su uso comercial y la creación de obras derivadas.**
- Para cualquier uso, referencia académica o transferencia de propiedad, contactar con **@tumonulo**.

---

## Enlaces útiles

- **Servidor oficial y soporte:** [discord.gg/8nu3ZdDkp7](https://discord.gg/8nu3ZdDkp7)
- **Licencia completa:** [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)

---
