/* =========================================================
   TEAM PROFILE JAVASCRIPT (Estilo BeSoccer - Directo a Supabase)
   ========================================================= */

const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDcxMTI0NCwiZXhwIjoyMTA2Mjg3MjQ0fQ.m_UNqt64oq4ffKcD8zuTi5uzyu0MdLXAAMTAQoo_Nsg";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentRosterData = [];

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Cargar la lista de equipos directamente desde Supabase
    await cargarListaEquiposDesdeSupabase();

    // 2. Comprobar si la URL trae un parámetro de equipo (ej. team.html?team=rma)
    const urlParams = new URLSearchParams(window.location.search);
    const teamParam = urlParams.get("team");

    const teamSelect = document.getElementById("teamSelect");

    if (teamParam) {
        teamSelect.value = teamParam;
        await cargarDatosEquipo(teamParam);
    } else if (teamSelect.value) {
        await cargarDatosEquipo(teamSelect.value);
    }

    // 3. Evento de cambio manual en el desplegable superior
    teamSelect.addEventListener("change", async (e) => {
        const selectedValue = e.target.value;
        if (selectedValue) {
            const newUrl = `${window.location.pathname}?team=${selectedValue}`;
            window.history.pushState({ path: newUrl }, '', newUrl);

            await cargarDatosEquipo(selectedValue);
        }
    });

    // 4. Buscador de jugadores en tiempo real
    document.getElementById("searchPlayer").addEventListener("input", (e) => {
        filtrarJugadores(e.target.value);
    });
});

async function cargarListaEquiposDesdeSupabase() {
    try {
        const { data: equipos, error } = await supabaseClient
            .from("teams")
            .select("id, name, short_name")
            .order("name", { ascending: true });

        if (error) {
            console.error("Error al cargar equipos de Supabase:", error);
            return;
        }

        const select = document.getElementById("teamSelect");
        select.innerHTML = '<option value="">-- Selecciona un equipo --</option>';

        equipos.forEach(eq => {
            const opt = document.createElement("option");
            // Usamos el short_name como valor para que coincida con las URLs y abreviaturas
            opt.value = eq.short_name;
            opt.textContent = eq.name;
            select.appendChild(opt);
        });

    } catch (err) {
        console.error("Excepción al cargar equipos:", err);
    }
}

async function cargarDatosEquipo(equipoIdentificador) {
    try {
        // 1. Obtener los datos del equipo por short_name o ID
        const { data: teamData, error: teamErr } = await supabaseClient
            .from("teams")
            .select("*")
            .or(`short_name.eq.${equipoIdentificador},id.eq.${equipoIdentificador}`)
            .single();

        if (teamErr || !teamData) {
            console.error("Equipo no encontrado en Supabase:", teamErr);
            document.getElementById("teamTitle").textContent = "Equipo no encontrado";
            document.getElementById("rosterTableBody").innerHTML = `<tr><td colspan="12" class="text-center text-muted">No se pudo cargar la información del equipo.</td></tr>`;
            return;
        }

        // Actualizar cabecera visual
        document.getElementById("teamTitle").textContent = teamData.name;
        document.getElementById("badgeText").textContent = (teamData.short_name || "SLV").toUpperCase();
        document.getElementById("teamDivision").textContent = `DIVISIÓN ${teamData.division || 1}`;

        // 2. Consultar plantilla vinculada a este team_id
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
            console.error("Error al cargar la plantilla:", rosterErr);
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
        tbody.innerHTML = `<tr><td colspan="12" class="text-center text-muted">No hay jugadores registrados en esta plantilla.</td></tr>`;
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
