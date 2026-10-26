const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTEyNDQsImV4cCI6MjEwNjI4NzI0NH0.V4jfI7wDvKN-yePelVeAeA-3pEByfwS99o3s7k-vSWs";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentOperationMode = 'transferencia'; // Agdaldaliasat ti mode: 'transferencia' wenno 'cesion'

// =========================================================
// Inicialización del DOM
// =========================================================
document.addEventListener("DOMContentLoaded", async () => {
    await cargarEquiposEnSelects();

    // Evento para equipo de origen (para transferencia ken para cesion)
    document.getElementById("fromTeam").addEventListener("change", (e) => {
        const teamId = e.target.value;
        if (currentOperationMode === 'transferencia') {
            cargarJugadoresPorEquipo(teamId, "playersOutContainer");
        } else {
            cargarJugadoresParaCesion(teamId);
        }
    });

    document.getElementById("toTeam").addEventListener("change", (e) => {
        if (currentOperationMode === 'transferencia') {
            cargarJugadoresPorEquipo(e.target.value, "playersInContainer");
        }
    });

    const btnEnviar = document.getElementById("btnEnviarNegociacion");
    if (btnEnviar) {
        btnEnviar.addEventListener("click", publicarNegociacion);
    }
});

// =========================================================
// Pestañas / Selector de Modo (Transferencia vs Cesión)
// =========================================================
function switchOperationType(type) {
    currentOperationMode = type;
    const sectionTransfer = document.getElementById('sectionTransfer');
    const sectionLoan = document.getElementById('sectionLoan');
    const btnTransfer = document.getElementById('btnTabTransfer');
    const btnLoan = document.getElementById('btnTabLoan');
    const resultadoDiv = document.getElementById("resultado");

    if (resultadoDiv) resultadoDiv.innerHTML = "";

    if (type === 'transferencia') {
        if (sectionTransfer) sectionTransfer.style.display = 'block';
        if (sectionLoan) sectionLoan.style.display = 'none';
        if (btnTransfer) {
            btnTransfer.style.background = 'black';
            btnTransfer.style.color = 'white';
        }
        if (btnLoan) {
            btnLoan.style.background = '#e5e7eb';
            btnLoan.style.color = 'black';
        }
    } else {
        if (sectionTransfer) sectionTransfer.style.display = 'none';
        if (sectionLoan) sectionLoan.style.display = 'block';
        if (btnLoan) {
            btnLoan.style.background = 'black';
            btnLoan.style.color = 'white';
        }
        if (btnTransfer) {
            btnTransfer.style.background = '#e5e7eb';
            btnTransfer.style.color = 'black';
        }

        // No nagbaliw a tayak, no addan a nairugi ti fromTeam, ikarga dagiti jugadores a maibunong
        const fromUuid = document.getElementById("fromTeam").value;
        if (fromUuid) {
            cargarJugadoresParaCesion(fromUuid);
        }
    }
}

// =========================================================
// Cargar Equipos desde Supabase
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
            select.innerHTML = "";

            const defaultOpt = document.createElement("option");
            defaultOpt.value = "";
            defaultOpt.textContent = "-- Selecciona un equipo --";
            select.appendChild(defaultOpt);

            teams.forEach(eq => {
                const opt = document.createElement("option");
                opt.value = eq.id;
                opt.textContent = eq.name;
                select.appendChild(opt);
            });
        });

    } catch (err) {
        console.error("Excepción al cargar equipos en selectores:", err);
    }
}

// =========================================================
// Cargar Jugadores para Transferencia
// =========================================================
async function cargarJugadoresPorEquipo(teamUuid, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!teamUuid) {
        container.innerHTML = `<p class="placeholder-text">Selecciona un equipo primero...</p>`;
        return;
    }

    container.innerHTML = `<p class="placeholder-text">⏳ Cargando plantilla...</p>`;

    try {
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
// Cargar Jugadores para Cesión (Dropdown)
// =========================================================
async function cargarJugadoresParaCesion(teamUuid) {
    const loanPlayerSelect = document.getElementById("loanPlayer");
    if (!loanPlayerSelect) return;

    loanPlayerSelect.innerHTML = '<option value="">-- Selecciona el jugador --</option>';

    if (!teamUuid) return;

    try {
        const { data: statsData, error } = await supabaseClient
            .from("player_season_stats")
            .select(`
                player_id,
                players (
                    id,
                    name
                )
            `)
            .eq("team_id", teamUuid);

        if (error) throw error;

        if (statsData) {
            statsData.forEach(item => {
                const player = item.players;
                if (player) {
                    const opt = document.createElement("option");
                    opt.value = player.id;
                    opt.textContent = player.name;
                    loanPlayerSelect.appendChild(opt);
                }
            });
        }
    } catch (err) {
        console.error("Error al cargar jugadores para cesión:", err.message);
    }
}

// =========================================================
// Enviar Negociacion (Transferencia vs Cesión)
// =========================================================
// =========================================================
// Enviar Negociacion / Traspaso o Cesión y Publicar en el Foro
// =========================================================
async function publicarNegociacion() {
    const fromUuid = document.getElementById("fromTeam").value;
    const toUuid = document.getElementById("toTeam").value;
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

    resultadoDiv.innerHTML = "⏳ Registrando negociación...";

    try {
        const negotiationGroupId = crypto.randomUUID();

        if (currentOperationMode === 'transferencia') {
            // --- LÓGICA DE TRANSFERENCIAS ---
            const fee = Number(document.getElementById("transferFee").value || 0);
            const selectedOut = Array.from(document.querySelectorAll('input[name="playersOutContainer_players"]:checked')).map(cb => cb.value);
            const selectedIn = Array.from(document.querySelectorAll('input[name="playersInContainer_players"]:checked')).map(cb => cb.value);

            if (selectedOut.length === 0 && selectedIn.length === 0) {
                alert("Debes seleccionar al menos un jugador que salga o entre.");
                resultadoDiv.innerHTML = "";
                return;
            }

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
            // NOTIFICACIÓN AUTOMÁTICA AL FORO (TRASPASA)
            // =========================================================
            try {
                await fetch('https://superligalv.duckdns.org/api/foro/crear_validacion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from_team_id: fromUuid,
                        to_team_id: toUuid,
                        players_out: selectedOut,
                        players_in: selectedIn,
                        fee: fee
                    })
                });
                console.log("✅ Aviso de traspaso enviado a la API de Flask.");
            } catch (forumErr) {
                console.error("⚠️ La oferta se guardó pero falló la notificación al foro:", forumErr);
            }

            resultadoDiv.innerHTML = `
                <div class="exito" style="color: green; font-weight: bold;">
                    ✔ ¡Negociación enviada y publicada en el foro correctamente!<br>
                    <small>Grupo ID: ${negotiationGroupId}</small><br>
                    Pendiente de validación por la administración.
                </div>
            `;

        } else {
            // --- LÓGICA DE CESIONES ---
            const playerId = document.getElementById("loanPlayer").value;
            const minutos = document.getElementById("loanDuration").value.trim();
            const opcionCompra = document.getElementById("opcionCompra") ? document.getElementById("opcionCompra").value.trim() : "Sin opción";
            const penalizacion = document.getElementById("penalizacion") ? document.getElementById("penalizacion").value.trim() : "Ninguna";

            if (!playerId) {
                alert("Debes seleccionar un jugador para la cesión.");
                resultadoDiv.innerHTML = "";
                return;
            }

            const loanData = {
                player_id: playerId,
                team_id_origen: fromUuid,
                team_id_destino: toUuid,
                minutos: minutos,
                opcion_compra: opcionCompra,
                penalizacion: penalizacion,
                notes: notes,
                status: 'pending',
                negotiation_group_id: negotiationGroupId
            };

            const { error } = await supabaseClient
                .from("player_career_loans")
                .insert([loanData]);

            if (error) throw error;

            // =========================================================
            // NOTIFICACIÓN AUTOMÁTICA AL FORO (CESIÓN)
            // =========================================================
            try {
                await fetch('https://superligalv.duckdns.org/api/foro/crear_validacion_cesion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from_team_id: fromUuid,
                        to_team_id: toUuid,
                        player_id: playerId,
                        minutos: minutos,
                        opcion_compra: opcionCompra,
                        penalizacion: penalizacion,
                        notes: notes
                    })
                });
                console.log("✅ Aviso de cesión enviado a la API de Flask.");
            } catch (forumErr) {
                console.error("⚠️ La cesión se guardó pero falló la notificación al foro:", forumErr);
            }
            resultadoDiv.innerHTML = `
                <div class="exito" style="color: green; font-weight: bold;">
                    ✔ ¡Cesión registrada y publicada en el foro correctamente!<br>
                    <small>Grupo ID: ${negotiationGroupId}</small><br>
                    Pendiente de validación por la administración.
                </div>
            `;
        }

    } catch (err) {
        console.error(err);
        resultadoDiv.innerHTML = `<div class="error" style="color: red;">❌ Error al registrar: ${err.message}</div>`;
    }
}
