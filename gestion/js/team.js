/* =========================================================
   TEAM PROFILE JAVASCRIPT (Estilo BeSoccer - Directo a Supabase)
   ========================================================= */

const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTEyNDQsImV4cCI6MjEwNjI4NzI0NH0.V4jfI7wDvKN-yePelVeAeA-3pEByfwS99o3s7k-vSWs";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentRosterData = [];
let currentView = "table"; // 'table' o 'plain'

document.addEventListener("DOMContentLoaded", async () => {
    await cargarListaEquiposDesdeSupabase();

    const urlParams = new URLSearchParams(window.location.search);
    const teamParam = urlParams.get("team");
    const teamSelect = document.getElementById("teamSelect");

    if (teamParam) {
        teamSelect.value = teamParam;
        await cargarDatosEquipo(teamParam);
    } else if (teamSelect.value) {
        await cargarDatosEquipo(teamSelect.value);
    }

    teamSelect.addEventListener("change", async (e) => {
        const selectedValue = e.target.value;
        if (selectedValue) {
            const newUrl = `${window.location.pathname}?team=${selectedValue}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
            await cargarDatosEquipo(selectedValue);
        }
    });

    document.getElementById("searchPlayer").addEventListener("input", (e) => {
        filtrarJugadores(e.target.value);
    });
});

async function cargarListaEquiposDesdeSupabase() {
    try {
        const { data: equipos, error } = await supabaseClient
            .from("teams")
            .select("id, name, short_name")
            .order("name", { ascending: true });

        if (error) {
            console.error("Error al cargar equipos de Supabase:", error);
            return;
        }

        const select = document.getElementById("teamSelect");
        select.innerHTML = '<option value="">-- Selecciona un equipo --</option>';

        equipos.forEach(eq => {
            const opt = document.createElement("option");
            opt.value = eq.short_name;
            opt.textContent = eq.name;
            select.appendChild(opt);
        });

    } catch (err) {
        console.error("Excepción al cargar equipos:", err);
    }
}

async function cargarDatosEquipo(equipoIdentificador) {
    try {
        let query = supabaseClient.from("teams").select("*");
        const esUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(equipoIdentificador);

        if (esUuid) {
            query = query.eq("id", equipoIdentificador);
        } else {
            query = query.eq("short_name", equipoIdentificador);
        }

        const { data: teamData, error: teamErr } = await query.single();

        if (teamErr || !teamData) {
            console.error("Equipo no encontrado en Supabase:", teamErr);
            document.getElementById("teamTitle").textContent = "Equipo no encontrado";
            document.getElementById("rosterTableBody").innerHTML = `<tr><td colspan="12" class="text-center text-muted">No se pudo cargar la información del equipo.</td></tr>`;
            document.getElementById("plainTextOutput").textContent = "No hay datos disponibles.";
            return;
        }

        document.getElementById("teamTitle").textContent = teamData.name;
        document.getElementById("badgeText").textContent = (teamData.short_name || "SLV").toUpperCase();
        document.getElementById("teamDivision").textContent = `DIVISIÓN ${teamData.division || 1}`;

        const { data: roster, error: rosterErr } = await supabaseClient
            .from("player_season_stats")
            .select(`
                *,
                players (
                    id,
                    name,
                    nationality
                )
            `)
            .eq("team_id", teamData.id);

        if (rosterErr) {
            console.error("Error al cargar la plantilla:", rosterErr);
            return;
        }

        // Ordenar la plantilla por la jerarquía ESMS (GK > DF > MF > FW)
        currentRosterData = ordenarRosterESMS(roster || []);
        
        renderizarVista();
        actualizarResumenEstadisticas(currentRosterData);

    } catch (err) {
        console.error("Error general en cargarDatosEquipo:", err);
    }
}

/* =========================================================
   LÓGICA DE ORDENACIÓN ESMS (GK > DF > MF > FW)
   ========================================================= */
function determinarPosicion(item) {
    const st = item.st || 1;
    const tk = item.tk || 1;
    const ps = item.ps || 1;
    const sh = item.sh || 1;

    // Si St es el valor dominante absoluto, es Portero
    if (st > tk && st > ps && st > sh) return 'GK';

    // Para jugadores de campo, determinar por la stat más alta
    const maxVal = Math.max(tk, ps, sh);
    if (maxVal === tk) return 'DF';
    if (maxVal === ps) return 'MF';
    return 'FW';
}

function ordenarRosterESMS(lista) {
    const ordenPos = { 'GK': 1, 'DF': 2, 'MF': 3, 'FW': 4 };

    return [...lista].sort((a, b) => {
        const posA = determinarPosicion(a);
        const posB = determinarPosicion(b);

        if (ordenPos[posA] !== ordenPos[posB]) {
            return ordenPos[posA] - ordenPos[posB];
        }

        // Si son de la misma posición, ordenar por el atributo clave descendente
        if (posA === 'GK') return (b.st || 0) - (a.st || 0);
        if (posA === 'DF') return (b.tk || 0) - (a.tk || 0);
        if (posA === 'MF') return (b.ps || 0) - (a.ps || 0);
        if (posA === 'FW') return (b.sh || 0) - (a.sh || 0);

        return 0;
    });
}

/* =========================================================
   RENDERIZADO DE VISTAS (TABLA Y TEXTO PLANO)
   ========================================================= */
function renderizarVista() {
    if (currentView === "table") {
        renderizarTablaRoster(currentRosterData);
    } else {
        renderizarTextoPlano(currentRosterData);
    }
}

function cambiarVista(vista) {
    currentView = vista;
    const btnTable = document.getElementById("btnViewTable");
    const btnPlain = document.getElementById("btnViewPlain");
    const viewTable = document.getElementById("viewTableContainer");
    const viewPlain = document.getElementById("viewPlainContainer");
    const searchWrap = document.getElementById("searchWrap");
    const copyWrap = document.getElementById("copyWrap");

    if (vista === 'table') {
        btnTable.style.background = "#ffffff";
        btnTable.style.color = "#0f172a";
        btnPlain.style.background = "transparent";
        btnPlain.style.color = "#64748b";

        viewTable.style.display = "block";
        viewPlain.style.display = "none";
        searchWrap.style.display = "block";
        copyWrap.style.display = "none";
    } else {
        btnPlain.style.background = "#ffffff";
        btnPlain.style.color = "#0f172a";
        btnTable.style.background = "transparent";
        btnTable.style.color = "#64748b";

        viewTable.style.display = "none";
        viewPlain.style.display = "block";
        searchWrap.style.display = "none";
        copyWrap.style.display = "block";
    }

    renderizarVista();
}

function renderizarTablaRoster(lista) {
    const tbody = document.getElementById("rosterTableBody");

    if (!lista || lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="text-center text-muted">No hay jugadores registrados en esta plantilla.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(item => {
        const p = item.players || {};
        const fitClass = item.inj > 0 ? "fit-injured" : "fit-ok";
        const fitStatus = item.inj > 0 ? `Lesionado (${item.inj} sem)` : "Disponible";

        return `
            <tr>
                <td class="player-name-cell">
                    <a href="player.html?id=${p.id}" class="player-link">${p.name || 'Desconocido'}</a>
                </td>
                <td>${item.age || '-'}</td>
                <td>${p.nationality || '-'}</td>
                <td><span class="badge-attr">${item.st || 1}</span></td>
                <td><span class="badge-attr">${item.tk || 1}</span></td>
                <td><span class="badge-attr">${item.ps || 1}</span></td>
                <td><span class="badge-attr">${item.sh || 1}</span></td>
                <td><span class="badge-attr">${item.ag || 20}</span></td>
                <td>${item.gam || 0}</td>
                <td><strong>${item.gls || 0}</strong></td>
                <td>${item.ass || 0}</td>
                <td class="${fitClass}">${fitStatus}</td>
            </tr>
        `;
    }).join("");
}

function renderizarTextoPlano(lista) {
    const output = document.getElementById("plainTextOutput");

    if (!lista || lista.length === 0) {
        output.textContent = "No hay jugadores en esta plantilla.";
        return;
    }

    const pad = (val, len, alignRight = true) => {
        const str = String(val ?? "");
        if (alignRight) {
            return str.padStart(len, " ");
        }
        return str.padEnd(len, " ");
    };

    const header = "Name         Age Nat St Tk Ps Sh Ag KAb TAb PAb SAb Gam Sub  Min Mom Sav Con Ktk Kps Sht Gls Ass  DP Inj Sus Fit\n" +
                   "----------------------------------------------------------------------------------------------------------------";

    const rows = lista.map(item => {
        const p = item.players || {};
        const name = pad((p.name || "Desconocido").replace(/\s+/g, '_'), 12, false);
        const age  = pad(item.age  ?? 0, 4);
        const nat  = pad((p.nationality || "---").substring(0, 3).toLowerCase(), 4);
        const st   = pad(item.st   ?? 1, 3);
        const tk   = pad(item.tk   ?? 1, 3);
        const ps   = pad(item.ps   ?? 1, 3);
        const sh   = pad(item.sh   ?? 1, 3);
        const ag   = pad(item.ag   ?? 20, 3);
        const kab  = pad(item.kab  ?? 300, 4);
        const tab  = pad(item.tab  ?? 300, 4);
        const pab  = pad(item.pab  ?? 300, 4);
        const sab  = pad(item.sab  ?? 300, 4);
        const gam  = pad(item.gam  ?? 0, 4);
        const sub  = pad(item.sub  ?? 0, 4);
        const min  = pad(item.min  ?? 0, 5);
        const mom  = pad(item.mom  ?? 0, 4);
        const sav  = pad(item.sav  ?? 0, 4);
        const con  = pad(item.con  ?? 0, 4);
        const ktk  = pad(item.ktk  ?? 0, 4);
        const kps  = pad(item.kps  ?? 0, 4);
        const sht  = pad(item.sht  ?? 0, 4);
        const gls  = pad(item.gls  ?? 0, 4);
        const ass  = pad(item.ass  ?? 0, 4);
        const dp   = pad(item.dp   ?? 0, 4);
        const inj  = pad(item.inj  ?? 0, 4);
        const sus  = pad(item.sus  ?? 0, 4);
        const fit  = pad(item.fit  ?? 100, 4);

        return `${name} ${age} ${nat} ${st} ${tk} ${ps} ${sh} ${ag} ${kab} ${tab} ${pab} ${sab} ${gam} ${sub} ${min} ${mom} ${sav} ${con} ${ktk} ${kps} ${sht} ${gls} ${ass} ${dp} ${inj} ${sus} ${fit}`;
    });

    output.textContent = [header, ...rows].join("\n");
}

function copiarTextoPlano() {
    const texto = document.getElementById("plainTextOutput").textContent;
    navigator.clipboard.writeText(texto).then(() => {
        alert("¡Plantilla copiada al portapapeles!");
    }).catch(err => {
        console.error("Error al copiar al portapapeles:", err);
    });
}

function actualizarResumenEstadisticas(lista) {
    const totalJugadores = lista.length;
    document.getElementById("statPlayerCount").textContent = totalJugadores;

    if (totalJugadores === 0) {
        document.getElementById("statAvgAge").textContent = "0.0";
        document.getElementById("statTotalGls").textContent = "0";
        return;
    }

    const sumaEdades = lista.reduce((acc, curr) => acc + (curr.age || 0), 0);
    const avgAge = (sumaEdades / totalJugadores).toFixed(1);
    document.getElementById("statAvgAge").textContent = avgAge;

    const totalGoles = lista.reduce((acc, curr) => acc + (curr.gls || 0), 0);
    document.getElementById("statTotalGls").textContent = totalGoles;
}

function filtrarJugadores(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
        renderizarTablaRoster(currentRosterData);
        return;
    }

    const filtrados = currentRosterData.filter(item => {
        const nombre = (item.players?.name || "").toLowerCase();
        return nombre.includes(q);
    });

    renderizarTablaRoster(filtrados);
}
