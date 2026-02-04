// Obtener el query string ?id=xxx
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const teamId = getQueryParam('id');

const teamNameEl = document.getElementById('teamName');
const teamContentEl = document.getElementById('teamContent');

if (!teamId) {
  teamNameEl.textContent = "Equipo no especificado";
  teamContentEl.innerHTML = "";
} else {
  // Cargar teams.json
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
        return;
      }

      teamNameEl.textContent = team.team;

      // Cargar TXT de Dropbox
      fetch(team.dropbox_dir)
        .then(resp => {
          if (!resp.ok) throw new Error('No se pudo cargar el archivo del equipo');
          return resp.text();
        })
        .then(txt => {
          // Convertir TXT en vector de jugadores
          const lines = txt.trim().split('\n');

          // Detectar línea separadora (---) si existe
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

          // Crear tabla
          crearTabla(jugadores, headers);
        })
        .catch(err => {
          teamContentEl.innerHTML = "<p>Error cargando contenido del equipo.</p>";
          console.error(err);
        });
    })
    .catch(err => {
      teamNameEl.textContent = "Error cargando datos de equipos";
      teamContentEl.innerHTML = "";
      console.error(err);
    });
}

// Función para crear tabla HTML desde vector de jugadores
function crearTabla(jugadores, headers) {
  const tableWrapper = document.createElement('div');
  tableWrapper.style.overflowX = 'auto';
  tableWrapper.style.marginTop = '1rem';
  const tableHeader = document.createElement('h3');
  tableHeader.textContent = "Plantilla";
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';

  // Encabezado
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    th.style.border = '1px solid #ccc';
    th.style.padding = '6px';
    th.style.background = '#3498db';
    th.style.color = '#fff';
    th.style.fontSize = '12px';
    th.style.position = 'sticky';
    th.style.top = '0';
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  // Cuerpo
  const tbody = document.createElement('tbody');
  jugadores.forEach((j, idx) => {
    const tr = document.createElement('tr');
    tr.style.background = idx % 2 === 0 ? '#f9f9f9' : '#fff'; // zebra stripes

    headers.forEach(h => {
      const td = document.createElement('td');
      td.textContent = j[h];
      td.style.border = '1px solid #ccc';
      td.style.padding = '4px';
      td.style.fontSize = '12px';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  tableWrapper.appendChild(table);

  teamContentEl.innerHTML = '';
  teamContentEl.appendChild(tableWrapper);
}
