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
    //console.log(`Procesando: ${team.team}`);
	// 👇 Actualiza el texto en la web
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

    //console.log(`${team.team}: ${jugadores.length} jugadores cargados`);

    return jugadores;

  } catch (error) {
    console.error(`Error procesando ${team.team}:`, error);
    return [];
  }
}

async function procesarSalarios(jugadores) {
  const cfg = await fetch('../JS/salary.cfg').then(r => r.text());
  const tablaSalarios = parsearTablaSalarios(cfg);

  jugadores.forEach(j => {
    j.salario = parseFloat(calcularSalarioJugador(j, tablaSalarios));
	j.potencial = potencialJugador(j);
  });

  const salarioTotal = calcularSalarioTotal(jugadores);

  //console.log(jugadores.map(j => j.potencial));
  ////console.log("Total:", salarioTotal);
  return parseFloat((salarioTotal/2).toFixed(2));
  //return salarioTotal;
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

  // 👉 1. Crear array con potencial calculado
  const teamsConPotencial = [];

  for (const team of teams) {
    const t = await procesarEquipo(team);
    await procesarSalarios(t); // necesario porque aquí calculas potencialJugador
    const potencial = totalPotencial(t);

    teamsConPotencial.push({
      ...team,
      potencial
    });
  }

  // 👉 2. Ordenar de mayor a menor
  teamsConPotencial.sort((a, b) => b.potencial - a.potencial);

  // 👉 3. Pintar tabla
  let html = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th>LOGO</th>
          <th>ID</th>
          <th>Equipo</th>
          <th>Potencial</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const team of teamsConPotencial) {
    html += `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">
          <img src="../images/flags/headerRund/${team.id}.png" width="30" height="30"/>
        </td>
        <td style="border: 1px solid #ddd; padding: 8px;">${team.id}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">
          <a href="../ver_equipo.html?id=${team.id}" target="_blank">
            ${team.team}
          </a>
        </td>
        <td style="border: 1px solid #ddd; padding: 8px;">${team.potencial}</td>
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
