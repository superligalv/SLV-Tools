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
// VARIABLES
// ===============================

const players = document.querySelectorAll(".player");
const zones = document.querySelectorAll(".zone");
const playersPanel = document.querySelector(".players-panel");

let draggedPlayer = null;

// ===============================
// DRAG START
// ===============================

players.forEach(player => {
  player.addEventListener("dragstart", () => {
    draggedPlayer = player;
  });
});

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

  // Si es suplente
  if (zoneName === "BENCH") {
    return currentCount < limits.BENCH.max;
  }

  // Verificar total titulares
  const totalStarters = getTotalStarters();

  // Si el jugador viene del campo, no contamos doble
  const isAlreadyStarter = draggedPlayer.closest(".field");

  if (!isAlreadyStarter && totalStarters >= MAX_STARTERS) {
    return false;
  }

  // Verificar máximo por posición
  if (currentCount >= limits[zoneName].max) {
    return false;
  }

  return true;
}

// ===============================
// DROP ZONES
// ===============================

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

// ===============================
// OPCIONAL: DEVOLVER AL PANEL
// ===============================

playersPanel.addEventListener("dragover", e => {
  e.preventDefault();
});

playersPanel.addEventListener("drop", e => {
  e.preventDefault();
  if (!draggedPlayer) return;

  playersPanel.appendChild(draggedPlayer);
  draggedPlayer = null;
});

// ===============================
// CARGA DE EQUIPO Y JUGADORES
// ===============================

if (!teamId) {
  teamName.textContent = "Equipo no especificado";
} else {

  fetch('./JS/teams.json')
    .then(res => res.ok ? res.json() : Promise.reject('Error cargando teams.json'))
    .then(equipos => {
	  const team = equipos.find(e => e.id === teamId.toLowerCase());
	  if (!team) throw 'Equipo no encontrado';

	  // Nombre del equipo
	  teamNameText.textContent = team.team;

	  // Logo del equipo
	  teamLogo.src = `./images/flags/\headerRund/${team.id}.png`;
	  teamLogo.alt = team.team;

	  return fetch(team.dropbox_dir);
	})
}