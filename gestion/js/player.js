/* =========================================================
   PLAYER PROFILE JAVASCRIPT
   ========================================================= */

const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDcxMTI0NCwiZXhwIjoyMTA2Mjg3MjQ0fQ.m_UNqt64oq4ffKcD8zuTi5uzyu0MdLXAAMTAQoo_Nsg";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get("id");

    if (playerId) {
        await cargarDatosJugador(playerId);
    } else {
        document.getElementById("playerName").textContent = "Selecciona un jugador";
    }

    // Buscador rápido en la esquina superior
    const searchInput = document.getElementById("playerSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => buscarJugadores(e.target.value));
    }
});

async function cargarDatosJugador(playerId) {
    try {
        // 1. Consultar estadísticas de temporada del jugador junto a sus datos personales y equipo actual
        const { data: statsData, error: statsErr } = await supabaseClient
            .from("player_season_stats")
            .select(`
                *,
                players (
                    id,
                    name,
                    nationality
                ),
                teams (
                    id,
                    name,
                    short_name
                )
            `)
            .eq("player_id", playerId)
            .single();

        if (statsErr || !statsData) {
            console.error("Error al cargar jugador:", statsErr);
            document.getElementById("playerName").textContent = "Jugador no encontrado";
            return;
        }

        const p = statsData.players || {};
        const t = statsData.teams || {};

        // Rellenar datos del Hero
        document.getElementById("playerName").textContent = p.name || "Desconocido";
        document.getElementById("playerNat").textContent = p.nationality || "N/A";
        
        // Iniciales para el Avatar
        const iniciales = p.name ? p.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "SL";
        document.getElementById("avatarText").textContent = iniciales;

        // Enlace al Equipo
        const teamAnchor = document.getElementById("teamAnchor");
        if (t.short_name) {
            teamAnchor.textContent = t.name;
            teamAnchor.href = `team.html?team=${t.short_name}`;
        } else {
            teamAnchor.textContent = "Agente Libre / Sin Equipo";
            teamAnchor.removeAttribute("href");
        }

        // Estado de forma / Lesión
        const statusElem = document.getElementById("playerStatus");
        if (statsData.inj > 0) {
            statusElem.textContent = `Lesionado (${statsData.inj} sem)`;
            statusElem.className = "badge-status fit-injured";
        } else {
            statusElem.textContent = "Disponible";
            statusElem.className = "badge-status fit-ok";
        }

        // Atributos base
        document.getElementById("attrST").textContent = statsData.st || 0;
        document.getElementById("attrTK").textContent = statsData.tk || 0;
        document.getElementById("attrPS").textContent = statsData.ps || 0;
        document.getElementById("attrSH").textContent = statsData.sh || 0;
        document.getElementById("attrAG").textContent = statsData.ag || 0;

        // Métricas de Rendimiento
        document.getElementById("statGam").textContent = statsData.gam || 0;
        document.getElementById("statGls").textContent = statsData.gls || 0;
        document.getElementById("statAss").textContent = statsData.ass || 0;
        document.getElementById("statAge").textContent = statsData.age || "-";

        // 2. Cargar Historial de Traspasos
        await cargarHistorialTraspasos(playerId);

    } catch (err) {
        console.error("Excepción en cargarDatosJugador:", err);
    }
}

async function cargarHistorialTraspasos(playerId) {
    const tbody = document.getElementById("transfersTableBody");
    try {
        const { data: transfers, error } = await supabaseClient
            .from("player_career_transfers")
            .select(`
                *,
                from_team:teams!from_team_id (name, short_name),
                to_team:teams!to_team_id (name, short_name)
            `)
            .eq("player_id", playerId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error al cargar traspasos:", error);
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No se pudo obtener el historial.</td></tr>`;
            return;
        }

        if (!transfers || transfers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Sin movimientos registrados en el mercado.</td></tr>`;
            return;
        }

        tbody.innerHTML = transfers.map(tr => {
            const fecha = new Date(tr.created_at).toLocaleDateString("es-ES");
            const origen = tr.from_team ? `<a href="team.html?team=${tr.from_team.short_name}">${tr.from_team.name}</a>` : "Libre";
            const destino = tr.to_team ? `<a href="team.html?team=${tr.to_team.short_name}">${tr.to_team.name}</a>` : "Libre";
            const precio = tr.fee ? `${Number(tr.fee).toLocaleString()} €` : "Gratis / Intercambio";

            return `
                <tr>
                    <td>${fecha}</td>
                    <td>${origen}</td>
                    <td>${destino}</td>
                    <td><strong>${precio}</strong></td>
                    <td>${tr.transfer_type || 'Traspaso'}</td>
                </tr>
            `;
        }).join("");

    } catch (err) {
        console.error("Excepción en cargarHistorialTraspasos:", err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Error al cargar historial.</td></tr>`;
    }
}

async function buscarJugadores(query) {
    const dropdown = document.getElementById("searchResults");
    const q = query.trim().toLowerCase();

    if (q.length < 2) {
        dropdown.style.display = "none";
        return;
    }

    try {
        const { data: players, error } = await supabaseClient
            .from("players")
            .select("id, name")
            .ilike("name", `%${q}%`)
            .limit(5);

        if (error || !players || players.length === 0) {
            dropdown.style.display = "none";
            return;
        }

        dropdown.innerHTML = players.map(p => `
            <div class="search-item" onclick="window.location.href='player.html?id=${p.id}'">
                ${p.name}
            </div>
        `).join("");

        dropdown.style.display = "block";

    } catch (err) {
        console.error("Error en búsqueda rápida:", err);
    }
}
