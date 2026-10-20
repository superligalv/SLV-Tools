const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDcxMTI0NCwiZXhwIjoyMTA2Mjg3MjQ0fQ.m_UNqt64oq4ffKcD8zuTi5uzyu0MdLXAAMTAQoo_Nsg";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allTeamsData = [];
let currentSortColumn = 'name';
let currentSortAsc = true;

document.addEventListener("DOMContentLoaded", async () => {
    await cargarEquiposConEstadisticas();

    // Buscador en tiempo real
    const searchInput = document.getElementById("searchTeamInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => filtrarYRenderizar(e.target.value));
    }

    // Eventos para ordenar al hacer clic en las cabeceras de la tabla
    document.querySelectorAll("th.sortable").forEach(th => {
        th.addEventListener("click", () => {
            const column = th.getAttribute("data-sort");
            if (currentSortColumn === column) {
                currentSortAsc = !currentSortAsc;
            } else {
                currentSortColumn = column;
                currentSortAsc = true;
            }
            filtrarYRenderizar(document.getElementById("searchTeamInput").value);
        });
    });
});

async function cargarEquiposConEstadisticas() {
    const tbody = document.getElementById("teamsTableBody");
    try {
        // 1. Obtener todos los equipos de la BD
        const { data: teams, error: teamsError } = await supabaseClient
            .from("teams")
            .select("id, name, short_name, division")
            .order("name", { ascending: true });

        if (teamsError || !teams) {
            console.error("Error al cargar equipos:", teamsError);
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">❌ Error al cargar equipos.</td></tr>`;
            return;
        }

        // 2. Obtener estadísticas de temporada para jugadores y edades
        const { data: stats, error: statsError } = await supabaseClient
            .from("player_season_stats")
            .select("team_id, age");

        if (statsError) {
            console.error("Error al cargar estadísticas:", statsError);
        }

        // 3. Procesar métricas por equipo
        allTeamsData = teams.map(team => {
            const playerStats = stats ? stats.filter(s => s.team_id === team.id) : [];
            const playerCount = playerStats.length;
            
            let avgAge = 0;
            if (playerCount > 0) {
                const totalAge = playerStats.reduce((acc, curr) => acc + (curr.age || 0), 0);
                avgAge = parseFloat((totalAge / playerCount).toFixed(1));
            }

            return {
                ...team,
                playerCount,
                avgAge
            };
        });

        filtrarYRenderizar("");

    } catch (err) {
        console.error("Excepción en cargarEquiposConEstadisticas:", err);
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">❌ Error inesperado.</td></tr>`;
    }
}

function filtrarYRenderizar(query) {
    const q = query.toLowerCase().trim();

    // 1. Filtrar
    let listaFiltrada = allTeamsData.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.short_name.toLowerCase().includes(q)
    );

    // 2. Ordenar
    listaFiltrada.sort((a, b) => {
        let valA = a[currentSortColumn];
        let valB = b[currentSortColumn];

        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return currentSortAsc ? -1 : 1;
        if (valA > valB) return currentSortAsc ? 1 : -1;
        return 0;
    });

    renderizarTabla(listaFiltrada);
}

function renderizarTabla(lista) {
    const tbody = document.getElementById("teamsTableBody");
    if (!lista || lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No se encontraron equipos.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(team => `
        <tr onclick="window.location.href='team.html?team=${team.short_name}'" class="clickable-row">
            <td>
                <div class="table-team-cell">
                    <span class="table-badge">${(team.short_name || 'SLV').toUpperCase()}</span>
                    <strong>${team.name}</strong>
                </div>
            </td>
            <td class="text-center">División ${team.division || 1}</td>
            <td class="text-center"><span class="badge-count">${team.playerCount}</span></td>
            <td class="text-center">${team.avgAge} años</td>
        </tr>
    `).join("");
}
