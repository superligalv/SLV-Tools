import {
  posicion
} from '../JS/utils.js';

const container = document.getElementById("teamsContainer");

// ======================================
// Procesar equipo
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

    const headersLine = lines[0];

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
// Cargar todos jugadores
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
// TOP normal
// ======================================
function crearTop(
  jugadores,
  campo,
  limite = 10,
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

// ======================================
// TOP custom
// ======================================
function crearTopCustom(
  jugadores,
  calculo,
  limite = 10,
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
// Render Ranking
// ======================================
function renderRanking(
  titulo,
  jugadores,
  campo,
  decimales = 0
) {

  let html = `
  
    <h2 style="
      margin-top:40px;
      margin-bottom:10px;
    ">
      ${titulo}
    </h2>

    <table style="
      width:100%;
      border-collapse: collapse;
      margin-bottom:40px;
      background:white;
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

    let valor = 0;

    // Rankings custom
    if (j.rankingValue !== undefined) {

      valor = Number(j.rankingValue)
        .toFixed(decimales);

    } else {

      valor = j[campo] || 0;
    }

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
            width="22"
            height="22"
            style="
              vertical-align:middle;
              margin-right:6px;
            "
          />

          ${j.team}

        </td>

        <td style="border:1px solid #ddd;padding:8px;">
          ${posicion(j)}
        </td>

        <td style="border:1px solid #ddd;padding:8px;">
          ${valor}
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
fetch("./teams.json")

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

    console.log(
      "Jugadores cargados:",
      jugadores.length
    );

    // ==================================
    // GOLEADORES
    // ==================================
    const goleadores = crearTop(
      jugadores,
      "Gls",
      10
    );

    // ==================================
    // GOLES POR 90
    // ==================================
    const golesPor90 = crearTopCustom(

      jugadores,

      j => {

        const goles = parseInt(j.Gls || 0);
        const mins = parseInt(j.Min || 1);

        return (goles / mins) * 90;
      },

      10,

      j => parseInt(j.Min || 0) >= 800
    );

    // ==================================
    // ASISTENCIAS
    // ==================================
    const asistentes = crearTop(
      jugadores,
      "Ass",
      10
    );

    // ==================================
    // ASISTENCIAS POR 90
    // ==================================
    const asistenciasPor90 = crearTopCustom(

      jugadores,

      j => {

        const assists = parseInt(j.Ass || 0);
        const mins = parseInt(j.Min || 1);

        return (assists / mins) * 90;
      },

      10,

      j => parseInt(j.Min || 0) >= 800
    );

    // ==================================
    // CORTES
    // ==================================
    const cortes = crearTop(
      jugadores,
      "Ktk",
      10
    );

    // ==================================
    // CORTES POR 90
    // ==================================
    const cortesPor90 = crearTopCustom(

      jugadores,

      j => {

        const tackles = parseInt(j.Ktk || 0);
        const mins = parseInt(j.Min || 1);

        return (tackles / mins) * 90;
      },

      10,

      j => parseInt(j.Min || 0) >= 800
    );

    // ==================================
    // PORTEROS
    // ==================================
    const porteros = crearTop(
      jugadores,
      "Sav",
      10,
      j => posicion(j) === "GK"
    );

    // ==================================
    // PARADAS POR 90
    // ==================================
    const savesPor90 = crearTopCustom(

      jugadores,

      j => {

        const saves = parseInt(j.Sav || 0);
        const mins = parseInt(j.Min || 1);

        return (saves / mins) * 90;
      },

      10,

      j =>
        posicion(j) === "GK" &&
        parseInt(j.Min || 0) >= 500
    );

    // ==================================
    // EFECTIVIDAD PORTEROS
    // ==================================
    const efectividadPortero = crearTopCustom(

      jugadores,

      j => {

        const saves = parseInt(j.Sav || 0);
        const conceded = parseInt(j.Con || 1);

        return saves / conceded;
      },

      10,

      j =>
        posicion(j) === "GK" &&
        parseInt(j.Con || 0) > 0
    );

    // ==================================
    // MOMs
    // ==================================
    const moms = crearTop(
      jugadores,
      "MoM",
      10
    );

    // ==================================
    // CONTRIBUCIÓN OFENSIVA
    // ==================================
    const contribucionOfensiva = crearTopCustom(

      jugadores,

      j => {

        const goles = parseInt(j.Gls || 0);
        const assists = parseInt(j.Ass || 0);
        const mins = parseInt(j.Min || 1);

        return (
          ((goles + assists) / mins) * 90
        );
      },

      10,

      j => parseInt(j.Min || 0) >= 800
    );

    // ==================================
    // HTML
    // ==================================
    let html = `
    
      <h1>⚽ Rankings Globales</h1>

      <p>
        Total jugadores analizados:
        <strong>${jugadores.length}</strong>
      </p>
    `;

    // ==================================
    // Render rankings
    // ==================================
    html += renderRanking(
      "⚽ Top Goleadores",
      goleadores,
      "Gls"
    );

    html += renderRanking(
      "⚽ Goles por 90",
      golesPor90,
      "Gls/90",
      2
    );

    html += renderRanking(
      "🎯 Top Asistencias",
      asistentes,
      "Ass"
    );

    html += renderRanking(
      "🎯 Asistencias por 90",
      asistenciasPor90,
      "Ass/90",
      2
    );

    html += renderRanking(
      "🛡️ Top Cortes",
      cortes,
      "Ktk"
    );

    html += renderRanking(
      "🛡️ Cortes por 90",
      cortesPor90,
      "Ktk/90",
      2
    );

    html += renderRanking(
      "🧤 Top Paradas",
      porteros,
      "Sav"
    );

    html += renderRanking(
      "🧤 Paradas por 90",
      savesPor90,
      "Sav/90",
      2
    );

    html += renderRanking(
      "🧤 Efectividad Porteros",
      efectividadPortero,
      "Sav/Con",
      2
    );

    html += renderRanking(
      "⭐ Top MoMs",
      moms,
      "MoM"
    );

    html += renderRanking(
      "🔥 Contribución Ofensiva",
      contribucionOfensiva,
      "(G+A)/90",
      2
    );

    // ==================================
    // Pintar HTML
    // ==================================
    container.innerHTML = html;
  })

  .catch(err => {

    console.error(err);

    container.innerHTML = `
    
      <div style="
        color:red;
        border:1px solid red;
        padding:20px;
        background:#fff0f0;
      ">

        <h3>Error cargando datos</h3>

        <p>${err.message}</p>

      </div>
    `;
  });