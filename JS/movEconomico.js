const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTEyNDQsImV4cCI6MjEwNjI4NzI0NH0.V4jfI7wDvKN-yePelVeAeA-3pEByfwS99o3s7k-vSWs";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let pinActual = "";

const dropdown = document.getElementById("teamsDropdown");
const btnEnviar = document.getElementById("btnEnviar");
const spinner = document.getElementById("spinner");
const resultado = document.getElementById("resultado");
const modal = document.getElementById("pinModal");
const confirmPin = document.getElementById("confirmPin");
const cancelPin = document.getElementById("cancelPin");
const pinError = document.getElementById("pinError");
const teamPin = document.getElementById("teamPin");

// =========================================================
// Inicialización del DOM y Carga de Equipos desde Supabase
// =========================================================
document.addEventListener("DOMContentLoaded", async () => {
    await cargarEquiposEnSelects();
});

async function cargarEquiposEnSelects() {
    try {
        const { data: teams, error } = await supabaseClient
            .from("teams")
            .select("id, name, short_name")
            .order("name", { ascending: true });

        if (error) {
            console.error("Error al cargar equipos de Supabase:", error);
            resultado.innerHTML = `<div class="error">❌ No se pudieron cargar los equipos.</div>`;
            return;
        }

        dropdown.innerHTML = "";
        const defaultOpt = document.createElement("option");
        defaultOpt.value = "";
        defaultOpt.textContent = "-- Selecciona un equipo --";
        dropdown.appendChild(defaultOpt);

        teams.forEach(eq => {
            const opt = document.createElement("option");
            // Usamos short_name como valor para que coincida con lo que tu API Flask espera
            opt.value = eq.short_name; 
            opt.textContent = eq.name;
            dropdown.appendChild(opt);
        });

    } catch (err) {
        console.error("Excepción al cargar equipos:", err);
    }
}

// =========================================================
// ABRIR MODAL PIN
// =========================================================
btnEnviar.addEventListener("click", () => {
    const equipo = dropdown.value;
    const tipo = document.getElementById("tipoMovimiento").value;
    const concepto = document.getElementById("concepto").value.trim();
    const cantidad = document.getElementById("cantidad").value;
    const referencia = document.getElementById("referencia").value.trim();

    if (!equipo) {
        alert("Selecciona un equipo");
        return;
    }
    if (!tipo) {
        alert("Selecciona el tipo de movimiento");
        return;
    }
    if (!concepto) {
        alert("Introduce el concepto");
        return;
    }
    if (!cantidad || Number(cantidad) <= 0) {
        alert("Introduce una cantidad válida");
        return;
    }
    if (!referencia) {
        alert("Introduce la referencia");
        return;
    }

    teamPin.value = "";
    pinError.innerText = "";
    modal.style.display = "flex";
});

// =========================================================
// CANCELAR PIN
// =========================================================
cancelPin.onclick = () => {
    modal.style.display = "none";
    pinError.innerText = "";
};

// =========================================================
// CONFIRMAR PIN
// =========================================================
confirmPin.onclick = () => {
    const pinInput = teamPin.value.trim();

    if (!pinInput) {
        pinError.innerText = "Introduce el PIN";
        return;
    }

    pinActual = pinInput;
    modal.style.display = "none";
    pinError.innerText = "";

    enviarMovimiento();
};

// =========================================================
// ENVIAR MOVIMIENTO A LA API
// =========================================================
async function enviarMovimiento() {
    const abrevSeleccionada = dropdown.value; 
    const tipo = document.getElementById("tipoMovimiento").value;
    const concepto = document.getElementById("concepto").value.trim();
    const cantidad = Number(document.getElementById("cantidad").value);
    const referencia = document.getElementById("referencia").value.trim();

    spinner.style.display = "block";
    resultado.innerHTML = "";

    try {
        // Consultamos el nombre del equipo para mostrarlo en el mensaje de éxito
        const { data: teamData, error: teamError } = await supabaseClient
            .from("teams")
            .select("id, name")
            .eq("short_name", abrevSeleccionada)
            .single();

        if (teamError || !teamData) {
            throw new Error("No se ha encontrado el equipo en la base de datos.");
        }

        // Petición a la API de Flask (sin enviar temporada, el trigger se encarga)
        const response = await fetch(
            "https://superligalv.duckdns.org/api/economia/movimiento",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    equipo: abrevSeleccionada,
                    pin: pinActual,
                    tipo: tipo,
                    concepto: concepto,
                    cantidad: cantidad,
                    referencia: referencia
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            resultado.innerHTML = `
                <div class="exito" style="color: green; font-weight: bold;">
                    ✔ Movimiento registrado correctamente<br><br>
                    Equipo: ${teamData.name}<br>
                    Tipo: ${tipo}<br>
                    Concepto: ${concepto}<br>
                    Cantidad: ${cantidad.toFixed(2)} M
                </div>
            `;

            document.getElementById("concepto").value = "";
            document.getElementById("cantidad").value = "";
            document.getElementById("referencia").value = "";
            dropdown.value = "";
            document.getElementById("tipoMovimiento").value = "";
        } else {
            resultado.innerHTML = `
                <div class="error" style="color: red;">
                    ❌ ${data.error || "Error desconocido"}
                </div>
            `;
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        resultado.innerHTML = `
            <div class="error" style="color: red;">
                ❌ Error al procesar el movimiento<br>
                ${error.message || ""}
            </div>
        `;
    } finally {
        spinner.style.display = "none";
    }
}
