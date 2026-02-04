// Importar funciones reutilizables
import { getQueryParam, crearTabla, esSub21, esMayor30 } from './JS/utils.js';

// Referencias a elementos HTML
const teamNameEl = document.getElementById('teamName');
const statsEl = document.getElementById('teamStats');
const teamContentEl = document.getElementById('teamContent');

// Obtener el id del equipo de la URL
const teamId = getQueryParam('id');

if (!teamId) {
  teamNameEl.textContent = "Equipo no especificado";
  teamContentEl.innerHTML = "";
  statsEl.innerHTML = "";
} else {
  // Cargar lista de equipos
  fetch('./JS/teams.json')
    .then(res => {
      if (!res.ok) throw new Error('No se pudo cargar teams.json');
      return res.json();
    })
    .then(equipos => {
      const team = equipos.find(e => e.id === teamId.toLowerCase());
      if (!team) {
        teamNameEl.textContent = "Equipo no encontrado";
        teamContentEl.innerHTML = "";
        statsEl.innerHTML = "";
        return;
      }

      teamNameEl.textContent = team.team;

      // Cargar TXT de Dropbox del equipo
      fetch(team.dropbox_dir)
        .then(resp => {
          if (!resp.ok) throw new Error('No se pudo cargar el archivo del equipo');
          return resp.text();
        })
        .then(txt => {
          // Parsear TXT a vector de jugadores
          const lines = txt.trim().split('\n');

          // Detectar línea separadora (---)
          const separatorIndex = lines.findIndex(l => l.includes('---'));
          let headersLine, dataLines;

          if (separatorIndex >= 0) {
            headersLine = lines[0];
            dataLines = lines.slice(separatorIndex + 1);
          } else {
            headersLine = lines[0];
            dataLines = lines.slice(1);
          }

          // Headers
          const headers = headersLine.trim().split(/\s+/);

          // Vector de jugadores
          const jugadores = dataLines
            .filter(line => line.trim() !== '')
            .map(line => {
              const values = line.trim().split(/\s+/);
              const jugador = {};
              headers.forEach((h, i) => {
                jugador[h] = values[i] || '';
              });
              return jugador;
            });

          // Crear tabla de jugadores
          crearTabla(jugadores, headers, teamContentEl);

          // Calcular estadísticas
          const sub21 = jugadores.filter(j => esSub21(j)).length;
          const mayor30 = jugadores.filter(j => esMayor30(j)).length;

          // Mostrar estadísticas
          statsEl.innerHTML = `
            Jugadores Sub21: ${sub21} <br>
            Jugadores >=30: ${mayor30}
          `;
        })
        .catch(err => {
          teamContentEl.innerHTML = "<p>Error cargando contenido del equipo.</p>";
          statsEl.innerHTML = "";
          console.error(err);
        });
    })
    .catch(err => {
      teamNameEl.textContent = "Error cargando datos de equipos";
      teamContentEl.innerHTML = "";
      statsEl.innerHTML = "";
      console.error(err);
    });
