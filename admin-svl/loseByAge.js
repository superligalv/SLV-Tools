import {
  getQueryParam, crearTabla, esSub21, esMayor30,
  porteros, defensas, delanteros, mediocampistas, mediapuntas, pivotes, posicion,
  parsearTablaSalarios,
  avgporteros, avgdefensas, avgdelanteros, avgmediocampistas, avgmediapuntas, avgpivotes,
  totalPotencial, avgage,
  calcularSalarioJugador, potencialJugador,
  extremosPorteros, extremosDefensas, extremosDelanteros, extremosMedios, extremosPivotes, extremosMediapuntas,
  calcularSalarioTotal
} from '../JS/utils.js';

const container = document.getElementById("teamsContainer");

let filasGlobal = [];

// ===============================
// TABLA EXPERIENCIA
// ===============================
const TABLA_EXPERIENCIA = {
  '30-32': { '0-499': 300, '500-999': 150 },
  '33-34': { '0-499': 650, '500-999': 400, '1000-1999': 250 },
  '35-36': { '0-499': 1000, '500-999': 700, '1000-1999': 450, '2000-2999': 200 },
  '>=37':  { '0-499': 1500, '500-999': 1100, '1000-1999': 850, '2000-2999': 600, '>=3000': 350 }
};

// ===============================
// RANGOS
// ===============================
function getRangoEdad(edad) {
  if (edad >= 37) return '>=37';
  if (edad >= 35) return '35-36';
  if (edad >= 33) return '33-34';
  if (edad >= 30) return '30-32';
  return null;
}

function getRangoMinutos(minutos) {
  if (minutos >= 3000) return '>=3000';
  if (minutos >= 2000) return '2000-2999';
  if (minutos >= 1000) return '1000-1999';
  if (minutos >= 500) return '500-999';
  return '0-499';
}

function calcularPuntosExperiencia(edad, minutos) {
  const rangoEdad = getRangoEdad(edad);
  const rangoMinutos = getRangoMinutos(minutos);
  if (!rangoEdad) return 0;
  return TABLA_EXPERIENCIA[rangoEdad][rangoMinutos] || 0;
}

// ===============================
// MINUTOS PARA NO PERDER EXP
// ===============================
function minutosParaNoPerderExp(minutos, edad) {
  const rangoEdad = getRangoEdad(edad);

  if (!rangoEdad) return 0;

  // Casos donde ya está en el mejor tramo posible
  if (minutos >= 3000) return 0;

  // buscamos el primer punto donde la EXP baja menos o igual que la actual
  const actualExp = calcularPuntosExperiencia(edad, minutos);

  for (let umbral of [500, 1000, 2000, 3000]) {
    const expEnUmbral = calcularPuntosExperiencia(edad, umbral);

    // cuando deja de empeorar → ya no pierde EXP relevante
    if (expEnUmbral <= actualExp) {
      return Math.max(0, umbral - minutos);
    }
  }

  return 0;
}

// ===============================
// PROCESAR EQUIPO
// ===============================
async function procesarEquipo(team) {
  try {
    const response = await fetch(team.dropbox_dir);
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

    const txt = await response.text();
    const lines = txt.trim().split('\n');
    const sep = lines.findIndex(l => l.includes('---'));

    const headersLine = lines[0];
    const dataLines = sep >= 0 ? lines.slice(sep + 1) : lines.slice(1);

    const headers = headersLine.trim().split(/\s+/);

    return dataLines
      .filter(l => l.trim() !== '')
      .map(line => {
        const values = line.trim().split(/\s+/);
        const jugador = {};
        headers.forEach((h, i) => jugador[h] = values[i] || '');
        return jugador;
      });

  } catch (error) {
    console.error(`Error procesando ${team.team}:`, error);
    return [];
  }
}

// ===============================
// FILTRAR + EXP
// ===============================
function obtenerJugadoresMayores30(jugadores) {
  return jugadores
    .filter(j => parseInt(j.Age) >= 30)
    .map(j => {
      const edad = parseInt(j.Age);
      const minutos = parseInt(j.Min) || 0;

      return {
        name: j.Name,
        age: edad,
        minutos,
        puntosExp: calcularPuntosExperiencia(edad, minutos),
        rangoEdad: getRangoEdad(edad),
        rangoMinutos: getRangoMinutos(minutos)
      };
    });
}

// ===============================
// CARGAR TEAMS
// ===============================
fetch("../JS/teams.json")
  .then(res => res.json())
  .then(teams => renderTeams(teams))
  .catch(err => {
    container.innerHTML = `<p style="color:red;">${err.message}</p>`;
  });

// ===============================
// RENDER GLOBAL
// ===============================
async function renderTeams(teams) {

  let filas = [];

  for (const team of teams) {
    const jugadores = await procesarEquipo(team);
    if (!jugadores.length) continue;

    const mayores30 = obtenerJugadoresMayores30(jugadores);

    for (const j of mayores30) {
      if (j.puntosExp <= 0) continue;

      filas.push({
        escudo: `../images/flags/headerRund/${team.id}.png`,
        abrev: team.id,
        equipo: team.team,
        jugador: j.name,
        edad: j.age,
        minutos: j.minutos,
        rango: `${j.rangoEdad}/${j.rangoMinutos}`,
        exp: j.puntosExp,
        faltanMin: minutosParaNoPerderExp(j.minutos, j.age)
      });
    }
  }

  filasGlobal = filas;
  renderTabla(filasGlobal);
}

// ===============================
// TABLA + FILTRO
// ===============================
function renderTabla(filas) {

  let html = `
    <div style="padding:10px;">
      <h2>📊 Bajada de Experiencia (30+)</h2>

      <div style="margin-bottom:10px;">
        <label><strong>Filtrar equipo:</strong></label>
        <select id="teamFilter" style="margin-left:10px; padding:5px;">
          <option value="ALL">Todos</option>
        </select>
      </div>

      <table style="width:100%; border-collapse: collapse; font-size:13px;">
        <thead>
          <tr style="background:#f2f2f2;">
            <th>Escudo</th>
            <th>Abrev</th>
            <th>Equipo</th>
            <th>Jugador</th>
            <th>Edad</th>
            <th>Min</th>
            <th>Umbral</th>
            <th>Faltan min</th>
            <th>EXP ↓</th>
          </tr>
        </thead>
        <tbody>
  `;

  for (const f of filas) {
    html += `
      <tr data-team="${f.equipo}">
        <td style="text-align:center;">
          <img src="${f.escudo}" width="28" height="28"/>
        </td>
        <td style="text-align:center; font-weight:bold;">${f.abrev}</td>
        <td>${f.equipo}</td>
        <td>${f.jugador}</td>
        <td style="text-align:center; font-weight:bold;">${f.edad}</td>
        <td style="text-align:center;">${f.minutos.toLocaleString()}</td>
        <td style="text-align:center; color:#666;">${f.rango}</td>
        <td style="text-align:center; color:#0d6efd; font-weight:bold;">
          ${f.faltanMin > 0 ? f.faltanMin.toLocaleString() : '-'}
        </td>
        <td style="text-align:center; font-weight:bold; color:#d63384;">
          ${f.exp}
        </td>
      </tr>
    `;
  }

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;

  activarFiltro();
}

// ===============================
// FILTRO EN TIEMPO REAL
// ===============================
function activarFiltro() {
  const select = document.getElementById("teamFilter");

  const equipos = [...new Set(filasGlobal.map(f => f.equipo))];

  equipos.forEach(eq => {
    const opt = document.createElement("option");
    opt.value = eq;
    opt.textContent = eq;
    select.appendChild(opt);
  });

  select.addEventListener("change", (e) => {
    const value = e.target.value;
    const rows = document.querySelectorAll("tbody tr");

    rows.forEach(row => {
      const team = row.getAttribute("data-team");
      row.style.display = (value === "ALL" || team === value) ? "" : "none";
    });
  });
}