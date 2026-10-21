const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDcxMTI0NCwiZXhwIjoyMTA2Mjg3MjQ0fQ.m_UNqt64oq4ffKcD8zuTi5uzyu0MdLXAAMTAQoo_Nsg"

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =========================================================
// Inicialización del DOM
// =========================================================
document.addEventListener("DOMContentLoaded", async () => {
    // Reemplazamos la llamada al JSON por la consulta directa a Supabase
    await cargarEquiposDesdeSupabase();

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

        // Selecciona los desplegables de origen y destino
        const selects = [document.getElementById("fromTeam"), document.getElementById("toTeam")];

        selects.forEach(select => {
            if (!select) return;

            // 1. Limpiar opciones anteriores
            select.innerHTML = "";

            // 2. Crear la opción por defecto de forma limpia
            const defaultOpt = document.createElement("option");
            defaultOpt.value = "";
            defaultOpt.textContent = "-- Selecciona un equipo --";
            select.appendChild(defaultOpt);

            // 3. Añadir la lista de equipos cargada de Supabase
            teams.forEach(eq => {
                const opt = document.createElement("option");
                opt.value = eq.short_name;
                opt.textContent = eq.name;
                select.appendChild(opt);
            });
        });

    } catch (err) {
        console.error("Excepción al cargar equipos en selectores:", err);
    }
}

async function cargarEquiposDesdeJSON() {
    try {
        const response = await fetch('./JS/teams.json');
        if (!response.ok) {
            throw new Error("No se pudo cargar teams.json");
        }
        const equipos = await response.json();

        const selectFrom = document.getElementById("fromTeam");
        const selectTo = document.getElementById("toTeam");

        equipos.forEach(e => {
            const val = e.id || e.abrev || e.short_name;
            const text = e.team || e.equipo || e.name;

            const opt1 = document.createElement("option");
            opt1.value = val;
            opt1.textContent = text;
            selectFrom.appendChild(opt1);

            const opt2 = document.createElement("option");
            opt2.value = val;
            opt2.textContent = text;
            selectTo.appendChild(opt2);
        });
    } catch (error) {
        console.error("Error cargando teams.json:", error);
    }
}

async function cargarJugadoresPorEquipo(equipoIdentificador, containerId) {
    const container = document.getElementById(containerId);
    if (!equipoIdentificador) {
        container.innerHTML = `<p class="placeholder-text">Selecciona un equipo primero...</p>`;
        return;
    }

    container.innerHTML = `<p class="placeholder-text">⏳ Cargando plantilla...</p>`;

    try {
        let teamUuid = equipoIdentificador;

        // Si el identificador no tiene formato UUID (es una abreviatura como 'psg'), lo buscamos en la tabla teams
        if (!equipoIdentificador.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
            const { data: teamData, error: teamErr } = await supabaseClient
                .from("teams")
                .select("id")
                .eq("short_name", equipoIdentificador)
                .single();

            if (teamErr || !teamData) {
                console.error("No se encontró el equipo por short_name:", teamErr);
                container.innerHTML = `<p class="placeholder-text">❌ Error: No se reconoce el equipo.</p>`;
                return;
            }
            teamUuid = teamData.id;
        }

        // 2. Consultar los jugadores usando el UUID real del equipo
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

async function publicarNegociacion() {
    const fromTeamVal = document.getElementById("fromTeam").value;
    const toTeamVal = document.getElementById("toTeam").value;
    const fee = Number(document.getElementById("transferFee").value || 0);
    const notes = document.getElementById("notes").value.trim();
    const resultadoDiv = document.getElementById("resultado");

    if (!fromTeamVal || !toTeamVal) {
        alert("Debes seleccionar ambos equipos.");
        return;
    }

    if (fromTeamVal === toTeamVal) {
        alert("El equipo de origen y destino no pueden ser el mismo.");
        return;
    }

    // Recoger los checkboxes marcados
    const selectedOut = Array.from(document.querySelectorAll('input[name="playersOutContainer_players"]:checked')).map(cb => cb.value);
    const selectedIn = Array.from(document.querySelectorAll('input[name="playersInContainer_players"]:checked')).map(cb => cb.value);

    if (selectedOut.length === 0 && selectedIn.length === 0) {
        alert("Debes seleccionar al menos un jugador que salga o entre.");
        return;
    }

    resultadoDiv.innerHTML = "⏳ Registrando oferta de traspaso...";

    try {
        // Resolver UUIDs de los dos equipos
        const { data: fromTeamData } = await supabaseClient
            .from("teams")
            .select("id")
            .or(`short_name.eq.${fromTeamVal},id.eq.${fromTeamVal}`)
            .single();

        const { data: toTeamData } = await supabaseClient
            .from("teams")
            .select("id")
            .or(`short_name.eq.${toTeamVal},id.eq.${toTeamVal}`)
            .single();

        const fromUuid = fromTeamData.id;
        const toUuid = toTeamData.id;

        const negotiationGroupId = crypto.randomUUID();
        const payload = [];

        // Jugadores que salen (Origen -> Destino)
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

        // Jugadores que entran (Destino -> Origen)
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

        resultadoDiv.innerHTML = `
            <div class="exito">
                ✔ ¡Negociación enviada correctamente!<br>
                <small>Grupo ID: ${negotiationGroupId}</small><br>
                Pendiente de validación por la administración.
            </div>
        `;
    } catch (err) {
        console.error(err);
        resultadoDiv.innerHTML = `<div class="error">❌ Error al registrar: ${err.message}</div>`;
    }
}
