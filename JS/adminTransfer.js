/* =========================================================
   ADMIN PANEL JAVASCRIPT (Protegido por Contraseña)
   ========================================================= */

const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDcxMTI0NCwiZXhwIjoyMTA2Mjg3MjQ0fQ.m_UNqt64oq4ffKcD8zuTi5uzyu0MdLXAAMTAQoo_Nsg";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Define aquí tu supercontraseña de administración
const SUPER_PASSWORD = "SUPER_PASSWORD_2026"; 

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
    await cargarOperacionesPendientes();
});

async function cargarOperacionesPendientes() {
    const container = document.getElementById("pendingTransfersContainer");
    
    try {
        const { data: transfers, error } = await supabaseClient
            .from("player_career_transfers")
            .select(`
                id,
                player_id,
                from_team_id,
                to_team_id,
                transfer_fee,
                notes,
                status,
                negotiation_group_id,
                created_at,
                players (name),
                from_team:teams!from_team_id (name, short_name),
                to_team:teams!to_team_id (name, short_name)
            `)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error al cargar transferencias:", error);
            container.innerHTML = `<p class="text-muted">❌ Error al cargar operaciones.</p>`;
            return;
        }

        if (!transfers || transfers.length === 0) {
            container.innerHTML = `<p class="text-muted">🎉 No hay operaciones pendientes de validación en este momento.</p>`;
            return;
        }

        const grupos = {};
        transfers.forEach(tr => {
            const groupId = tr.negotiation_group_id || tr.id;
            if (!grupos[groupId]) {
                grupos[groupId] = {
                    date: new Date(tr.created_at).toLocaleString("es-ES"),
                    fee: tr.transfer_fee || 0,
                    notes: tr.notes || "Sin notas",
                    items: []
                };
            }
            grupos[groupId].items.push(tr);
        });

        container.innerHTML = Object.entries(grupos).map(([groupId, grupo]) => {
            const primerItem = grupo.items[0];
            const origenName = primerItem.from_team?.name || "Origen Desconocido";
            const destinoName = primerItem.to_team?.name || "Destino Desconocido";

            const jugadoresHtml = grupo.items.map(item => {
                const playerName = item.players?.name || "Jugador Desconocido";
                return `
                    <div class="player-transfer-row">
                        <span>⚽ <strong>${playerName}</strong></span>
                        <span class="text-muted">${item.from_team?.name} ➡️ ${item.to_team?.name}</span>
                    </div>
                `;
            }).join("");

            return `
                <div class="negotiation-card" id="group-${groupId}">
                    <div class="negotiation-header">
                        <span class="negotiation-teams">📁 Operación entre: <strong>${origenName}</strong> y <strong>${destinoName}</strong></span>
                        <span class="negotiation-fee">💰 ${Number(grupo.fee).toLocaleString()} €</span>
                    </div>
                    <div class="players-list-group">
                        <p class="text-muted" style="margin: 0 0 8px 0;">Fecha: ${grupo.date} | Notas: "${grupo.notes}"</p>
                        ${jugadoresHtml}
                    </div>
                    <div class="negotiation-actions">
                        <button class="btn-approve" onclick="procesarNegociacion('${groupId}', 'validated')">✔ Aprobar</button>
                        <button class="btn-reject" onclick="procesarNegociacion('${groupId}', 'cancelled')">❌ Rechazar</button>
                    </div>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Excepción en cargarOperacionesPendientes:", err);
        container.innerHTML = `<p class="text-muted">❌ Error inesperado al procesar los datos.</p>`;
    }
}

async function procesarNegociacion(groupId, nuevoEstado) {
    const card = document.getElementById(`group-${groupId}`);
    if (!card) return;

    // Si nuevoEstado viene como 'approved', lo mapeamos al valor permitido 'validated'
    const estadoABuscar = (nuevoEstado === 'approved') ? 'validated' : 'cancelled';

    const textoAccion = (estadoABuscar === 'validated') ? 'VALIDAR (Aprobar)' : 'RECHAZAR';

    if (!confirm(`¿Estás seguro de que deseas ${textoAccion} esta operación?`)) {
        return;
    }

    try {
        // Actualizamos el estado del traspaso en Supabase al estado correspondiente permitidos por el Check Constraint ('validated' o 'cancelled')
        const { error: statusErr } = await supabaseClient
            .from("player_career_transfers")
            .update({ status: estadoABuscar })
            .eq("negotiation_group_id", groupId);

        if (statusErr) throw statusErr;

        // Quitar la tarjeta visualmente de la lista de pendientes
        card.style.transition = "opacity 0.3s ease";
        card.style.opacity = "0";
        setTimeout(() => card.remove(), 300);

        // Si ya no quedan tarjetas, recargar el contenedor
        if (document.querySelectorAll(".negotiation-card").length <= 1) {
            setTimeout(cargarOperacionesPendientes, 400);
        }

    } catch (err) {
        console.error("Error al procesar la negociación:", err);
        alert(`❌ Error al procesar: ${err.message}`);
    }
}
