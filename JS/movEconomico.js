const dropdown =
    document.getElementById("teamsDropdown");

const btnEnviar =
    document.getElementById("btnEnviar");

const spinner =
    document.getElementById("spinner");

const resultado =
    document.getElementById("resultado");

const modal =
    document.getElementById("pinModal");

const confirmPin =
    document.getElementById("confirmPin");

const cancelPin =
    document.getElementById("cancelPin");

const pinError =
    document.getElementById("pinError");

const teamPin =
    document.getElementById("teamPin");


let equiposData = [];
let pinActual = "";


/* =========================
   CARGAR EQUIPOS
========================= */

fetch('./JS/teams.json')
.then(response => {

    if (!response.ok) {
        throw new Error(
            "No se pudo cargar teams.json"
        );
    }

    return response.json();

})
.then(equipos => {

    equiposData = equipos;

    equipos.forEach(e => {

        const option =
            document.createElement("option");

        option.value = e.id;
        option.textContent = e.team;

        dropdown.appendChild(option);

    });

})
.catch(error => {

    console.error(
        "Error cargando equipos:",
        error
    );

    resultado.innerHTML = `
        <div class="error">
            ❌ No se pudieron cargar los equipos
        </div>
    `;

});


/* =========================
   ABRIR MODAL PIN
========================= */

btnEnviar.addEventListener(
    "click",
    () => {

        const equipo =
            dropdown.value;

        const tipo =
            document.getElementById(
                "tipoMovimiento"
            ).value;

        const concepto =
            document.getElementById(
                "concepto"
            ).value.trim();

        const cantidad =
            document.getElementById(
                "cantidad"
            ).value;

        const referencia =
            document.getElementById(
                "referencia"
            ).value.trim();

        const temporada =
            document.getElementById(
                "temporada"
            ).value.trim();


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

        if (!temporada) {
            alert("Introduce la temporada");
            return;
        }


        teamPin.value = "";
        pinError.innerText = "";

        modal.style.display = "flex";

    }
);


/* =========================
   CANCELAR
========================= */

cancelPin.onclick = () => {

    modal.style.display = "none";
    pinError.innerText = "";

};


/* =========================
   CONFIRMAR PIN
========================= */

confirmPin.onclick = () => {

    const pinInput =
        teamPin.value.trim();


    if (!pinInput) {

        pinError.innerText =
            "Introduce el PIN";

        return;

    }


    pinActual = pinInput;

    modal.style.display = "none";
    pinError.innerText = "";

    enviarMovimiento();

};

/* =========================
   ENVIAR MOVIMIENTO
========================= */

async function enviarMovimiento() {

    const abrevSeleccionada = dropdown.value; // Aquí llega la abreviatura antigua (ej: 'rma')
    const tipo = document.getElementById("tipoMovimiento").value;
    const concepto = document.getElementById("concepto").value.trim();
    const cantidad = Number(document.getElementById("cantidad").value);
    const referencia = document.getElementById("referencia").value.trim();
    const temporada = document.getElementById("temporada").value.trim();

    spinner.style.display = "block";
    resultado.innerHTML = "";

    try {
        // 1. Buscamos primero el UUID del equipo en Supabase usando la abreviatura (short_name)
        const { data: teamData, error: teamError } = await supabaseClient
            .from("teams")
            .select("id, name")
            .eq("short_name", abrevSeleccionada)
            .single();

        if (teamError || !teamData) {
            throw new Error("No se ha encontrado el equipo en la base de datos.");
        }

        const teamUuid = teamData.id;

        // 2. Enviamos la petición a tu API o directamente a Supabase
        // (Si tu API backend esperaba la abreviatura, puedes mantener el fetch a tu API, 
        // pero asegurándote de que tu API mapee el short_name al UUID).
        
        const response = await fetch(
            "https://superligalv.duckdns.org/api/economia/movimiento",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    equipo: abrevSeleccionada, // O puedes mandar teamUuid si tu backend ya lo soporta
                    pin: pinActual,
                    tipo: tipo,
                    concepto: concepto,
                    cantidad: cantidad,
                    referencia: referencia,
                    temporada: temporada
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            resultado.innerHTML = `
                <div class="exito">
                    ✔ Movimiento registrado correctamente
                    <br><br>
                    Equipo: ${teamData.name}
                    <br>
                    Tipo: ${tipo}
                    <br>
                    Concepto: ${concepto}
                    <br>
                    Cantidad: ${cantidad.toFixed(2)} M
                </div>
            `;

            document.getElementById("concepto").value = "";
            document.getElementById("cantidad").value = "";
            document.getElementById("referencia").value = "";
        } else {
            resultado.innerHTML = `
                <div class="error">
                    ❌ ${data.error || "Error desconocido"}
                </div>
            `;
        }
    } catch (error) {
        console.error("Error conexión:", error);
        resultado.innerHTML = `
            <div class="error">
                ❌ Error al procesar el movimiento
                <br>
                ${error.message || ""}
            </div>
        `;
    } finally {
        spinner.style.display = "none";
    }
}
