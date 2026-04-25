import { getQueryParam, crearTabla, esSub21, esMayor30,
         porteros, defensas, delanteros, mediocampistas,mediapuntas, pivotes, posicion, parsearTablaSalarios,
		 avgporteros,avgdefensas,avgdelanteros,avgmediocampistas,avgmediapuntas, avgpivotes, totalPotencial,avgage,
  calcularSalarioJugador, potencialJugador,extremosPorteros,extremosDefensas,extremosDelanteros,extremosMedios,extremosPivotes,extremosMediapuntas,
  calcularSalarioTotal } from '../JS/utils.js';

const container = document.getElementById("teamsContainer");

// ===============================
/* TABLA DE EXPERIENCIA - PUNTOS QUE BAJA */
// ===============================
const TABLA_EXPERIENCIA = {
  '30-32': { '0-499': 300, '500-999': 150 },
  '33-34': { '0-499': 650, '500-999': 400, '1000-1999': 250 },
  '35-36': { '0-499': 1000, '500-999': 700, '1000-1999': 450, '2000-2999': 200 },
  '>=37':  { '0-499': 1500, '500-999': 1100, '1000-1999': 850, '2000-2999': 600, '>=3000': 350 }
};

// Función para calcular rango de edad
function getRangoEdad(edad) {
  if (edad >= 37) return '>=37';
  if (edad >= 35) return '35-36';
  if (edad >= 33) return '33-34';
  if (edad >= 30) return '30-32';
  return null;
}

// Función para calcular rango de minutos
function getRangoMinutos(minutos) {
  if (minutos >= 3000) return '>=3000';
  if (minutos >= 2000) return '2000-2999';
  if (minutos >= 1000) return '1000-1999';
  if (minutos >= 500) return '500-999';
  return '0-499';
}

// Función para calcular puntos de experiencia que baja
function calcularPuntosExperiencia(edad, minutos) {
  const rangoEdad = getRangoEdad(edad);
  const rangoMinutos = getRangoMinutos(minutos);
  
  if (!rangoEdad) return 0;
  
  const puntos = TABLA_EXPERIENCIA[rangoEdad][rangoMinutos];
  return puntos || 0;
}

// ===============================
// Cargar y procesar un equipo
// ===============================
async function procesarEquipo(team) {
  try {
    container.innerHTML = `Cargando equipo: <strong>${team.team}</strong>...`;
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

    return jugadores;

  } catch (error) {
    console.error(`Error procesando ${team.team}:`, error);
    return [];
  }
}

// Nueva función para filtrar jugadores >= 30 años + calcular experiencia
function obtenerJugadoresMayores30(jugadores) {
  return jugadores
    .filter(j => parseInt(j.Age) >= 30)
    .map(j => {
      const edad = parseInt(j.Age);
      const minutos = parseInt(j.Min) || 0;
      const partidos = parseInt(j.Gam) || 0;
      
      return {
        name: j.Name,
        age: edad,
        minutos,
        partidos,
        puntosExp: calcularPuntosExperiencia(edad, minutos),
        rangoEdad: getRangoEdad(edad),
        rangoMinutos: getRangoMinutos(minutos)
      };
    })
    .sort((a, b) => b.puntosExp - a.puntosExp || b.minutos - a.minutos);
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

  let filas = [];

  for (const team of teams) {
    const jugadores = await procesarEquipo(team);
    if (!jugadores.length) continue;

    const mayores30 = obtenerJugadoresMayores30(jugadores);

    for (const j of mayores30) {
      // ❌ excluir los que no bajan EXP
      if (j.puntosExp <= 0) continue;

      filas.push({
        escudo: `../images/flags/headerRund/${team.id}.png`,
        abrev: team.id,
        equipo: team.team,
        jugador: j.name,
        minutos: j.minutos,
        rango: `${j.rangoEdad}/${j.rangoMinutos}`,
        exp: j.puntosExp
      });
    }
  }

  // ordenar opcional (más impacto arriba)
  filas.sort((a, b) => b.exp - a.exp);

  let html = `
    <div style="padding: 10px;">
      <h2>📊 Bajada de Experiencia (jugadores 30+)</h2>

      <table style="width:100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background:#f2f2f2;">
            <th>Escudo</th>
            <th>Abrev</th>
            <th>Equipo</th>
            <th>Jugador</th>
            <th>Min</th>
            <th>Umbral</th>
            <th>EXP ↓</th>
          </tr>
        </thead>
        <tbody>
  `;

  for (const f of filas) {
    html += `
      <tr>
        <td style="text-align:center;">
          <img src="${f.escudo}" width="28" height="28"/>
        </td>
        <td style="text-align:center; font-weight:bold;">${f.abrev}</td>
        <td>${f.equipo}</td>
        <td style="font-weight:500;">${f.jugador}</td>
        <td style="text-align:center;">${f.minutos.toLocaleString()}</td>
        <td style="text-align:center; font-size:12px; color:#666;">${f.rango}</td>
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
}