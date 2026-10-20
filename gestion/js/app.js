const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDcxMTI0NCwiZXhwIjoyMTA2Mjg3MjQ0fQ.m_UNqt64oq4ffKcD8zuTi5uzyu0MdLXAAMTAQoo_Nsg";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allTeamsData = [];

document.addEventListener("DOMContentLoaded", async () => {
    await cargarEquiposConEstadisticas();

    const searchInput = document.getElementById("searchTeamInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => filtrarEquipos(e.target.value));
    }
});

async function cargarEquiposConEstadisticas() {
    const grid = document.getElementById("teams-grid");
    try {
        // 1. Obtener todos los equipos de la base de datos
        const { data: teams, error: teamsError } = await supabaseClient
            .from("teams")
            .select("id, name, short_name, division")
            .order("name", { ascending: true });

        if (teamsError || !teams) {
            console.error("Error al cargar equipos:", teamsError);
            grid.innerHTML = `<p class="text-muted">❌ Error al cargar equipos.</p>`;
            return;
        }

        // 2. Obtener las estadísticas de la temporada para calcular número de jugadores y edad media
        const { data: stats, error: statsError } = await supabaseClient
            .from("player_season_stats")
            .select("team_id, age");

        if (statsError) {
            console.error("Error al cargar estadísticas de jugadores:", statsError);
        }

        // 3. Cruzar los datos para cada equipo
        allTeamsData = teams.map(team => {
            const playerStats = stats ? stats.filter(s => s.team_id === team.id) : [];
            const playerCount = playerStats.length;
            
            let avgAge = 0;
            if (playerCount > 0) {
                const totalAge = playerStats.reduce((acc, curr) => acc + (curr.age || 0), 0);
                avgAge = (totalAge / playerCount).toFixed(1);
            }

            return {
                ...team,
                playerCount,
                avgAge
            };
        });

        renderizarGridEquipos(allTeamsData);

    } catch (err) {
        console.error("Excepción en cargarEquiposConEstadisticas:", err);
        grid.innerHTML = `<p class="text-muted">❌ Error inesperado al cargar los datos.</p>`;
    }
}

function renderizarGridEquipos(lista) {
    const grid = document.getElementById("teams-grid");
    if (!lista || lista.length === 0) {
        grid.innerHTML = `<p class="text-muted">No se encontraron equipos.</p>`;
        return;
    }

    grid.innerHTML = lista.map(team => `
        <a href="team.html?team=${team.short_name}" class="team-card-detailed">
            <div class="team-badge">${(team.short_name || 'SLV').toUpperCase()}</div>
            <div class="team-info">
                <span class="team-name">${team.name}</span>
                <div class="team-metrics">
                    <span class="metric-item">👥 <strong>${team.playerCount}</strong> jug.</span>
                    <span class="metric-item">🎂 <strong>${team.avgAge}</strong> años</span>
                </div>
            </div>
        </a>
    `).join("");
}

function filtrarEquipos(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
        renderizarGridEquipos(allTeamsData);
        return;
    }

    const filtrados = allTeamsData.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.short_name.toLowerCase().includes(q)
    );
    renderizarGridEquipos(filtrados);
}
