import { getQueryParam, crearTabla, esSub21, esMayor30,
         porteros, defensas, delanteros, mediocampistas,mediapuntas, pivotes, posicion, parsearTablaSalarios,
		 avgporteros,avgdefensas,avgdelanteros,avgmediocampistas,avgmediapuntas, avgpivotes, totalPotencial,avgage,
  calcularSalarioJugador, potencialJugador,extremosPorteros,
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
          <th class="gk">AVG</th>
          <th class="gk">MIN</th>
          <th class="gk">MAX</th>
          <th class="df">DFS</th>
          <th class="df">AVG</th>
          <th class="df">MIN</th>
          <th class="df">MAX</th>
          <th class="dm">DMS</th>
          <th class="dm">AVG</th>
          <th class="dm">MIN</th>
          <th class="dm">MAX</th>
          <th class="mf">MFS</th>
          <th class="mf">AVG</th>
          <th class="mf">MIN</th>
          <th class="mf">MAX</th>
          <th class="am">AMS</th>
          <th class="am">AVG</th>
          <th class="am">MIN</th>
          <th class="am">MAX</th>
          <th class="fw">FWS</th>
          <th class="fw">AVG</th>
          <th class="fw">MIN</th>
          <th class="fw">MAX</th>
        </tr>
      </thead>
      <tbody>
  `;
  for (const team of teams) {
	const t = await procesarEquipo(team);
	const salarioTotal = await procesarSalarios(t);

	const cuentaJugadores = t.length;
	const port = porteros(t);
	const df = defensas(t);
	const fw = delanteros(t);
	const mfs = mediocampistas(t);
	const ams = mediapuntas(t);
	const dms = pivotes(t);
	const potencial = totalPotencial(t);
	const avgport = avgporteros(t);
	const avgdf = avgdefensas(t);
	const avgfw = avgdelanteros(t);
	const avgmfs = avgmediocampistas(t);
	const avgams = avgmediapuntas(t);
	const avgdms = avgpivotes(t);
	const averageage= avgage(t);
    const extremosGK = extremosPorteros(t);
	
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
		<td style="border: 1px solid #ddd; padding: 8px;">${salarioTotal}</td>
		<td style="border: 1px solid #ddd; padding: 8px;">${potencial}</td>
		<td style="border: 1px solid #ddd; padding: 8px;">${cuentaJugadores}</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="gk">${port.count}</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="gk">${avgport}</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="gk">${extremosGK.peor.St}</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="gk">${extremosGK.mejor.St}</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="df">${df.count}</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="df">${avgdf}</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="df">-</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="df">-</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="dm">${dms.count}</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="dm">${avgdms}</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="dm">-</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="dm">-</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="mf">${mfs.count}</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="mf">${avgmfs}</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="mf">-</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="mf">-</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="am">${ams.count}</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="am">${avgams}</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="am">-</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="am">-</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="fw">${fw.count}</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="fw">${avgfw}</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="fw">-</td>
		<td style="border: 1px solid #ddd; padding: 8px;" class="fw">-</td>
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
