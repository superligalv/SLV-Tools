const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "TU_SUPABASE_ANON_KEY";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", async () => {
    await cargarEquiposEnSelects();
    document.getElementById("btnEnviarNegociacion").addEventListener("click", publicarNegociacion);
});

async function cargarEquiposEnSelects() {
    const { data: teams, error } = await supabaseClient
        .from("teams")
        .select("id, name, short_name")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error cargando equipos:", error);
        return;
    }

    const selectFrom = document.getElementById("fromTeam");
    const selectTo = document.getElementById("toTeam");

    teams.forEach(team => {
        const opt1 = document.createElement("option");
        opt1.value = team.id;
        opt1.textContent = team.name;
        selectFrom.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = team.id;
        opt2.textContent = team.name;
        selectTo.appendChild(opt2);
    });
}

async function publicarNegociacion() {
    const fromTeamId = document.getElementById("fromTeam").value;
    const toTeamId = document.getElementById("toTeam").value;
    const fee = Number(document.getElementById("transferFee").value || 0);
    const notes = document.getElementById("notes").value.trim();
    const resultadoDiv = document.getElementById("resultado");

    if (!fromTeamId || !toTeamId) {
        alert("Debes seleccionar ambos equipos.");
        return;
    }

    if (fromTeamId === toTeamId) {
        alert("El equipo de origen y destino no pueden ser el mismo.");
        return;
    }

    // Identificador único de grupo para la negociación conjunta
    const negotiationGroupId = crypto.randomUUID();

    const payloadTransfers = [
        {
            player_id: "UUID_DEL_JUGADOR_AQUI", // Enlázalo con tu selector de jugadores
            from_team_id: fromTeamId,
            to_team_id: toTeamId,
            season_id: null, // Asigna el UUID de la Temporada 1 si procede
            transfer_fee: fee,
            notes: notes,
            status: 'pending',
            negotiation_group_id: negotiationGroupId
        }
    ];

    resultadoDiv.innerHTML = "⏳ Enviando negociación...";

    const { data, error } = await supabaseClient
        .from("player_career_transfers")
        .insert(payloadTransfers);

    if (error) {
        console.error("Error al registrar:", error);
        resultadoDiv.innerHTML = `<div class="error">❌ Error: ${error.message}</div>`;
        return;
    }

    resultadoDiv.innerHTML = `
        <div class="exito">
            ✔ ¡sendTransfer completado con éxito!<br>
            <small>ID de Grupo: ${negotiationGroupId}</small><br>
            Registrado como 'pending' para validación del administrador.
        </div>
    `;
}
