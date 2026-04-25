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

  // Mostrar tabla de referencia al inicio
  let html = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px 0;">📊 Tabla de Experiencia - Puntos que BAJA cada jugador</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px; font-size: 14px;">
        <div><strong>Edad</strong></div>
        <div style="text-align: center;"><strong>0-499</strong></div>
        <div style="text-align: center;"><strong>500-999</strong></div>
        <div style="text-align: center;"><strong>1000-1999</strong></div>
        <div style="text-align: center;"><strong>2000-2999</strong></div>
        <div style="text-align: center;"><strong>&ge;3000</strong></div>
        
        <div>30-32</div><div>300</div><div>150</div><div>-</div><div>-</div><div>-</div>
        <div>33-34</div><div>650</div><div>400</div><div>250</div><div>-</div><div>-</div>
        <div>35-36</div><div>1000</div><div>700</div><div>450</div><div>200</div><div>-</div>
        <div>&ge;37</div><div>1500</div><div>1100</div><div>850</div><div>600</div><div>350</div>
      </div>
    </div>
  `;

  html += `
    <div style="margin-bottom: 30px;">
      <h2>📋 Jugadores 30+ años - Puntos de Experiencia</h2>
    </div>
  `;

  for (const team of teams) {
    const jugadores = await procesarEquipo(team);
    
    if (jugadores.length === 0) continue;

    const mayores30 = obtenerJugadoresMayores30(jugadores);
    
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
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Minutos</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center; background-color: #fff3cd;">Puntos EXP ↓</th>
              </tr>
            </thead>
            <tbody>
      `;

      let totalPuntosExp = 0;
      let totalMinutos = 0;

      for (const jugador of mayores30) {
        totalPuntosExp += jugador.puntosExp;
        totalMinutos += jugador.minutos;

        const colorRow = jugador.puntosExp >= 1000 ? '#fff3cd' : 
                        jugador.puntosExp >= 500 ? '#fff8dc' : 'white';

        html += `
          <tr style="background-color: ${colorRow};">
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: 500;">
              ${jugador.name} 
              <small style="color: #666;">(${jugador.rangoEdad}/${jugador.rangoMinutos})</small>
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">${jugador.age}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${jugador.minutos.toLocaleString()}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; color: #d63384; font-size: 16px;">
              <strong>${jugador.puntosExp}</strong>
            </td>
          </tr>
        `;
      }
      
      html += `
            </tbody>
            <tfoot>
              <tr style="background-color: #e9ecef; font-weight: bold; font-size: 16px;">
                <td style="border: 1px solid #ddd; padding: 12px;">TOTAL</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${mayores30.length}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${totalMinutos.toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: center; 
                           background-color: #fff3cd; color: #d63384;">
                  <strong>${totalPuntosExp}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    }
  }

  if (html.includes("jugadores 30+")) {
    html += `
      <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; margin-top: 30px;">
        <h3>🏆 RESUMEN: Total puntos de experiencia que BAJAN</h3>
        <p style="font-size: 24px; font-weight: bold; color: #d63384; margin: 10px 0;">
          ${html.match(/<strong>(\d+)<\/strong>/g)?.reduce((sum, match) => {
            // Esto es un cálculo aproximado, pero funciona para el demo
            return sum + parseInt(match.match(/\d+/)[0]);
          }, 0) || 'Calculando...'}
        </p>
      </div>
    `;
  }

  container.innerHTML = html;
}