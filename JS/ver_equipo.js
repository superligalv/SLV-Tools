import { getQueryParam, crearTabla, esSub21, esMayor30,
         porteros, defensas, delanteros, mediocampistas, posicion, parsearTablaSalarios,
  calcularSalarioJugador,
  calcularSalarioTotal } from './utils.js';

const teamId = getQueryParam('id');

const teamNameEl = document.getElementById('teamName');
const teamContentEl = document.getElementById('teamContent');
const statsEl = document.getElementById('teamStats');

async function procesarSalarios(jugadores) {
  const cfg = await fetch('./JS/salary.cfg').then(r => r.text());
  const tablaSalarios = parsearTablaSalarios(cfg);

  jugadores.forEach(j => {
    j.salario = parseFloat(calcularSalarioJugador(j, tablaSalarios));
  });

  crearTabla(jugadores, headers, teamContentEl);

  const salarioTotal = calcularSalarioTotal(jugadores);

  console.log(jugadores.map(j => j.salario));
  console.log("Total:", salarioTotal);

  const totalEl = document.getElementById("salario-total");
  if (totalEl) {
    totalEl.textContent = salarioTotal.toFixed(2) + " M";
  }
}


if (!teamId) {
  teamNameEl.textContent = "Equipo no especificado";
  teamContentEl.innerHTML = "";
  statsEl.innerHTML = "";
} else {

  fetch('./JS/teams.json')
    .then(res => res.ok ? res.json() : Promise.reject('Error cargando teams.json'))
    .then(equipos => {
      const team = equipos.find(e => e.id === teamId.toLowerCase());
      if (!team) throw 'Equipo no encontrado';
      teamNameEl.textContent = team.team;

      return fetch(team.dropbox_dir);
    })
    .then(resp => resp.ok ? resp.text() : Promise.reject('Error cargando TXT'))
    .then(txt => {
      const lines = txt.trim().split('\n');
      const sep = lines.findIndex(l=>l.includes('---'));
      const headersLine = sep>=0 ? lines[0] : lines[0];
      const dataLines = sep>=0 ? lines.slice(sep+1) : lines.slice(1);
      const headers = headersLine.trim().split(/\s+/);

      const jugadores = dataLines.filter(l=>l.trim()!=='').map(line=>{
        const values = line.trim().split(/\s+/);
        const j = {};
        headers.forEach((h,i)=>j[h]=values[i]||'');
        return j;
      });
	  procesarSalarios(jugadores);
      // Tabla plantilla
      crearTabla(jugadores, headers, teamContentEl);
	  // Calcular salario total
	  const salarioTotal = calcularSalarioTotal(jugadores);
      // Estadísticas
      const sub21 = jugadores.filter(j=>esSub21(j)).length;
      const mayor30 = jugadores.filter(j=>esMayor30(j)).length;
	  const cuentaJugadores = jugadores.length;
      const port = porteros(jugadores);
      const df = defensas(jugadores);
      const fw = delanteros(jugadores);
      const mfs = mediocampistas(jugadores);

      statsEl.innerHTML = `
        <h3 style="text-align:center;margin-bottom:1rem;">Estadísticas</h3>
        <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:1rem;">
          <div style="background:#e67e22;color:white;padding:1rem;border-radius:10px;min-width:150px;text-align:center;">
            <strong>Sub21</strong><br>${sub21}
          </div>
          <div style="background:#e67e22;color:white;padding:1rem;border-radius:10px;min-width:150px;text-align:center;">
            <strong>>=30</strong><br>${mayor30}
          </div>
		  <div style="background:#e67e22;color:white;padding:1rem;border-radius:10px;min-width:150px;text-align:center;">
            <strong>Total jugadores</strong><br>${cuentaJugadores}
          </div>
		  <div style="background:#e67e22;color:white;padding:1rem;border-radius:10px;min-width:150px;text-align:center;">
            <strong>Salarios</strong><br>${salarioTotal.toFixed(2)} M
          </div>
          <div style="background:#2ecc71;color:white;padding:1rem;border-radius:10px;min-width:150px;text-align:center;">
            <strong>Porteros</strong><br>${port.count} (St: ${port.media})
          </div>
          <div style="background:#1abc9c;color:white;padding:1rem;border-radius:10px;min-width:150px;text-align:center;">
            <strong>Defensas</strong><br>${df.count} (Tk: ${df.media})
          </div>
          <div style="background:#9b59b6;color:white;padding:1rem;border-radius:10px;min-width:150px;text-align:center;">
            <strong>Delanteros</strong><br>${fw.count} (Sh: ${fw.media})
          </div>
          <div style="background:#34495e;color:white;padding:1rem;border-radius:10px;min-width:150px;text-align:center;">
            <strong>MF</strong><br>${mfs.MF.count} (Ps: ${mfs.MF.media})
          </div>
          <div style="background:#16a085;color:white;padding:1rem;border-radius:10px;min-width:150px;text-align:center;">
            <strong>DM</strong><br>${mfs.DM.count} (Ps: ${mfs.DM.media})
          </div>
          <div style="background:#c0392b;color:white;padding:1rem;border-radius:10px;min-width:150px;text-align:center;">
            <strong>AM</strong><br>${mfs.AM.count} (Ps: ${mfs.AM.media})
          </div>
        </div>
      `;
    })
    .catch(err => {
      teamContentEl.innerHTML = `<p class="error">Error: ${err}</p>`;
      statsEl.innerHTML = '';
      console.error(err);
    });
}
