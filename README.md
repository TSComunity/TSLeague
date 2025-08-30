<p align="center">
  <strong style="font-size:2em;">TSLeague</strong>
</p>

<p align="center">
  <a href="https://github.com/Zer0Dev-exe/TSLeague/stargazers"><img src="https://img.shields.io/github/stars/Zer0Dev-exe/TSLeague?style=for-the-badge&color=yellow" alt="Stars"></a>
  <a href="https://github.com/Zer0Dev-exe/TSLeague/network/members"><img src="https://img.shields.io/github/forks/Zer0Dev-exe/TSLeague?style=for-the-badge&color=blue" alt="Forks"></a>
  <a href="https://github.com/Zer0Dev-exe/TSLeague/issues"><img src="https://img.shields.io/github/issues/Zer0Dev-exe/TSLeague?style=for-the-badge&color=orange" alt="Issues"></a>
  <a href="https://github.com/Zer0Dev-exe/TSLeague/blob/main/LICENSE"><img src="https://img.shields.io/badge/Licencia-CC%20BY--NC--ND%204.0-red?style=for-the-badge" alt="Licencia"></a>
  <img src="https://img.shields.io/badge/Node.js-1.0.0-green?style=for-the-badge&logo=node.js&logoColor=white">
  <img src="https://img.shields.io/badge/Discord.js-v14-blueviolet?style=for-the-badge&logo=discord&logoColor=white">
</p>

---

# TSLeague

**TSLeague** es una plataforma avanzada y automatizada para la gestión de ligas competitivas de Brawl Stars en Discord, diseñada para escalabilidad, control total y personalización.  
Incluye automatización de partidas, equipos, divisiones, estadísticas y flujos de comunicación, todo con arquitectura robusta y lógica de negocio desacoplada.

---

## Información técnica relevante

- **Versión actual:** 1.0.0 (`Node.js`)
- **Configuración flexible:** Todas las reglas de formato de liga (tamaño de divisiones, número de modos, mapas por set, horarios, permisos, colores, límites, etc) son modificables desde los archivos de configuración JSON y JS de `/src/configs/`.
- **No está limitado a un formato concreto:** El sistema soporta ligas round robin, ascensos/descensos, y el algoritmo de sets/mapas es parametrizable por cualquier organizador sin tocar el core.

---

## Características para desarrolladores

- **Arquitectura modular:** Separación clara entre lógica de negocio, comandos, eventos, embeds y utilidades.
- **Actualización de embeds y paneles en tiempo real:** Los canales de rankings, divisiones y equipos se actualizan automáticamente según los datos de la base.
- **Generación de imágenes customizadas:** El bot genera imágenes de partidos y resultados combinando recursos locales y la API de ImgBB, integrando imágenes de equipos, colores y textos a demanda (Canvas).
- **Automatización total de canales y roles:** Los canales privados de equipos y partidos, así como los roles de avisos, se crean y gestionan dinámicamente según la situación de la liga.
- **Programación de tareas y eventos:** Soporte para cron jobs internos, ejecución programada de nuevas jornadas, limpieza de equipos vacíos, gestión de deadlines y fechas límite, todo sin intervención manual.
- **Integración con API Brawl Stars:** Stats en tiempo real de jugadores y equipos, con gestión de verificación y roles condicionada a los datos de la API.
- **Sistema de logs avanzado:** Logs automáticos de cada acción relevante para el staff, con embeds y clasificación por nivel/severidad/evento.
- **Soporte para comandos slash y prefijo:** Adaptable a cualquier flujo de interacción Discord moderno.
- **Escalabilidad y robustez:** Control de errores, limpieza automática de entidades huérfanas, y timers para sincronización de datos y canales.
- **Extensibilidad:** Fácil de extender con nuevos comandos, integraciones, modos de juego o tipos de panel.

---

## Uso y despliegue

> **Este proyecto no es público ni redistribuible ni instalable fuera de la organización autorizada.**  
> Cualquier despliegue, fork, o uso parcial requiere autorización expresa de los titulares.

- **Configuración:** Toda la personalización de reglas, formatos, assets y parámetros funcionales se realiza desde `/src/configs/`.
- **No incluye documentación de instalación pública** por motivos de licencia y protección intelectual.

---

## Créditos y licencia

El desarrollo y la mayor parte del código ha sido realizado por **@tumonulo**, basado en la idea y propiedad intelectual original de **@Zer0Dev-exe**.

### Licencia

Este proyecto está protegido bajo la licencia [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/).

- **Atribución:** Debes dar crédito adecuado, incluir el enlace a la licencia e indicar si se han realizado cambios.
- **No comercial:** No se permite el uso con fines comerciales.
- **Sin obras derivadas:** No se permite modificar ni adaptar el código ni su lógica para crear trabajos derivados.
