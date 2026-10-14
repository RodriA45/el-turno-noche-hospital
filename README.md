# 🏥 El Turno Noche: Hospital San Anselmo (The Night Shift)
### 🎮 3D Episodic Psychological Horror Game | Videojuego de Terror Psicológico Episódico en 3D

[![Three.js](https://img.shields.io/badge/Three.js-r186+-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2023+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PC%20%7C%20Mobile-34A853?style=for-the-badge)](https://developer.mozilla.org/)
[![License](https://img.shields.io/badge/License-MIT-red?style=for-the-badge)](LICENSE)

---

> **Idiomas / Languages:**  
> 🇪🇸 **[Versión en Español](#-versión-en-español)** | 🇬🇧 **[English Version](#-english-version)**

---

<a name="versión-en-español"></a>
## 🇪🇸 Versión en Español

### 🩸 Sinopsis

En **El Turno Noche: Hospital San Anselmo**, tomas el control de **Clara**, una joven recepcionista que asume su primera guardia nocturna (23:55 PM) en un vetusto hospital provincial de los años 50.

Antes de marcharse, sus compañeras de turno le entregan las llaves, el libro de guardia y una advertencia inquebrantable:
> *"Hay una sola regla en este turno... **NUNCA mires las cámaras del cuarto piso**. La última recepcionista lo hizo y hoy está recluida en un psiquiátrico repitiendo la misma frase: 'Él sigue arriba en la oscuridad...'."*

A lo largo de 5 capítulos de tensión psicológica creciente, llamadas telefónicas perturbadoras a las 02:30 AM, fichas médicas censuradas de 1984 y avistamientos en las cámaras de seguridad CCTV, Clara desentrañará el trágico secreto de los **hermanos gemelos Valenzuela**: un asesinato encubierto entre cuatro paredes, un espíritu que clama auxilio sin saber que fue traicionado por su propia sangre, y un bucle temporal aterrador.

---

### ✨ Características Principales

- 🎬 **Formato Episódico Estilo *Fears to Fathom*:** 5 capítulos narrativos con títulos cinemáticos, decisiones que bifurcan los eventos, notas legibles e interactividad inmersiva.
- 🌐 **100% Nativo en el Navegador:** Sin necesidad de descargar gigabytes de paquetes ni motores pesados. Carga ultrarrápida mediante Three.js y Vite.
- 📱 **Soporte Completo para PC y Dispositivos Móviles:**
  - **PC:** Control en primera persona con bloqueo de ratón en 360° y teclado.
  - **Móviles (Android / iOS):** Joystick analógico flotante virtual, zona táctil para mirar, botones dedicados de linterna, agacharse e interactuar, y advertencia de orientación apaisada.
- 💡 **Gráficos 3D Realistas y Ambientación Opresiva:**
  - Linterna con proyección óptica real (*cookie/gobo de Fresnel*), halo difuso, *hotspot* y balanceo por inercia física en mano.
  - Texturas PBR procedimentales en alta resolución (revoque hospitalario descascarado, linóleo damero con reflejos especulares y marcas de neumáticos, techos acústicos microperforados).
  - Arquitectura hospitalaria fiel: zócalos de goma oscura, guardacamillas protectores continuos, monitores CRT retro con pantalla curva, taquillas y armarios de medicamentos con clave.
- 📹 **Sistema de Monitores CCTV Realista:** Cámaras de vigilancia con líneas de escaneo analógicas CRT, reloj en tiempo real, piloto de grabación parpadeante (*REC*), estática y el aterrador susto del reflejo en el cristal.
- 🔊 **Audio 3D Espacial Procedural (Web Audio API):** Cero archivos de audio pesados externos. Todo sintetizado en tiempo real por código: drones de sub-graves, silbidos de viento, motor HRTF de paneo 3D para el fantasma, pasos, sollozos infantiles y timbres analógicos.
- ⚡ **Eventos de Reacción Rápida (QTE):** Esquiva sillas de ruedas fuera de control, camillas en la oscuridad y el ataque final del asesino empuñando un bisturí quirúrgico.

---

### 🕹️ Controles del Juego

| Acción | Computadora (PC / Mac) | Dispositivo Móvil / Tablet |
|---|---|---|
| **Moverse** | `W`, `A`, `S`, `D` o Flechas | Joystick analógico táctil (mitad izquierda) |
| **Mirar / Girar** | Movimiento del ratón | Deslizar dedo (mitad derecha) |
| **Interactuar** | Tecla `E` | Botón táctil `[ACTUAR]` (se ilumina en verde) |
| **Linterna** | Tecla `F` (consume batería) | Botón táctil `[LINTERNA]` |
| **Agacharse / Sigilo** | Tecla `C` o `Ctrl Izquierdo` | Botón táctil `[AGACHADA]` |
| **Correr (Sprint)** | `Shift Izquierdo` (consume aguante) | Empujar joystick virtual al extremo superior |
| **Elegir opciones** | Teclas `1` y `2` o clic | Tocar directamente sobre la decisión |
| **QTEs (Esquivar)** | Tecla en pantalla (`A`, `D`, `ESPACIO`) | Tocar el botón rojo pulsante de gran tamaño |
| **Pausa / Cerrar** | Tecla `Escape` | Botón `[PAUSA]` en esquina superior |

---

### 🚀 Instalación y Puesta en Marcha

#### Método Rápido (Windows):
Simplemente haz doble clic sobre el archivo ejecutable:
```bash
INICIAR_JUEGO.bat
```
*El script verificará Node.js, instalará las dependencias necesarias automáticamente y abrirá tu navegador predeterminado en `http://127.0.0.1:5173/`.*

#### Método Manual (Cualquier Sistema Operativo: Windows, Linux, macOS):
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TU-USUARIO/el-turno-noche-hospital.git
   cd el-turno-noche-hospital
   ```
2. **Instalar dependencias:**
   ```bash
   npm install
   ```
3. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev -- --open
   ```
4. **Compilar para producción (despliegue en la web):**
   ```bash
   npm run build
   ```
   *Los archivos optimizados y listos para producción se generarán en la carpeta `dist/`.*

---

<a name="english-version"></a>
## 🇬🇧 English Version

### 🩸 Synopsis

In **The Night Shift: San Anselmo Hospital**, you step into the shoes of **Clara**, a young receptionist working her first overnight shift (11:55 PM) at an aged 1950s provincial medical facility.

Before leaving, the outgoing staff hands over the keys, the shift logbook, and one non-negotiable rule:
> *"There's only one strict rule on this shift... **NEVER watch the 4th floor security cameras**. The last receptionist did, and today she's locked in a psychiatric asylum muttering the same words: 'He's still up there in the dark...'."*

Across 5 chapters of escalating psychological dread, chilling telephone calls at 2:30 AM, redacted 1984 autopsy records, and disturbing sightings on the CCTV monitors, Clara will uncover the tragic secret of the **Valenzuela twin brothers**: a covered-up murder within sealed hospital walls, an innocent ghost pleading for help unaware of his twin's betrayal, and an inescapable time loop.

---

### ✨ Key Features

- 🎬 **Episodic *Fears to Fathom* Style:** 5 narrative chapters featuring cinematic title cards, branching moral choices, readable lore notes, and intense environmental storytelling.
- 🌐 **100% Native Web Browser Game:** No multi-gigabyte downloads or bloated game engines. Ultra-fast loading powered by Three.js and Vite.
- 📱 **Full Desktop & Mobile Support:**
  - **Desktop (PC / Mac):** Smooth first-person navigation with pointer lock and 360° mouse look.
  - **Mobile (iOS / Android):** Floating virtual analog joystick, touch drag look, dedicated buttons for flashlight, crouching, and interacting, plus portrait rotation prompts.
- 💡 **Realistic 3D Atmosphere & Lighting:**
  - Flashlight with authentic optical projection (*Fresnel cookie lens*), soft penumbra, halogen hotspot, and physical inertia sway.
  - High-resolution procedural PBR textures (decaying hospital plaster, checkered linoleum tiles with specular reflections, scuff marks, and acoustic drop-ceiling tiles).
  - Authentic medical architecture: dark rubber baseboards, hospital corridor bumper crash rails, curved CRT monitors with vents, and emergency exit signs with green emissive glow.
- 📹 **Surveillance CCTV CRT System:** Multi-camera feed with analog scanlines, real-time surveillance clock, flashing red REC indicator, static interference, and a chilling screen reflection jumpscare.
- 🔊 **Synthesized Spatial 3D Audio (Web Audio API):** Zero external sound files. Real-time procedural audio synthesis: sub-bass tension drones, wind filters, HRTF 3D spatial panner for entities, footsteps, crying children, and analog telephone bells.
- ⚡ **High-Stakes Quick Time Events (QTE):** Dodge runaway wheelchairs, collapsing gurneys, and survive a deadly lunge from an unhinged brother wielding a surgical scalpel.

---

### 🕹️ Controls Guide

| Action | PC / Mac | Mobile / Tablet |
|---|---|---|
| **Move** | `W`, `A`, `S`, `D` or Arrow Keys | Virtual Analog Joystick (left side) |
| **Look Around** | Mouse Movement | Drag finger on screen (right side) |
| **Interact** | `E` Key | Touch `[ACT]` button (pulses green when near) |
| **Flashlight** | `F` Key (consumes battery) | Touch `[FLASH]` button |
| **Crouch / Stealth** | `C` or `Left Ctrl` | Touch `[CROUCH]` button |
| **Sprint** | `Left Shift` (consumes stamina) | Push joystick to outer top ring |
| **Dialogue Choices** | `1` & `2` Keys or Click | Tap desired option card |
| **QTE (Dodge)** | Indicated Key (`A`, `D`, `SPACE`) | Tap the large pulsing red QTE button |
| **Pause / Close Note**| `Escape` Key | Touch `[PAUSE]` in top-right corner |

---

### 🚀 Quick Start & Installation

#### Windows One-Click Launch:
Double-click the included batch launcher:
```bash
INICIAR_JUEGO.bat
```
*It automatically checks for Node.js, installs required packages, and opens your default browser at `http://127.0.0.1:5173/`.*

#### Manual Setup (Windows, macOS, Linux):
1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/the-night-shift-hospital.git
   cd the-night-shift-hospital
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Launch the development server:**
   ```bash
   npm run dev -- --open
   ```
4. **Build production bundle:**
   ```bash
   npm run build
   ```
   *Static assets ready for deployment will be generated in `dist/`.*

---

## 📂 Project Architecture / Estructura del Proyecto

```text
├── INICIAR_JUEGO.bat       # Lanzador automático de 1 clic (Windows)
├── index.html              # HTML5 contenedor con HUD, canvas y overlays
├── package.json            # Configuración de dependencias (Three.js, Vite)
├── vite.config.js          # Configuración del bundler
├── src/
│   ├── main.js             # Bucle principal, renderizado WebGL y resolución adaptativa
│   ├── style.css           # Estilos oscuros, scanlines CRT, grano de película y HUD móvil
│   ├── chapters.js         # Guión completo de los 5 Capítulos y eventos cinemáticos
│   ├── audio/
│   │   └── AudioManager.js # Síntesis de sonido procedural 3D con Web Audio API
│   ├── core/
│   │   ├── Game.js         # Coordinador central de juego, estados, CCTV, QTEs y diálogos
│   │   └── Input.js        # Manejo híbrido de teclado/ratón y joystick virtual táctil
│   ├── data/
│   │   └── floors.js       # Generador de planos y distribución de los 4 pisos del hospital
│   ├── enemy/
│   │   └── Ghost.js        # IA de actores, fantasma con pathfinding BFS y animaciones
│   ├── player/
│   │   └── Player.js       # Jugador en 1ª persona, linterna con cookie, sigilo y cámara
│   ├── ui/
│   │   └── Cctv.js         # Renderizado de cámaras de seguridad CCTV en canvas CRT 2D
│   └── world/
│       ├── Hospital.js     # Constructor de arquitectura, zócalos, colisiones e iluminación
│       ├── Models.js       # Modelos 3D anatómicos, muebles clínicos, CRT, camillas y accesorios
│       └── Textures.js     # Texturas PBR procedimentales, cookie de linterna y rostros
```

---

## 🛠️ Tech Stack

- **Core Engine:** [Three.js](https://threejs.org/) (WebGL 3D Rendering, ACESFilmic Tone Mapping, SpotLight Cookies, Dynamic Shadows).
- **Audio Engine:** HTML5 Web Audio API (Spatial HRTF Panner, BiquadFilters, Procedural Noise & Oscillator Synthesizers).
- **Styling & UI:** Vanilla CSS3 (Custom Glassmorphism, Responsive Mobile Viewports, CRT Filter Overlays).
- **Bundler:** [Vite](https://vitejs.dev/) (Instant HMR, tree-shaking, production code splitting).

---

## 📄 License

This project is licensed under the **MIT License**. Free for educational, portfolio, and non-commercial game development use.

Developed with passion for psychological horror and web technologies. 🕯️
