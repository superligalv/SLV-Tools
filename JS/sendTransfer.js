const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDcxMTI0NCwiZXhwIjoyMTA2Mjg3MjQ0fQ.m_UNqt64oq4ffKcD8zuTi5uzyu0MdLXAAMTAQoo_Nsg";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =========================================================
// Inicialización del DOM
// =========================================================
document.addEventListener("DOMContentLoaded", async () => {
    // Carga de equipos directamente desde Supabase
    await cargarEquiposEnSelects();

    document.getElementById("fromTeam").addEventListener("change", (e) => {
        cargarJugadoresPorEquipo(e.target.value, "playersOutContainer");
    });

    document.getElementById("toTeam").addEventListener("change", (e) => {
        cargarJugadoresPorEquipo(e.target.value, "playersInContainer");
    });

    const btnEnviar = document.getElementById("btnEnviarNegociacion");
    if (btnEnviar) {
        btnEnviar.addEventListener("click", publicarNegociacion);
    }
});

// =========================================================
// Cargar Equipos desde Supabase (Guardando UUID en el value)
// =========================================================
async function cargarEquiposEnSelects() {
    try {
        const { data: teams, error } = await supabaseClient
            .from("teams")
            .select("id, name, short_name")
            .order("name", { ascending: true });

        if (error) {
            console.error("Error al cargar equipos de Supabase:", error);
            return;
        }

        const selects = [document.getElementById("fromTeam"), document.getElementById("toTeam")];

        selects.forEach(select => {
            if (!select) return;

            // 1. Limpiar opciones anteriores
            select.innerHTML = "";

            // 2. Crear la opción por defecto
            const defaultOpt = document.createElement("option");
            defaultOpt.value = "";
            defaultOpt.textContent = "-- Selecciona un equipo --";
            select.appendChild(defaultOpt);

            // 3. Añadir la lista usando el UUID (eq.id) como value
            teams.forEach(eq => {
                const opt = document.createElement("option");
                opt.value = eq.id; // <-- Guardamos el UUID directamente
                opt.textContent = eq.name;
                select.appendChild(opt);
            });
        });

    } catch (err) {
        console.error("Excepción al cargar equipos en selectores:", err);
    }
}

// =========================================================
// Cargar Plantilla de Jugadores (Recibe directamente el UUID)
// =========================================================
async function cargarJugadoresPorEquipo(teamUuid, containerId) {
    const container = document.getElementById(containerId);
    if (!teamUuid) {
        container.innerHTML = `<p class="placeholder-text">Selecciona un equipo primero...</p>`;
        return;
    }

    container.innerHTML = `<p class="placeholder-text">⏳ Cargando plantilla...</p>`;

    try {
        // Consultar los jugadores usando el UUID del equipo directamente
        const { data: statsData, error: statsErr } = await supabaseClient
            .from("player_season_stats")
            .select(`
                player_id,
                players (
                    id,
                    name
                )
            `)
            .eq("team_id", teamUuid);

        if (statsErr) {
            console.error("Error al consultar estadísticas:", statsErr);
            container.innerHTML = `<p class="placeholder-text">❌ Error al consultar jugadores.</p>`;
            return;
        }

        if (!statsData || statsData.length === 0) {
            container.innerHTML = `<p class="placeholder-text">⚠️ No hay jugadores en esta plantilla.</p>`;
            return;
        }

        container.innerHTML = statsData.map(item => {
            const player = item.players;
            if (!player) return "";
            return `
                <label class="player-option">
                    <input type="checkbox" name="${containerId}_players" value="${player.id}">
                    <span>${player.name}</span>
                </label>
            `;
        }).join("");

    } catch (err) {
        console.error("Excepción en cargarJugadoresPorEquipo:", err);
        container.innerHTML = `<p class="placeholder-text">❌ Error inesperado al cargar.</p>`;
    }
}

// =========================================================
// Enviar Negociacion / Traspaso y Publicar en el Foro
// =========================================================
async function publicarNegociacion() {
    const fromUuid = document.getElementById("fromTeam").value;
    const toUuid = document.getElementById("toTeam").value;
    const fee = Number(document.getElementById("transferFee").value || 0);
    const notes = document.getElementById("notes").value.trim();
    const resultadoDiv = document.getElementById("resultado");

    if (!fromUuid || !toUuid) {
        alert("Debes seleccionar ambos equipos.");
        return;
    }

    if (fromUuid === toUuid) {
        alert("El equipo de origen y destino no pueden ser el mismo.");
        return;
    }

    const selectedOut = Array.from(document.querySelectorAll('input[name="playersOutContainer_players"]:checked')).map(cb => cb.value);
    const selectedIn = Array.from(document.querySelectorAll('input[name="playersInContainer_players"]:checked')).map(cb => cb.value);

    if (selectedOut.length === 0 && selectedIn.length === 0) {
        alert("Debes seleccionar al menos un jugador que salga o entre.");
        return;
    }

    resultadoDiv.innerHTML = "⏳ Registrando oferta de traspaso...";

    try {
        const negotiationGroupId = crypto.randomUUID();
        const payload = [];

        selectedOut.forEach(playerId => {
            payload.push({
                player_id: playerId,
                from_team_id: fromUuid,
                to_team_id: toUuid,
                transfer_fee: fee,
                notes: notes,
                status: 'pending',
                negotiation_group_id: negotiationGroupId
            });
        });

        selectedIn.forEach(playerId => {
            payload.push({
                player_id: playerId,
                from_team_id: toUuid,
                to_team_id: fromUuid,
                transfer_fee: 0,
                notes: notes,
                status: 'pending',
                negotiation_group_id: negotiationGroupId
            });
        });

        const { error } = await supabaseClient
            .from("player_career_transfers")
            .insert(payload);

        if (error) throw error;

        // =========================================================
        // NOTIFICACIÓN AUTOMÁTICA AL FORO VÍA API DE FLASK
        // =========================================================
        try {
            const [teamFromRes, teamToRes, playersOutRes, playersInRes] = await Promise.all([
                supabaseClient.from("teams").select("name, short_name").eq("id", fromUuid).single(),
                supabaseClient.from("teams").select("name, short_name").eq("id", toUuid).single(),
                selectedOut.length > 0 ? supabaseClient.from("players").select("id, name").in("id", selectedOut) : { data: [] },
                selectedIn.length > 0 ? supabaseClient.from("players").select("id, name").in("id", selectedIn) : { data: [] }
            ]);

            const teamFrom = teamFromRes.data;
            const teamTo = teamToRes.data;
            const namesOut = (playersOutRes.data || []).map(p => p.name);
            const namesIn = (playersInRes.data || []).map(p => p.name);

            const strOut = namesOut.length > 0 ? namesOut.join(', ') : 'Ninguno';
            const strIn = namesIn.length > 0 ? namesIn.join(', ') : 'Ninguno';

            // Título: Nombre Equipo Origen - Nombre Equipo Destino (Jugadores Origen / Jugadores destino)
            const tituloPost = `${teamFrom.name} - ${teamTo.name} (${strOut} / ${strIn})`;

            // Contenido exacto solicitado
            const contenidoPost = `Se van a ${teamFrom.name} (${teamFrom.short_name}):\n\n` +
                (namesIn.length > 0 ? namesIn.join('\n') : 'Ninguno') + `\n\n` +
                `Se van a ${teamTo.name} (${teamTo.short_name}):\n\n` +
                (namesOut.length > 0 ? namesOut.join('\n') : 'Ninguno') + `\n\n` +
                `${teamFrom.name} PAGA: ${fee}M.`;

            await fetch('https://superligalv.duckdns.org/api/foro/crear_validacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section_id: 1,
                    title: tituloPost,
                    content: contenidoPost
                })
            });
            console.log("✅ Aviso de post enviado a la API de Flask.");
        } catch (forumErr) {
            console.error("⚠️ La oferta se guardó pero falló la notificación al foro:", forumErr);
        }
        // =========================================================

        resultadoDiv.innerHTML = `
            <div class="exito">
                ✔ ¡Negociación enviada y publicada en el foro correctamente!<br>
                <small>Grupo ID: ${negotiationGroupId}</small><br>
                Pendiente de validación por la administración.
            </div>
        `;
    } catch (err) {
        console.error(err);
        resultadoDiv.innerHTML = `<div class="error">❌ Error al registrar: ${err.message}</div>`;
    }
}
