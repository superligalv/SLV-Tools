// ===============================
// FUNCIÓN PARA OBTENER PARÁMETROS DE URL
// ===============================
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// ===============================
// FUNCIÓN POSICIÓN (¡NECESARIA!)
// ===============================
function posicion(jugador) {
  const St = parseInt(jugador.St, 10) || 0;
  const Tk = parseInt(jugador.Tk, 10) || 0;
  const Ps = parseInt(jugador.Ps, 10) || 0;
  const Sh = parseInt(jugador.Sh, 10) || 0;
  
  const maxValor = Math.max(St, Tk, Ps, Sh);
  
  if (maxValor === St) return "GK";
  if (maxValor === Tk) return "DF";
  if (maxValor === Sh) return "FW";
  
  if (Tk > Sh && Tk >= 9) return "DM";
  if (Sh > Tk && Sh >= 9) return "AM";
  
  return "MF";
}

// ===============================
// CONFIGURACIÓN DE LÍMITES
// ===============================
const teamId = getQueryParam('id');

const limits = {
  GK: { min: 1, max: 1 },
  DF: { min: 2, max: 7 },
  DM: { min: 0, max: 3 },
  MF: { min: 0, max: 6 },
  AM: { min: 0, max: 3 },
  FW: { min: 1, max: 5 },
  BENCH: { min: 0, max: 5 }
};

const MAX_STARTERS = 11;

// ===============================
// VARIABLES (se inicializarán después)
// ===============================
let players = [];
let zones = [];
let playersPanel = null;
let playersContainer = null;
let draggedPlayer = null;

// Elementos del DOM
const teamNameEl = document.getElementById('teamName');
const teamNameTextEl = document.getElementById('teamNameText');
const teamLogoEl = document.getElementById('teamLogo');

// ===============================
// INICIALIZAR CUANDO EL DOM ESTÉ LISTO
// ===============================
document.addEventListener('DOMContentLoaded', function() {
  // Obtener referencias a elementos del DOM
  zones = document.querySelectorAll(".zone");
  playersPanel = document.querySelector(".players-panel");
  playersContainer = document.getElementById('players-container');
  
  // Inicializar drag and drop para zonas (sin jugadores aún)
  initDropZones();
  
  // Cargar equipo
  cargarEquipo();
});

// ===============================
// INICIALIZAR ZONAS DE DROP
// ===============================
function initDropZones() {
  zones.forEach(zone => {
    zone.addEventListener("dragover", e => {
      e.preventDefault(); // OBLIGATORIO
    });

    zone.addEventListener("drop", e => {
      e.preventDefault();
      if (!draggedPlayer) return;

      if (!canDrop(zone)) {
        alert("No permitido por límites de formación");
        return;
      }

      zone.appendChild(draggedPlayer);
      draggedPlayer = null;
    });
  });

  if (playersPanel) {
    playersPanel.addEventListener("dragover", e => {
      e.preventDefault();
    });

    playersPanel.addEventListener("drop", e => {
      e.preventDefault();
      if (!draggedPlayer) return;

      // Si hay contenedor específico, usar ese
      if (playersContainer) {
        playersContainer.appendChild(draggedPlayer);
      } else {
        playersPanel.appendChild(draggedPlayer);
      }
      draggedPlayer = null;
    });
  }
}

// ===============================
// FUNCIONES AUXILIARES
// ===============================
function getZonePlayers(zoneElement) {
  return zoneElement.querySelectorAll(".player").length;
}

function getTotalStarters() {
  return document.querySelectorAll(".field .zone:not(.bench) .player").length;
}

function canDrop(zoneElement) {
  const zoneName = zoneElement.dataset.zone;
  const currentCount = getZonePlayers(zoneElement);

  if (!draggedPlayer) return false;

  // Si es suplente
  if (zoneName === "BENCH") {
    return currentCount < limits.BENCH.max;
  }

  // Verificar total titulares
  const totalStarters = getTotalStarters();
  const isAlreadyStarter = draggedPlayer.closest(".field");

  if (!isAlreadyStarter && totalStarters >= MAX_STARTERS) {
    alert("Ya tienes 11 titulares");
    return false;
  }

  // Verificar máximo por posición
  if (currentCount >= limits[zoneName]?.max) {
    alert(`Máximo ${limits[zoneName].max} en ${zoneName}`);
    return false;
  }

  return true;
}

// ===============================
// RENDERIZAR JUGADORES EN EL PANEL
// ===============================
function renderizarJugadoresPanel(jugadores, containerEl) {
  if (!containerEl) {
    console.error('Container element not found');
    return;
  }
  
  containerEl.innerHTML = "";
  
  jugadores.forEach(j => {
    const pos = posicion(j).toLowerCase();
    // Buscar el nombre (ajusta según tus datos)
	console.log(j);
    const nombre = j.Name;
    
    const div = document.createElement('div');
    div.className = `player ${pos}`;
    div.draggable = true;
    div.textContent = nombre;
    div.setAttribute('data-role', pos.toUpperCase());
    
    // Guardar datos completos como atributo (opcional)
    div.setAttribute('data-st', j.St || 0);
    div.setAttribute('data-tk', j.Tk || 0);
    div.setAttribute('data-ps', j.Ps || 0);
    div.setAttribute('data-sh', j.Sh || 0);
    
    containerEl.appendChild(div);
  });
  
  // Reinicializar drag start para los nuevos jugadores
  initPlayerDrag();
  console.log(`Renderizados ${jugadores.length} jugadores`);
}

// ===============================
// INICIALIZAR DRAG DE JUGADORES
// ===============================
function initPlayerDrag() {
  const playerElements = document.querySelectorAll(".player");
  playerElements.forEach(player => {
    player.addEventListener("dragstart", () => {
      draggedPlayer = player;
    });
  });
}

// ===============================
// CARGA DE EQUIPO Y JUGADORES
// ===============================
function cargarEquipo() {
  if (!teamId) {
    if (teamNameTextEl) teamNameTextEl.textContent = "Equipo no especificado";
    return;
  }

  fetch('./JS/teams.json')
    .then(res => {
      if (!res.ok) throw new Error('Error cargando teams.json');
      return res.json();
    })
    .then(equipos => {
      const team = equipos.find(e => e.id === teamId.toLowerCase());
      if (!team) throw new Error('Equipo no encontrado');

      // Nombre del equipo
      if (teamNameTextEl) teamNameTextEl.textContent = team.team;

      // Logo del equipo
      if (teamLogoEl) {
        teamLogoEl.src = `./images/flags/headerRund/${team.id}.png`;
        teamLogoEl.alt = team.team;
      }

      return fetch(team.dropbox_dir);
    })
    .then(resp => {
      if (!resp.ok) throw new Error('Error cargando TXT');
      return resp.text();
    })
    .then(txt => {
      const lines = txt.trim().split('\n');
      const sep = lines.findIndex(l => l.includes('---'));
      const headersLine = sep >= 0 ? lines[0] : lines[0];
      const dataLines = sep >= 0 ? lines.slice(sep + 1) : lines.slice(1);
      const headers = headersLine.trim().split(/\s+/);

      const jugadores = dataLines
        .filter(l => l.trim() !== '')
        .map(line => {
          const values = line.trim().split(/\s+/);
          const j = {};
          headers.forEach((h, i) => j[h] = values[i] || '');
          return j;
        });

      // Renderizar jugadores en el panel
      if (playersContainer) {
        renderizarJugadoresPanel(jugadores, playersContainer);
      } else {
        console.error('No se encontró players-container');
      }

      // Aquí puedes llamar a otras funciones como crearTabla, etc.
      console.log('Jugadores cargados:', jugadores.length);
    })
    .catch(err => {
      console.error('Error:', err);
      if (teamNameTextEl) teamNameTextEl.textContent = "Error cargando equipo";
    });
}