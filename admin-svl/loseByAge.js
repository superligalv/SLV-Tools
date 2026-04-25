import { getQueryParam, crearTabla, esSub21, esMayor30,
         porteros, defensas, delanteros, mediocampistas,mediapuntas, pivotes, posicion, parsearTablaSalarios,
		 avgporteros,avgdefensas,avgdelanteros,avgmediocampistas,avgmediapuntas, avgpivotes, totalPotencial,avgage,
  calcularSalarioJugador, potencialJugador,extremosPorteros,extremosDefensas,extremosDelanteros,extremosMedios,extremosPivotes,extremosMediapuntas,
  calcularSalarioTotal } from '../JS/utils.js';

const container = document.getElementById("teamsContainer");

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

// Nueva función para filtrar jugadores >= 30 años
function obtenerJugadoresMayores30(jugadores) {
  return jugadores
    .filter(j => parseInt(j.Age) >= 30)
    .map(j => ({
      name: j.Name,
      age: j.Age,
      minutos: parseInt(j.Min) || 0,
      partidos: parseInt(j.Gam) || 0
    }))
    .sort((a, b) => b.minutos - a.minutos); // Ordenar por minutos descendente
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
    <div style="margin-bottom: 30px;">
      <h2>📋 Jugadores de 30+ años por equipo</h2>
    </div>
  `;

  for (const team of teams) {
    const jugadores = await procesarEquipo(team);
    
    if (jugadores.length === 0) continue;

    const mayores30 = obtenerJugadoresMayores30(jugadores);
    
    // Solo mostrar equipos que tienen jugadores >= 30
    if (mayores30.length > 0) {
      html += `
        <div style="margin-bottom: 25px; padding: 20px; border: 2px solid #ddd; border-radius: 8px;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <img src="../images/flags/headerRund/${team.id}.png" width="40" height="40" style="margin-right: 15px; border-radius: 50%;"/>
            <h3 style="margin: 0; color: #333;">
              <a href="../ver_equipo.html?id=${team.id}" target="_blank" style="text-decoration: none; color: #007bff;">
                ${team.team} (${mayores30.length} jugadores 30+)
              </a>
            </h3>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Jugador</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Edad</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Partidos</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Minutos</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Min/Partido</th>
              </tr>
            </thead>
            <tbody>
      `;

      let totalMinutos = 0;
      let totalPartidos = 0;

      for (const jugador of mayores30) {
        const minPorPartido = jugador.partidos > 0 ? Math.round(jugador.minutos / jugador.partidos) : 0;
        totalMinutos += jugador.minutos;
        totalPartidos += jugador.partidos;

        html += `
          <tr style="background-color: ${jugador.minutos > 1000 ? '#fff3cd' : 'white'};">
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: 500;">${jugador.name}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${jugador.age}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${jugador.partidos}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">${jugador.minutos.toLocaleString()}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${minPorPartido}</td>
          </tr>
        `;
      }

      const totalMinPorPartido = totalPartidos > 0 ? Math.round(totalMinutos / totalPartidos) : 0;
      
      html += `
            </tbody>
            <tfoot>
              <tr style="background-color: #e9ecef; font-weight: bold;">
                <td style="border: 1px solid #ddd; padding: 10px;">TOTAL</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${mayores30.length}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${totalPartidos}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${totalMinutos.toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${totalMinPorPartido}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    }
  }

  // Si no hay ningún jugador 30+, mostrar mensaje
  if (html === `<div style="margin-bottom: 30px;"><h2>📋 Jugadores de 30+ años por equipo</h2></div>`) {
    html += `<p style="text-align: center; color: #666; font-style: italic;">No se encontraron jugadores de 30 años o más en ningún equipo.</p>`;
  }

  container.innerHTML = html;
}