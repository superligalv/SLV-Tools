i/* =========================================================
   ADMIN PANEL JAVASCRIPT (Protegido por Contraseña)
   Soporta Traspasos y Cesiones de forma unificada
   ========================================================= */

const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTEyNDQsImV4cCI6MjEwNjI4NzI0NH0.V4jfI7wDvKN-yePelVeAeA-3pEByfwS99o3s7k-vSWs";

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
    container.innerHTML = `<p class="text-muted">⏳ Cargando operaciones pendientes...</p>`;

    try {
        // Ejecutamos consultas paralelas para Traspasos y Cesiones pendientes
        const [transfersRes, loansRes] = await Promise.all([
            supabaseClient
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
                .order("created_at", { ascending: false }),

            supabaseClient
                .from("player_career_loans")
                .select(`
                    id,
                    player_id,
                    team_id_origen,
                    team_id_destino,
                    minutos,
                    opcion_compra,
                    penalizacion,
                    notes,
                    status,
                    negotiation_group_id,
                    created_at,
                    players (name),
                    from_team:teams!team_id_origen (name, short_name),
                    to_team:teams!team_id_destino (name, short_name)
                `)
                .eq("status", "pending")
                .order("created_at", { ascending: false })
        ]);

        if (transfersRes.error) console.error("Error al cargar traspasos:", transfersRes.error);
        if (loansRes.error) console.error("Error al cargar cesiones:", loansRes.error);

        const transfers = transfersRes.data || [];
        const loans = loansRes.data || [];

        if (transfers.length === 0 && loans.length === 0) {
            container.innerHTML = `<p class="text-muted">🎉 No hay operaciones (ni traspasos ni cesiones) pendientes de validación en este momento.</p>`;
            return;
        }

        const grupos = {};

        // 1. Agrupar Traspasos
        transfers.forEach(tr => {
            const groupId = tr.negotiation_group_id || tr.id;
            if (!grupos[groupId]) {
                grupos[groupId] = {
                    type: 'transfer',
                    date: new Date(tr.created_at).toLocaleString("es-ES"),
                    fee: tr.transfer_fee || 0,
                    notes: tr.notes || "Sin notas",
                    items: []
                };
            }
            grupos[groupId].items.push(tr);
        });

        // 2. Agrupar Cesiones
        loans.forEach(loan => {
            const groupId = loan.negotiation_group_id || loan.id;
            if (!grupos[groupId]) {
                grupos[groupId] = {
                    type: 'loan',
                    date: new Date(loan.created_at).toLocaleString("es-ES"),
                    minutos: loan.minutos || "No especificado",
                    opcionCompra: loan.opcion_compra || "Sin opción",
                    penalizacion: loan.penalizacion || "Ninguna",
                    notes: loan.notes || "Sin notas",
                    items: []
                };
            }
            grupos[groupId].items.push(loan);
        });

        // Renderizar tarjetas unificadas
        container.innerHTML = Object.entries(grupos).map(([groupId, grupo]) => {
            const primerItem = grupo.items[0];
            const origenName = primerItem.from_team?.name || "Origen Desconocido";
            const destinoName = primerItem.to_team?.name || "Destino Desconocido";

            let detallesExtraHtml = "";

            if (grupo.type === 'transfer') {
                detallesExtraHtml = `<span class="negotiation-fee">💰 ${Number(grupo.fee).toLocaleString()} €</span>`;
            } else {
                detallesExtraHtml = `
                    <span class="negotiation-fee" style="font-size: 0.9rem; background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px;">
                        📌 CESIÓN | Min: ${grupo.minutos} | Opción: ${grupo.opcionCompra} | Penalización: ${grupo.penalizacion}
                    </span>
                `;
            }

            const jugadoresHtml = grupo.items.map(item => {
                const playerName = item.players?.name || "Jugador Desconocido";
                const iconoTipo = grupo.type === 'transfer' ? '⚽' : '🔄 (Cesión)';
                return `
                    <div class="player-transfer-row">
                        <span>${iconoTipo} <strong>${playerName}</strong></span>
                        <span class="text-muted">${item.from_team?.name} ➡️ ${item.to_team?.name}</span>
                    </div>
                `;
            }).join("");

            return `
                <div class="negotiation-card" id="group-${groupId}" data-type="${grupo.type}">
                    <div class="negotiation-header">
                        <span class="negotiation-teams">📁 ${grupo.type === 'transfer' ? 'Traspaso' : 'Cesión'} entre: <strong>${origenName}</strong> y <strong>${destinoName}</strong></span>
                        ${detallesExtraHtml}
                    </div>
                    <div class="players-list-group">
                        <p class="text-muted" style="margin: 0 0 8px 0;">Fecha: ${grupo.date} | Notas: "${grupo.notes}"</p>
                        ${jugadoresHtml}
                    </div>
                    <div class="negotiation-actions">
                        <button class="btn-approve" onclick="procesarNegociacion('${groupId}', '${grupo.type}', 'validated')">✔ Aprobar</button>
                        <button class="btn-reject" onclick="procesarNegociacion('${groupId}', '${grupo.type}', 'cancelled')">❌ Rechazar</button>
                    </div>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Excepción en cargarOperacionesPendientes:", err);
        container.innerHTML = `<p class="text-muted">❌ Error inesperado al procesar los datos.</p>`;
    }
}

async function procesarNegociacion(groupId, tipoOperacion, nuevoEstado) {
    const card = document.getElementById(`group-${groupId}`);
    if (!card) return;

    // Determinar a qué tabla afectar según si es traspaso o cesión
    const nombreTabla = tipoOperacion === 'transfer' ? 'player_career_transfers' : 'player_career_loans';

    try {
        const { error: statusErr } = await supabaseClient
            .from(nombreTabla)
            .update({ status: nuevoEstado })
            .eq("negotiation_group_id", groupId);

        if (statusErr) throw statusErr;

        // Quitar la tarjeta visualmente al instante
        card.style.transition = "opacity 0.3s ease";
        card.style.opacity = "0";
        setTimeout(() => card.remove(), 300);

        // Si ya no quedan tarjetas, recargar contenedor
        if (document.querySelectorAll(".negotiation-card").length <= 1) {
            setTimeout(cargarOperacionesPendientes, 400);
        }

    } catch (err) {
        console.error("Error al procesar la operación:", err);
        alert(`❌ Error al procesar: ${err.message}`);
    }
}
