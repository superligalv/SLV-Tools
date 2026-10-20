const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTEyNDQsImV4cCI6MjEwNjI4NzI0NH0.V4jfI7wDvKN-yePelVeAeA-3pEByfwS99o3s7k-vSWs";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentRosterData = [];

document.addEventListener("DOMContentLoaded", async () => {
    await cargarListaEquipos();

    const teamSelect = document.getElementById("teamSelect");
    teamSelect.addEventListener("change", (e) => {
        if (e.target.value) {
            cargarDatosEquipo(e.target.value);
        }
    });

    document.getElementById("searchPlayer").addEventListener("input", (e) => {
        filtrarJugadores(e.target.value);
    });
});

async function cargarListaEquipos() {
    try {
        const response = await fetch('./JS/teams.json');
        const equipos = await response.json();

        const select = document.getElementById("teamSelect");
        equipos.forEach(eq => {
            const opt = document.createElement("option");
            opt.value = eq.id || eq.abrev || eq.short_name;
            opt.textContent = eq.name || eq.team;
            select.appendChild(opt);
        });

        // Cargar el primer equipo por defecto si existe
        if (equipos.length > 0) {
            const defaultTeam = equipos[0].id || equipos[0].abrev || equipos[0].short_name;
            select.value = defaultTeam;
            await cargarDatosEquipo(defaultTeam);
        }
    } catch (err) {
        console.error("Error al cargar teams.json:", err);
    }
}

async function cargarDatosEquipo(equipoIdentificador) {
    try {
        // 1. Obtener datos del equipo en Supabase
        const { data: teamData, error: teamErr } = await supabaseClient
            .from("teams")
            .select("*")
            .or(`short_name.eq.${equipoIdentificador},id.eq.${equipoIdentificador}`)
            .single();

        if (teamErr || !teamData) {
            console.error("Equipo no encontrado:", teamErr);
            return;
        }

        // Actualizar Cabecera estilo BeSoccer
        document.getElementById("teamTitle").textContent = teamData.name;
        document.getElementById("badgeText").textContent = teamData.short_name.toUpperCase();
        document.getElementById("teamDivision").textContent = `DIVISIÓN ${teamData.division || 1}`;

        // 2. Cargar jugadores y estadísticas del equipo desde player_season_stats
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
            console.error("Error al cargar plantilla:", rosterErr);
            return;
        }

        currentRosterData = roster || [];
        renderizarTablaRoster(currentRosterData);
        actualizarResumenEstadisticas(currentRosterData);

    } catch (err) {
        console.error("Error general en cargarDatosEquipo:", err);
    }
}

function renderizarTablaRoster(lista) {
    const tbody = document.getElementById("rosterTableBody");

    if (!lista || lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="text-center text-muted">No se encontraron jugadores registrados en este equipo.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(item => {
        const p = item.players || {};
        const fitClass = item.inj > 0 ? "fit-injured" : "fit-ok";
        const fitStatus = item.inj > 0 ? `Lesionado (${item.inj} sem)` : "Disponible";

        return `
            <tr>
                <td class="player-name-cell">${p.name || 'Desconocido'}</td>
                <td>${item.age || '-'}</td>
                <td>${p.nationality || '-'}</td>
                <td><span class="badge-attr">${item.st}</span></td>
                <td><span class="badge-attr">${item.tk}</span></td>
                <td><span class="badge-attr">${item.ps}</span></td>
                <td><span class="badge-attr">${item.sh}</span></td>
                <td><span class="badge-attr">${item.ag}</span></td>
                <td>${item.gam || 0}</td>
                <td><strong>${item.gls || 0}</strong></td>
                <td>${item.ass || 0}</td>
                <td class="${fitClass}">${fitStatus}</td>
            </tr>
        `;
    }).join("");
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
