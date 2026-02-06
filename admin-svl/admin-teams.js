import { getQueryParam, crearTabla, esSub21, esMayor30,
         porteros, defensas, delanteros, mediocampistas,mediapuntas, pivotes, posicion, parsearTablaSalarios,
		 avgporteros,avgdefensas,avgdelanteros,avgmediocampistas,avgmediapuntas, avgpivotes, totalPotencial,avgage,
  calcularSalarioJugador, potencialJugador,
  calcularSalarioTotal } from '../JS/utils.js';

const container = document.getElementById("teamsContainer");


// ===============================
// Cargar y procesar un equipo
// ===============================
async function procesarEquipo(team) {
  try {
    console.log(`Procesando: ${team.team}`);

    const response = await fetch(team.dropbox_dir);
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

    const txt = await response.text();
    const lines = txt.trim().split('\n');
    const sep = lines.findIndex(l => l.includes('---'));
    const headersLine = sep >= 0 ? lines[0] : lines[0];
    const dataLines = sep >= 0 ? lines.slice(sep + 1) : lines.slice(1);
    const headers = headersLine.trim().split(/\s+/);

    const jugadores = dataLines
      .filter(l => l.trim() !== '')
      .map(line => {
        const values = line.trim().split(/\s+/);
        const jugador = {};
        headers.forEach((h, i) => jugador[h] = values[i] || '');
        return jugador;
      });

    console.log(`${team.team}: ${jugadores.length} jugadores cargados`);

    return jugadores;

  } catch (error) {
    console.error(`Error procesando ${team.team}:`, error);
    return [];
  }
}


// ===============================
// Cargar lista de equipos
// ===============================
fetch("../JS/teams.json")
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - No se pudo cargar teams.json`);
    }
    return res.json();
  })
  .then(teams => renderTeams(teams))
  .catch(err => {
    console.error("Error completo:", err);
    container.innerHTML = `
      <div style="color: red; padding: 20px; border: 1px solid red;">
        <h3>Error cargando equipos</h3>
        <p>${err.message}</p>
      </div>
    `;
  });


// ===============================
// Render tabla de equipos
// ===============================
async function renderTeams(teams) {
  if (!teams || !teams.length) {
    container.innerHTML = "<p>No hay equipos disponibles.</p>";
    return;
  }

  let html = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th>LOGO</th>
          <th>ID</th>
          <th>Equipo</th>
          <th>Salarios</th>
          <th>Potencial</th>
          <th>Jugadores</th>
          <th class="gk">GKS</th>
          <th>DFS</th>
          <th>DMS</th>
          <th>MFS</th>
          <th>AMS</th>
          <th>FWS</th>
        </tr>
      </thead>
      <tbody>
  `;
  for (const team of teams) {
    const t = await procesarEquipo(team);

    const cuentaJugadores = t.length;
    const port = porteros(t);
    const df = defensas(t);
    const fw = delanteros(t);
    const mfs = mediocampistas(t);
    const ams = mediapuntas(t);
    const dms = pivotes(t);
    const potencial = totalPotencial(t);
    html += `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">
          <img src="../images/flags/headerRund/${team.id}.png" width="50" height="50"/>
        </td>
        <td style="border: 1px solid #ddd; padding: 8px;">${team.id}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">
          <a href="../ver_equipo.html?id=${team.id}" target="_blank">
            ${team.team}
          </a>
        </td>
        <td style="border: 1px solid #ddd; padding: 8px;">-</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${potencial}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${cuentaJugadores}</td>
        <td style="border: 1px solid #ddd; padding: 8px;" class="gk">${port.count}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${df.count}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${dms.count}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${mfs.count}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${ams.count}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${fw.count}</td>
      </tr>
    `;
  }

  html += `
      </tbody>
    </table>
    <p style="margin-top: 20px;">Total equipos: ${teams.length}</p>
  `;

  container.innerHTML = html;
}
