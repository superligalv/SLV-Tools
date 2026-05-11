import {
  posicion
} from '../JS/utils.js';

const container = document.getElementById("teamsContainer");

// ======================================
// Procesar un equipo
// ======================================
async function procesarEquipo(team) {

  try {

    container.innerHTML = `
      <p>Cargando equipo: <strong>${team.team}</strong></p>
    `;

    const response = await fetch(team.dropbox_dir);

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const txt = await response.text();

    const lines = txt.trim().split('\n');

    const sep = lines.findIndex(l => l.includes('---'));

    const headersLine = sep >= 0 ? lines[0] : lines[0];

    const dataLines = sep >= 0
      ? lines.slice(sep + 1)
      : lines.slice(1);

    const headers = headersLine.trim().split(/\s+/);

    const jugadores = dataLines
      .filter(l => l.trim() !== '')
      .map(line => {

        const values = line.trim().split(/\s+/);

        const jugador = {};

        headers.forEach((h, i) => {
          jugador[h] = values[i] || '';
        });
		console.log(jugador);
        return jugador;
      });

    // Añadir datos del equipo
    jugadores.forEach(j => {
      j.team = team.team;
      j.teamId = team.id;
    });

    return jugadores;

  } catch (error) {

    console.error(`Error procesando ${team.team}:`, error);

    return [];
  }
}

// ======================================
// Cargar TODOS los jugadores
// ======================================
async function cargarTodosLosJugadores(teams) {

  const resultados = await Promise.all(

    teams.map(async team => {

      return await procesarEquipo(team);

    })
  );

  return resultados.flat();
}

// ======================================
// Crear TOP genérico
// ======================================
function crearTop(
  jugadores,
  campo,
  limite = 20,
  filtro = null
) {

  let lista = [...jugadores];

  if (filtro) {
    lista = lista.filter(filtro);
  }

  return lista
    .sort((a, b) => {

      const valorA = parseInt(a[campo] || 0);
      const valorB = parseInt(b[campo] || 0);

      return valorB - valorA;
    })
    .slice(0, limite);
}

function crearTopCustom(
  jugadores,
  calculo,
  limite = 20,
  filtro = null
) {

  let lista = [...jugadores];

  if (filtro) {
    lista = lista.filter(filtro);
  }

  return lista
    .map(j => {

      const valor = calculo(j);

      return {
        ...j,
        rankingValue: valor
      };
    })
    .sort((a, b) => b.rankingValue - a.rankingValue)
    .slice(0, limite);
}

// ======================================
// Render tabla ranking
// ======================================
function renderRanking(
  titulo,
  jugadores,
  campo
) {

  let html = `
  
    <h2 style="margin-top:40px;">
      ${titulo}
    </h2>

    <table style="
      width:100%;
      border-collapse: collapse;
      margin-bottom:40px;
    ">

      <thead>

        <tr style="background:#f2f2f2;">

          <th style="border:1px solid #ddd;padding:8px;">
            #
          </th>

          <th style="border:1px solid #ddd;padding:8px;">
            Jugador
          </th>

          <th style="border:1px solid #ddd;padding:8px;">
            Equipo
          </th>

          <th style="border:1px solid #ddd;padding:8px;">
            Pos
          </th>

          <th style="border:1px solid #ddd;padding:8px;">
            ${campo}
          </th>

        </tr>

      </thead>

      <tbody>
  `;

  jugadores.forEach((j, idx) => {

    html += `
    
      <tr>

        <td style="border:1px solid #ddd;padding:8px;">
          ${idx + 1}
        </td>

        <td style="border:1px solid #ddd;padding:8px;">
          ${j.Name || '-'}
        </td>

        <td style="border:1px solid #ddd;padding:8px;">

          <img
            src="../images/flags/headerRund/${j.teamId}.png"
            width="20"
            height="20"
            style="vertical-align:middle;margin-right:5px;"
          />

          ${j.team}

        </td>

        <td style="border:1px solid #ddd;padding:8px;">
          ${posicion(j)}
        </td>

        <td style="border:1px solid #ddd;padding:8px;">
          ${j[campo] || 0}
        </td>

      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  return html;
}

// ======================================
// MAIN
// ======================================
fetch("../JS/teams.json")

  .then(res => {

    if (!res.ok) {
      throw new Error(
        `HTTP ${res.status} - Error cargando teams.json`
      );
    }

    return res.json();
  })

  .then(async teams => {

    // ==================================
    // Cargar jugadores
    // ==================================
    const jugadores = await cargarTodosLosJugadores(teams);

    console.log("Jugadores cargados:", jugadores.length);

    // ==================================
    // TOP GOLEADORES
    // ==================================
    const goleadores = crearTop(
      jugadores,
      "Gls",
      5
    );
	
	const golesPorMinuto = crearTopCustom(
	  jugadores,
	  j => {

		const goles = parseInt(j.gls || 0);
		const mins = parseInt(j.mins || 0);

		return goles / mins;
	  }
	);
	
    // ==================================
    // TOP ASISTENTES
    // ==================================
    const asistentes = crearTop(
      jugadores,
      "Ass",
      5
    );

    // ==================================
    // TOP CORTES
    // ==================================
    const cortes = crearTop(
      jugadores,
      "Ktk",
      5
    );

    // ==================================
    // TOP PORTEROS
    // ==================================
    const porteros = crearTop(
      jugadores,
      "Sav",
      5,
      j => posicion(j) === "GK"
    );

    // ==================================
    // TOP MoMs
    // ==================================
    const moms = crearTop(
      jugadores,
      "MoM",
      5
    );

    // ==================================
    // Render HTML
    // ==================================
    let html = `
      <h1>Rankings Globales</h1>

      <p>
        Total jugadores analizados:
        <strong>${jugadores.length}</strong>
      </p>
    `;

    html += renderRanking(
      "⚽ Top Goleadores",
      goleadores,
      "Gls"
    );

    html += renderRanking(
      "🎯 Top Asistentes",
      asistentes,
      "Ass"
    );

    html += renderRanking(
      "🛡️ Top Cortes",
      cortes,
      "Ktk"
    );

    html += renderRanking(
      "🧤 Top Paradas",
      porteros,
      "Sav"
    );

    html += renderRanking(
      "Top Man of the Match",
      moms,
      "Mom"
    );

    container.innerHTML = html;
  })

  .catch(err => {

    console.error(err);

    container.innerHTML = `
    
      <div style="
        color:red;
        border:1px solid red;
        padding:20px;
      ">

        <h3>Error cargando datos</h3>

        <p>${err.message}</p>

      </div>
    `;
  });