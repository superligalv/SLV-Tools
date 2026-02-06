import { getQueryParam, crearTabla, esSub21, esMayor30,
         porteros, defensas, delanteros, mediocampistas,mediapuntas, pivotes, posicion, parsearTablaSalarios,
		 avgporteros,avgdefensas,avgdelanteros,avgmediocampistas,avgmediapuntas, avgpivotes, totalPotencial,avgage,
  calcularSalarioJugador, potencialJugador,
  calcularSalarioTotal } from '../JS/utils.js';


const container = document.getElementById("teamsContainer");

// Función para cargar y procesar un equipo - Devuelve SOLO el array de jugadores
function procesarEquipo(team) {
  try {
    console.log(`Procesando: ${team.team}`);
    
    // Cargar el archivo de jugadores del equipo
    const response = await fetch(team.dropbox_dir);
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
    
    const txt = await response.text();
    const lines = txt.trim().split('\n');
    const sep = lines.findIndex(l => l.includes('---'));
    const headersLine = sep >= 0 ? lines[0] : lines[0];
    const dataLines = sep >= 0 ? lines.slice(sep + 1) : lines.slice(1);
    const headers = headersLine.trim().split(/\s+/);

    // Crear y devolver array de jugadores para ESTE equipo
    const jugadores = dataLines
      .filter(l => l.trim() !== '')
      .map(line => {
        const values = line.trim().split(/\s+/);
        const jugador = {};
        headers.forEach((h, i) => jugador[h] = values[i] || '');
        return jugador;
      });

    console.log(`${team.team}: ${jugadores.length} jugadores cargados`);
    
    // Devolver SOLO el array de jugadores
    return jugadores;
    
  } catch (error) {
    console.error(`Error procesando ${team.team}:`, error);
    // Devolver array vacío en caso de error
    return [];
  }
}

// Usa la ruta correcta según tu estructura
fetch("../JS/teams.json")
  .then(res => {
    console.log("Response status:", res.status);
    console.log("Response headers:", res.headers.get("content-type"));
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - No se pudo cargar teams.json`);
    }
    
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn("Advertencia: La respuesta no es JSON. Tipo recibido:", contentType);
      // Intenta parsear de todas formas
    }
    
    return res.text(); // Primero obtenemos como texto
  })
  .then(text => {
    console.log("Respuesta recibida (primeros 500 chars):", text.substring(0, 500));
    
    try {
      const teams = JSON.parse(text);
      renderTeams(teams);
    } catch (e) {
      console.error("Error parseando JSON:", e);
      container.innerHTML = `
        <div style="color: red; padding: 20px; border: 1px solid red;">
          <h3>Error en el formato JSON</h3>
          <p>${e.message}</p>
          <pre>${text.substring(0, 200)}...</pre>
        </div>
      `;
    }
  })
  .catch(err => {
    console.error("Error completo:", err);
    container.innerHTML = `
      <div style="color: red; padding: 20px; border: 1px solid red;">
        <h3>Error cargando equipos</h3>
        <p>${err.message}</p>
        <p>Verifica la consola para más detalles.</p>
      </div>
    `;
  });

function renderTeams(teams) {
  if (!teams || !teams.length) {
    container.innerHTML = "<p>No hay equipos disponibles.</p>";
    return;
  }

  let html = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f2f2f2;">
		  <th style="border: 1px solid #ddd; padding: 8px;">LOGO</th>
          <th style="border: 1px solid #ddd; padding: 8px;">ID</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Equipo</th>
		  <th style="border: 1px solid #ddd; padding: 8px;">Jugadores</th>
		  <th style="border: 1px solid #ddd; padding: 8px;">Salarios</th>
		  <th style="border: 1px solid #ddd; padding: 8px;">Potencial</th>
        </tr>
      </thead>
      <tbody>
  `;

  teams.forEach(team => {
	const t = procesarEquipo(team)
	const cuentaJugadores = t.length;  // ¡CORRECTO!
	console.log(`Tiene ${cuentaJugadores} `);
	//const sub21 = jugadores.filter(j=>esSub21(j)).length;
	//const mayor30 = jugadores.filter(j=>esMayor30(j)).length;
	//const cuentaJugadores = t.jugadores.length;
	//const port = porteros(jugadores);
	//const df = defensas(jugadores);
	//const fw = delanteros(jugadores);
	//const mfs = mediocampistas(jugadores);
	//const ams = mediapuntas(jugadores);
	//const dms = pivotes(jugadores);
	//const avgport = avgporteros(jugadores);
	//const avgdf = avgdefensas(jugadores);
	//const avgfw = avgdelanteros(jugadores);
	//const avgmfs = avgmediocampistas(jugadores);
	//const avgams = avgmediapuntas(jugadores);
	//const avgdms = avgpivotes(jugadores);
	//const averageage= avgage(jugadores);
    html += `
      <tr>
	    <td style="border: 1px solid #ddd; padding: 8px;"><img src="../images/flags/headerRund/${team.id}.png" alt="${team.id}" width="50" height="50"/></td>
        <td style="border: 1px solid #ddd; padding: 8px;">${team.id}</td>
        <td style="border: 1px solid #ddd; padding: 8px;"><a href="../ver_equipo.html?id=${team.id}" target="_blank" style="color: blue; text-decoration: none;">${team.team}</a></td>
        <td style="border: 1px solid #ddd; padding: 8px;">-</td>
		<td style="border: 1px solid #ddd; padding: 8px;">-</td>
		<td style="border: 1px solid #ddd; padding: 8px;">-</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
    <p style="margin-top: 20px;">Total equipos: ${teams.length}</p>
  `;

  container.innerHTML = html;
}