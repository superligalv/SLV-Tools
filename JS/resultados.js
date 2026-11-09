const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTEyNDQsImV4cCI6MjEwNjI4NzI0NH0.V4jfI7wDvKN-yePelVeAeA-3pEByfwS99o3s7k-vSWs";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Define aquí tu supercontraseña de administración
const SUPER_PASSWORD = "SUPER_PASSWORD_2026";

const currentCompetitionId = "a579b018-aaf1-42b8-8df8-7d1dd9dea814";
let currentSeasonId = null;

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Solicitar la supercontraseña al entrar
    const passwordIngresada = prompt("🔒 Introduce la supercontraseña de administración:");

    if (passwordIngresada !== SUPER_PASSWORD) {
        alert("❌ Contraseña incorrecta. Acceso denegado.");
        window.location.href = "index.html"; // Redirigir al inicio si falla
        return;
    }

    // 2. Si la contraseña es correcta, mostrar el panel y cargar datos
    document.getElementById("adminContainer").style.display = "block";
    await inicializarTemporadaYJornadas();

    const selectJornada = document.getElementById("matchdaySelect");
    selectJornada.addEventListener("change", (e) => {
        if (e.target.value) {
            cargarPartidosJornada(e.target.value);
        } else {
            document.getElementById("matchesContainer").innerHTML = `<div class="text-center text-muted" style="padding: 30px;">Selecciona una jornada para ver los partidos.</div>`;
        }
    });
});

async function inicializarTemporadaYJornadas() {
    try {
        // Obtener la última temporada activa
        let { data: seasonData } = await supabaseClient
            .from("seasons")
            .select("id")
            .eq("is_current", true)
            .limit(1)
            .maybeSingle();

        if (!seasonData) {
            const { data: latestSeason } = await supabaseClient
                .from("seasons")
                .select("id")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();
            seasonData = latestSeason;
        }

        if (!seasonData) return;
        currentSeasonId = seasonData.id;

        // Obtener las jornadas disponibles
        const { data: matches, error } = await supabaseClient
            .from("matches")
            .select("matchday")
            .eq("competition_id", currentCompetitionId)
            .eq("season_id", currentSeasonId)
            .order("matchday", { ascending: true });

        if (error || !matches) return;

        const jornadasUnicas = [...new Set(matches.map(m => m.matchday))].filter(j => j !== null);
        
        const selectJornada = document.getElementById("matchdaySelect");
        selectJornada.innerHTML = `<option value="">Selecciona jornada...</option>` + 
            jornadasUnicas.map(j => `<option value="${j}">Jornada ${j}</option>`).join("");

        if (jornadasUnicas.length > 0) {
            selectJornada.value = jornadasUnicas[0];
            cargarPartidosJornada(jornadasUnicas[0]);
        }

    } catch (err) {
        console.error("Error inicializando jornadas:", err);
    }
}

async function cargarPartidosJornada(matchday) {
    const container = document.getElementById("matchesContainer");
    container.innerHTML = `<div class="text-center text-muted" style="padding: 30px;">⏳ Cargando partidos...</div>`;

    try {
        const { data: matches, error } = await supabaseClient
            .from("matches")
            .select(`
                id,
                matchday,
                home_score,
                away_score,
                status,
                home_team:teams!matches_home_team_id_fkey(name, short_name, logo_url),
                away_team:teams!matches_away_team_id_fkey(name, short_name, logo_url)
            `)
            .eq("competition_id", currentCompetitionId)
            .eq("season_id", currentSeasonId)
            .eq("matchday", matchday)
            .order("id", { ascending: true });

        if (error || !matches || matches.length === 0) {
            container.innerHTML = `<div class="text-center text-muted" style="padding: 30px;">No hay partidos programados para esta jornada.</div>`;
            return;
        }

        container.innerHTML = matches.map(match => `
            <div class="match-card" id="match-row-${match.id}">
                <div class="team-info home">
                    <strong>${match.home_team?.name || 'Local'}</strong>
                    ${match.home_team?.logo_url 
                        ? `<img src="${match.home_team.logo_url}" width="28" height="28" style="object-fit:contain;">` 
                        : `<span class="table-badge">${(match.home_team?.short_name || 'LOC').substring(0,3)}</span>`
                    }
                </div>
                
                <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="number" min="0" id="home-score-${match.id}" value="${match.home_score !== null ? match.home_score : ''}" class="score-input" placeholder="-">
                    <span style="font-weight: 700; color: #64748b;">VS</span>
                    <input type="number" min="0" id="away-score-${match.id}" value="${match.away_score !== null ? match.away_score : ''}" class="score-input" placeholder="-">
                    
                    <button class="btn-save" onclick="guardarResultado(event, '${match.id}')">Guardar</button>
                </div>

                <div class="team-info away">
                    ${match.away_team?.logo_url 
                        ? `<img src="${match.away_team.logo_url}" width="28" height="28" style="object-fit:contain;">` 
                        : `<span class="table-badge">${(match.away_team?.short_name || 'VIS').substring(0,3)}</span>`
                    }
                    <strong>${match.away_team?.name || 'Visitante'}</strong>
                </div>
            </div>
        `).join("");

    } catch (err) {
        console.error("Error al cargar partidos:", err);
        container.innerHTML = `<div class="text-center text-muted" style="padding: 30px;">❌ Error al cargar los partidos.</div>`;
    }
}

async function guardarResultado(event, matchId) {
    const homeInput = document.getElementById(`home-score-${matchId}`);
    const awayInput = document.getElementById(`away-score-${matchId}`);

    const homeScore = homeInput.value.trim();
    const awayScore = awayInput.value.trim();

    if (homeScore === "" || awayScore === "") {
        alert("Por favor, introduce los goles de ambos equipos antes de guardar.");
        return;
    }

    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = "Guardando...";
    btn.disabled = true;

    try {
        const { error } = await supabaseClient
            .from("matches")
            .update({
                home_score: parseInt(homeScore),
                away_score: parseInt(awayScore),
                status: 'FINISHED'
            })
            .eq("id", matchId);

        if (error) {
            console.error("Error al guardar en Supabase:", error);
            alert("❌ Error al guardar el resultado.");
            btn.textContent = originalText;
            btn.disabled = false;
            return;
        }

        btn.textContent = "¡Guardado! ✅";
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);

    } catch (err) {
        console.error("Excepción al guardar:", err);
        alert("❌ Error inesperado al guardar.");
        btn.textContent = originalText;
        btn.disabled = false;
    }
}
