const btnVer = document.getElementById("btnVer");
const pinModal = document.getElementById("pinModal");
const confirmPin = document.getElementById("confirmPin");
const cancelPin = document.getElementById("cancelPin"); // <-- Añadido
const dropdown = document.getElementById('teamsDropdown');
const pinError = document.getElementById("pinError"); // <-- Añadido

let equiposData = [];

// Cargar los equipos en el select
fetch('./JS/teams.json')
  .then(response => response.json())
  .then(equipos => {
    equiposData = equipos;
    equipos.forEach(e => {
      const option = document.createElement('option');
      option.value = e.id;
      option.textContent = e.team;
      dropdown.appendChild(option);
    });
  });

// Abrir el modal al hacer click en VER
btnVer.addEventListener("click", () => {
    const equipo = dropdown.value;

    if (!equipo) {
        alert("Selecciona un equipo");
        return;
    }

    // Limpiamos mensajes residuales previos antes de abrir
    pinError.textContent = "";
    document.getElementById("teamPin").value = "";
    
    pinModal.style.display = "block";
});

// Botón cancelar del modal
cancelPin.addEventListener("click", () => {
    pinModal.style.display = "none";
});

// Confirmar el PIN y realizar la petición
confirmPin.addEventListener("click", async () => {
    const equipo = dropdown.value;
    const pin = document.getElementById("teamPin").value;

    // Limpiamos errores anteriores
    pinError.textContent = "";

    const formData = new FormData();
    formData.append("equipo", equipo);
    formData.append("pin", pin);

    try {
        // Asegúrate de que la URL apunte correctamente a tu API de Flask
        // Si la web corre en otro puerto diferente al de Flask (5000), pon "http://127.0.0.1:5000/alineacion/ver"
	const response = await fetch("/https://superligalv.duckdns.org/alineacion/ver", {
	    method: "POST",
	    body: formData
	});
        const data = await response.json();

        if (!response.ok) {
            // Muestra el mensaje de error ("PIN incorrecto", "alineación no encontrada", etc.)
            pinError.textContent = data.error || "Error";
            return;
        }

        // Si todo va bien, inyectamos el contenido en el textarea
        document.getElementById("shtData").value = data.alineacion;

        document.getElementById("resultado").innerHTML = "✅ Alineación cargada correctamente";

        // Cerramos modal y limpiamos campos
        pinModal.style.display = "none";
        document.getElementById("teamPin").value = "";

    } catch (err) {
        console.error(err);
        document.getElementById("resultado").innerHTML = "❌ Error de conexión con el servidor";
    }
});
