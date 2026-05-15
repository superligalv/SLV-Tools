const TEAMS_URL = "https://superligalv.github.io/SLV-Tools/JS/teams.json";

let allPlayers = [];
let filteredPlayers = [];

const filters = {
  name: "",
  team: "all",
  nat: "all",
  position: "all",
  ageMin: 16, ageMax: 40,
  stMin: 0, stMax: 20,
  tkMin: 0, tkMax: 20,
  psMin: 0, psMax: 20,
  shMin: 0, shMax: 20
};

// ---------------- PARSER ----------------
function parseTeam(txt, teamName) {
  const lines = txt.split("\n").slice(2);
  return lines
    .filter(l => l.trim())
    .map(l => {
      const p = l.trim().split(/\s+/);
      return {
        name: p[0],
        age: +p[1],
        nat: p[2],
        st: +p[3],
        tk: +p[4],
        ps: +p[5],
        sh: +p[6],
        ag: +p[7],
        kab: +p[8],
        tab: +p[9],
        pab: +p[10],
        sab: +p[11],
        team: teamName
      };
    });
}

// ---------------- LOAD ----------------
async function loadData() {
  try {
    const teams = await fetch(TEAMS_URL).then(r => r.json());

    for (let i = 0; i < teams.length; i++) {
      const t = teams[i];
      const txt = await fetch(t.dropbox_dir).then(r => r.text());
      allPlayers.push(...parseTeam(txt, t.team));
    }

    document.getElementById('loading').style.display = 'none';
    document.getElementById('controls').style.display = 'block';

    buildFilters();
    updateAll();

  } catch (error) {
    document.getElementById('loading').innerHTML = '❌ Error al cargar datos';
    console.error('Error:', error);
  }
}

// ---------------- FILTER CORE ----------------
function filterPlayers() {
  return allPlayers.filter(p => {
    if (filters.name && !p.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.team !== "all" && p.team !== filters.team) return false;
    if (filters.nat !== "all" && p.nat !== filters.nat) return false;

    if (p.age < filters.ageMin || p.age > filters.ageMax) return false;
    if (p.st < filters.stMin || p.st > filters.stMax) return false;
    if (p.tk < filters.tkMin || p.tk > filters.tkMax) return false;
    if (p.ps < filters.psMin || p.ps > filters.psMax) return false;
    if (p.sh < filters.shMin || p.sh > filters.shMax) return false;

    if (filters.position !== "all" && !matchPosition(p, filters.position)) return false;

    return true;
  });
}

// ---------------- POSITIONS - CORREGIDO ----------------
function matchPosition(p, pos) {
  console.log('Checking position:', pos, 'Player:', p); // DEBUG
  switch(pos) {
    case "GK": return p.st <= 3;  // Porteros tienen ST bajo
    case "DF": return p.tk >= 12; // Defensas buenos en tackle
    case "MF": return p.ps >= 12; // Medios buenos en pase
    case "FW": return p.sh >= 12; // Delanteros buenos en tiro
    default: return true;
  }
}

// ---------------- BUILD FILTERS ----------------
function buildFilters() {
  const teamSel = document.getElementById("teamFilter");
  const natSel = document.getElementById("natFilter");

  const teams = [...new Set(allPlayers.map(p => p.team))].sort();
  const nats = [...new Set(allPlayers.map(p => p.nat))].sort();

  teamSel.innerHTML = `<option value="all">Todos (${teams.length})</option>` + teams.map(t => `<option value="${t}">${t}</option>`).join("");
  natSel.innerHTML = `<option value="all">Todos (${nats.length})</option>` + nats.map(n => `<option value="${n}">${n}</option>`).join("");

  // Event listeners
  teamSel.onchange = e => { filters.team = e.target.value; updateAll(); };
  natSel.onchange = e => { filters.nat = e.target.value; updateAll(); };
  document.getElementById("nameSearch").oninput = e => { filters.name = e.target.value; updateAll(); };

  // TODOS los sliders
  setupDualSlider('age', 16, 40);
  setupDualSlider('st', 0, 20);
  setupDualSlider('tk', 0, 20);
  setupDualSlider('ps', 0, 20);
  setupDualSlider('sh', 0, 20);

  // Position buttons - FIJADO
  document.querySelectorAll('.pos-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('Button clicked:', btn.dataset.pos); // DEBUG
      setPosition(btn.dataset.pos);
    });
  });

  updatePositionButtons();
}

function setupDualSlider(stat, minVal, maxVal) {
  const minId = `${stat}Min`;
  const maxId = `${stat}Max`;
  const minSlider = document.getElementById(minId);
  const maxSlider = document.getElementById(maxId);
  const minValSpan = document.getElementById(minId + 'Val');
  const maxValSpan = document.getElementById(maxId + 'Val');

  minSlider.min = maxSlider.min = minVal;
  minSlider.max = maxSlider.max = maxVal;
  minSlider.value = minVal;
  maxSlider.value = maxVal;

  const update = () => {
    filters[`${stat}Min`] = +minSlider.value;
    filters[`${stat}Max`] = +maxSlider.value;
    minValSpan.textContent = minSlider.value;
    maxValSpan.textContent = maxSlider.value;
    updateAll();
  };

  minSlider.oninput = maxSlider.oninput = update;
}

// ---------------- POSITION BUTTONS - CORREGIDO ----------------
function setPosition(pos) {
  console.log('Setting position to:', pos); // DEBUG
  filters.position = pos;
  updatePositionButtons();
  updateAll();
}

function updatePositionButtons() {
  document.querySelectorAll('.pos-btn').forEach(btn => {
    if (btn.dataset.pos === filters.position) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function resetFilters() {
  Object.assign(filters, {
    name: "", team: "all", nat: "all", position: "all",
    ageMin: 16, ageMax: 40, stMin: 0, stMax: 20,
    tkMin: 0, tkMax: 20, psMin: 0, psMax: 20, shMin: 0, shMax: 20
  });

  // Reset UI
  document.getElementById("nameSearch").value = "";
  document.getElementById("teamFilter").value = "all";
  document.getElementById("natFilter").value = "all";

  // Reset sliders
  ['age', 'st', 'tk', 'ps', 'sh'].forEach(stat => {
    document.getElementById(`${stat}Min`).value = filters[`${stat}Min`];
    document.getElementById(`${stat}Max`).value = filters[`${stat}Max`];
    document.getElementById(`${stat}MinVal`).textContent = filters[`${stat}Min`];
    document.getElementById(`${stat}MaxVal`).textContent = filters[`${stat}Max`];
  });

  updatePositionButtons();
  updateAll();
}

function updateAll() {
  filteredPlayers = filterPlayers();
  render(filteredPlayers);
  updateStats(filteredPlayers);
}

// ---------------- STATS & RENDER ----------------
function updateStats(players) {
  document.getElementById('statsRow').style.display = players.length > 0 ? 'flex' : 'none';
  if (players.length > 0) {
    document.getElementById('totalPlayers').textContent = players.length.toLocaleString();
    const avgAge = Math.round(players.reduce((a, p) => a + p.age, 0) / players.length);
    document.getElementById('avgAge').textContent = avgAge;
    const top = Math.max(...players.map(p => Math.max(p.st, p.tk, p.ps, p.sh)));
    document.getElementById('topStat').textContent = top;
  }
}

function render(players) {
  const tbody = document.getElementById("results");
  const table = document.getElementById('tableContainer');

  if (players.length === 0) {
    tbody.innerHTML = '<tr><td colspan="13" class="no-results"><div style="font-size:3rem;">🔍</div><div style="font-size:1.2rem;margin:15px 0;">Sin resultados</div><div>Ajusta los filtros</div></td></tr>';
    table.style.display = 'block';
    return;
  }

  table.style.display = 'block';
  tbody.innerHTML = players.slice(0, 500).map(p => `
    <tr>
      <td class="name-cell" style="font-weight:600;">${p.name}</td>
      <td>${p.team}</td>
      <td>${p.age}</td>
      <td>${p.nat}</td>
      <td style="color:${p.st>=15?'#10b981':''}">${p.st}</td>
      <td style="color:${p.tk>=15?'#10b981':''}">${p.tk}</td>
      <td style="color:${p.ps>=15?'#10b981':''}">${p.ps}</td>
      <td style="color:${p.sh>=15?'#10b981':''}">${p.sh}</td>
      <td>${p.ag}</td>
      <td>${p.kab}</td>
      <td>${p.tab}</td>
      <td>${p.pab}</td>
      <td>${p.sab}</td>
    </tr>
  `).join("");
}

// ---------------- EXPORT ----------------
function exportResults() {
  if (filteredPlayers.length === 0) return alert('Sin jugadores para exportar');

  const csv = [
    ['Nombre','Equipo','Edad','NAT','ST','TK','PS','SH','AG','KAb','TAb','PAb','SAb'],
    ...filteredPlayers.map(p => [p.name,p.team,p.age,p.nat,p.st,p.tk,p.ps,p.sh,p.ag,p.kab,p.tab,p.pab,p.sab])
  ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scouting_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------- INIT ----------------
loadData();
