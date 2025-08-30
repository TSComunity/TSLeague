<p align="center">
  <img src="https://media.discordapp.net/attachments/1366297762496249906/1374654925295845446/TS_LEAGUE.png?ex=682ed6aa&is=682d852a&hm=c15d97f6f7fd0f756ab034df54af062f821d0a4425b4695d793a7655220ebd92&=&format=webp&quality=lossless&width=1872&height=433" alt="TSLeague Banner" width="700"/>
</p>

<p align="center">
  <a href="https://github.com/Zer0Dev-exe/TSLeague/stargazers"><img src="https://img.shields.io/github/stars/Zer0Dev-exe/TSLeague?style=for-the-badge&color=yellow" alt="Stars"></a>
  <a href="https://github.com/Zer0Dev-exe/TSLeague/network/members"><img src="https://img.shields.io/github/forks/Zer0Dev-exe/TSLeague?style=for-the-badge&color=blue" alt="Forks"></a>
  <a href="https://github.com/Zer0Dev-exe/TSLeague/issues"><img src="https://img.shields.io/github/issues/Zer0Dev-exe/TSLeague?style=for-the-badge&color=orange" alt="Issues"></a>
  <a href="https://github.com/Zer0Dev-exe/TSLeague/blob/main/LICENSE"><img src="https://img.shields.io/badge/Licencia-CC%20BY--NC--ND%204.0-red?style=for-the-badge" alt="Licencia"></a>
  <img src="https://img.shields.io/github/package-json/v/Zer0Dev-exe/TSLeague?style=for-the-badge&color=purple" alt="Version">
  <img src="https://img.shields.io/badge/Made%20with-Node.js-green?style=for-the-badge&logo=node.js&logoColor=white">
  <img src="https://img.shields.io/badge/Discord.js-v14-blueviolet?style=for-the-badge&logo=discord&logoColor=white">
</p>

---

# TSLeague

> **Sistema avanzado y ultra-automatizado para gestión de ligas competitivas de Brawl Stars en Discord.**  
> Organiza, escala y controla torneos y ligas con la máxima eficiencia y profesionalidad.

---

## ⭐ Características principales

- **Temporadas, divisiones y ascensos automáticos**  
  - Hasta 12 equipos por división, ascensos/descensos automáticos, y jornadas round robin.
- **Gestión avanzada de equipos**  
  - Roles (líder, sub-líder, miembro), icono, color, código privado, panel visual y comandos interactivos.
- **Partidos tryhard al mejor de 3 modos/mapas**  
  - Algoritmo propio para evitar repeticiones. Horarios inteligentes y canales exclusivos por partido.
- **Paneles visuales y stats**  
  - Copas, victorias, rachas, MVP, imágenes de partidos y resultados generados automáticamente.
- **Automatización Discord**  
  - Canales privados, agentes libres, avisos, soporte y gestión de roles, todo sin intervención manual.
- **Herramientas staff**  
  - Slash commands, logs, mantenimiento, sanciones y administración avanzada.
- **Integración API oficial de Brawl Stars**  
  - Stats en tiempo real, verificación por tag y paneles de estadísticas de jugadores y equipos.

---

## 📸 Ejemplo visual

<p align="center">
  <img src="https://cdn.brawlify.com/maps/regular/15000007.png" width="320" alt="Ejemplo de mapa">
  <img src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png" width="80" alt="Premio">
  <img src="https://media.discordapp.net/attachments/1366297762496249906/1374654925295845446/TS_LEAGUE.png?ex=682ed6aa&is=682d852a&hm=c15d97f6f7fd0f756ab034df54af062f821d0a4425b4695d793a7655220ebd92&=&format=webp&quality=lossless&width=600&height=138" width="320" alt="Banner">
</p>

---

## 📚 Estructura del proyecto

- **src/ComandosSlash/** — Slash commands (admin, gestión avanzada)
- **src/ComandosPrefix/** — Comandos de prefijo clásicos
- **src/discord/** — Embeds, botones, menús, modals y lógica visual
- **src/services/** — Lógica de negocio (equipos, divisiones, partidos, rondas)
- **src/Esquemas/** — Modelos de datos (Mongoose)
- **src/configs/** — Configuración, colores, modos, emojis…
- **src/Eventos/** — Handlers de eventos Discord.js

---

## ⚡ Instalación y uso

1. **Clona el repo**  
   ```bash
   git clone https://github.com/Zer0Dev-exe/TSLeague.git
   cd TSLeague
   ```

2. **Instala dependencias**  
   ```bash
   npm install
   ```

3. **Prepara tus variables de entorno (`.env`):**
   ```
   TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxx
   PREFIX=!
   MONGODB_URL=mongodb://localhost:27017/tsleague
   BRAWL_STARS_API_KEY=tu_token_brawlstars
   IMGBB_API_KEY=tu_token_imgbb
   ```

4. **Ejecuta el bot**  
   ```bash
   node src/index.js
   ```

---

## 🏆 Flujos principales

### Usuarios
- Verifica tu cuenta con tu tag de Brawl Stars.
- Crea, únete o gestiona tu equipo desde paneles visuales o comandos.
- Consulta stats, partidos y ranking en los canales dedicados.
- Recibe avisos y resultados en tiempo real.

### Staff
- Comandos para administrar temporadas, divisiones, partidos, equipos y puntos.
- Logs automáticos de acciones importantes.
- Sanciones, mantenimiento y control total de la competición.

---

## 🔑 Principales comandos

| Comando / Panel         | Descripción                                      | Permisos         |
|------------------------|--------------------------------------------------|------------------|
| `/temporada empezar`   | Inicia una temporada                             | Staff            |
| `/division crear`      | Crea una división                                | Staff            |
| `/equipo crear`        | Crea un equipo                                   | Usuario          |
| `/partido crear`       | Crea partido oficial                             | Staff            |
| `/usuario verificar`   | Verifica tu cuenta de Brawl Stars                | Usuario          |
| `!inscribir`           | Panel visual de equipos                          | Usuario          |

---

## 🛡️ Licencia y créditos

Este proyecto está protegido bajo la licencia [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/).

**Copyright © 2025 Zer0Dev-exe y colaboradores**

> **IMPORTANTE:**  
> El desarrollo y la mayor parte del código han sido realizados por _Zer0Dev-exe_ pero la idea original y propiedad intelectual principal pertenecen a su amigo/colaborador.  
> Si este proyecto se utiliza, referencia o distribuye, es imprescindible acreditar tanto a **Zer0Dev-exe** como al propietario original de la idea.

**Puedes:**
- Compartir — copiar y redistribuir el material en cualquier medio o formato, solo en forma original (sin modificar) y con la atribución adecuada.

**Bajo las siguientes condiciones:**
- **Atribución:** debes dar crédito apropiado, incluir enlace a la licencia e indicar si se han realizado cambios.
- **No Comercial:** No puedes usar el material con fines comerciales.
- **Sin obras derivadas:** No puedes modificar, transformar ni crear a partir del material.

Texto completo de la licencia: [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)

---

<p align="center">
  <img src="https://cdn.discordapp.com/emojis/1410424993325645874.webp" width="60">
</p>
