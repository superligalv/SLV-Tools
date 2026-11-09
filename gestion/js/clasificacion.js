const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTEyNDQsImV4cCI6MjEwNjI4NzI0NH0.V4jfI7wDvKN-yePelVeAeA-3pEByfwS99o3s7k-vSWs";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allStandingsData = [];
let currentSortColumn = 'position';
let currentSortAsc = true;

document.addEventListener("DOMContentLoaded", async () => {
    await cargarClasificacion();

    // Buscador en tiempo real
    const searchInput = document.getElementById("searchTeamInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => filtrarYRenderizar(e.target.value));
    }

    // Eventos para ordenar al hacer clic en las cabeceras
    document.querySelectorAll("th.sortable").forEach(th => {
        th.addEventListener("click", () => {
            const column = th.getAttribute("data-sort");
            if (currentSortColumn === column) {
                currentSortAsc = !currentSortAsc;
            } else {
                currentSortColumn = column;
                currentSortAsc = (column === 'position' || column === 'team_name');
            }
            filtrarYRenderizar(document.getElementById("searchTeamInput")?.value || "");
        });
    });
});

async function cargarClasificacion() {
    const tbody = document.getElementById("standingsTableBody");
    const titleEl = document.getElementById("competitionTitle");

    try {
        // 1. Obtener ID de competición de los parámetros URL
        const urlParams = new URLSearchParams(window.location.search);
        let competitionId = urlParams.get('competition_id') || urlParams.get('id') || urlParams.get('league_id');

        // Si no viene ID por URL, se consulta la primera liga activa disponible
        if (!competitionId) {
            const { data: compData, error: compError } = await supabaseClient
                .from("competitions")
                .select("id, name")
                .eq("type", "league")
                .limit(1)
                .single();

            if (compError || !compData) {
                console.error("No se encontró competición por defecto:", compError);
                tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">❌ No se ha indicado una competición válida.</td></tr>`;
                return;
            }
            competitionId = compData.id;
            if (titleEl) titleEl.textContent = `🏆 ${compData.name}`;
        } else {
            // Cargar el nombre de la competición solicitada
            const { data: compData } = await supabaseClient
                .from("competitions")
                .select("name")
                .eq("id", competitionId)
                .single();
            if (compData && titleEl) titleEl.textContent = `🏆 ${compData.name}`;
        }

        // 2. Obtener la última temporada (is_current = true o la más reciente creada)
        let { data: seasonData } = await supabaseClient
            .from("seasons")
            .select("id, name")
            .eq("is_current", true)
            .limit(1)
            .maybeSingle();

        if (!seasonData) {
            const { data: latestSeason } = await supabaseClient
                .from("seasons")
                .select("id, name")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();
            seasonData = latestSeason;
        }

        if (!seasonData) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">❌ No hay temporadas registradas en la BBDD.</td></tr>`;
            return;
        }

        // 3. Consultar la vista v_league_standings
        const { data: standings, error: standingsError } = await supabaseClient
            .from("v_league_standings")
            .select("*")
            .eq("competition_id", competitionId)
            .eq("season_id", seasonData.id)
            .order("position", { ascending: true });

        if (standingsError) {
            console.error("Error consultando la vista v_league_standings:", standingsError);
            tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">❌ Error al cargar la clasificación.</td></tr>`;
            return;
        }

        allStandingsData = standings || [];
        filtrarYRenderizar("");

    } catch (err) {
        console.error("Excepción en cargarClasificacion:", err);
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">❌ Error inesperado al procesar los datos.</td></tr>`;
    }
}

function filtrarYRenderizar(query) {
    const q = query.toLowerCase().trim();

    // 1. Filtrar
    let listaFiltrada = allStandingsData.filter(t =>
        (t.team_name && t.team_name.toLowerCase().includes(q)) ||
        (t.short_name && t.short_name.toLowerCase().includes(q))
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
    const tbody = document.getElementById("standingsTableBody");
    if (!lista || lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">No se encontraron equipos en la clasificación.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map((row) => `
        <tr onclick="window.location.href='team.html?team=${row.short_name || ''}'" class="clickable-row">
            <td class="text-center font-bold">${row.position}</td>
            <td>
                <div class="table-team-cell">
                    ${row.logo_url 
                        ? `<img src="${row.logo_url}" alt="${row.team_name}" class="team-logo">`
                        : `<span class="table-badge">${(row.short_name || 'SLV').substring(0, 3).toUpperCase()}</span>`
                    }
                    <strong>${row.team_name}</strong>
                </div>
            </td>
            <td class="text-center font-bold text-primary">${row.pts}</td>
            <td class="text-center">${row.pj}</td>
            <td class="text-center">${row.pg}</td>
            <td class="text-center">${row.pe}</td>
            <td class="text-center">${row.pp}</td>
            <td class="text-center">${row.gf}</td>
            <td class="text-center">${row.gc}</td>
            <td class="text-center ${row.dg > 0 ? 'text-green' : row.dg < 0 ? 'text-red' : ''}">${row.dg > 0 ? '+' + row.dg : row.dg}</td>
        </tr>
    `).join("");
}
