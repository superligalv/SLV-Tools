const dropdown = document.getElementById('teamsDropdown');
const btnValidar = document.getElementById("btnValidar");
const textareasht = document.getElementById("shtData");
const validationSection = document.getElementById("validation");
const btnEnviar = document.getElementById("btnEnviar");
const spinner = document.getElementById("spinner");
const resultado = document.getElementById("resultado");
const modal = document.getElementById("pinModal");
const confirmPin = document.getElementById("confirmPin");
const cancelPin = document.getElementById("cancelPin");
const pinError = document.getElementById("pinError");

cancelPin.onclick = () => {
  modal.style.display = "none";
  pinError.innerText = "";
};

confirmPin.onclick = validarPin;

async function validarPin() {

  const equipo = dropdown.value;
  const pinIntroducido = document.getElementById("teamPin").value.trim();

  if (!pinIntroducido) {
    pinError.innerText = "Introduce el PIN";
    return;
  }

  try {

    const response = await fetch("./JS/claves.txt");
    const texto = await response.text();

    const lineas = texto.split("\n");

    let pinCorrecto = null;

    lineas.forEach(linea => {

      const [id, pin] = linea.trim().split("=");

      if (id === equipo) {
        pinCorrecto = pin;
      }

    });

    if (!pinCorrecto) {
      pinError.innerText = "Equipo no encontrado";
      return;
    }

    if (pinIntroducido !== pinCorrecto) {
      pinError.innerText = "PIN incorrecto";
      return;
    }

    modal.style.display = "none";

    enviarAApi();

  } catch (error) {

    pinError.innerText = "Error verificando PIN";

  }

}

btnValidar.addEventListener("click", validar);

function validar() {

  const contenido = textareasht.value.trim();
  const selectedId = dropdown.value;

  resultado.innerHTML = "";
  btnEnviar.disabled = true;

  if (contenido === "") {
    validationSection.innerHTML =
      "<span style='color:red;'>⚠ El textarea está vacío.</span>";
    return;
  }

  const primeraLinea = contenido.split("\n")[0].trim();

  if (primeraLinea.toLowerCase() !== selectedId.toLowerCase()) {

    validationSection.innerHTML =
      `<span style='color:red;'>❌ La primera línea debe ser "${selectedId}".</span>`;

    return;
  }

  validationSection.innerHTML =
    "<span style='color:green;'>✔ Alineacion correcta.</span>";

  // ✅ Habilitar envío
  btnEnviar.disabled = false;
}

//btnEnviar.addEventListener("click", enviarAApi);
btnEnviar.addEventListener("click", () => {
  document.getElementById("pinModal").style.display = "flex";
});

async function enviarAApi() {

  const texto = textareasht.value.trim();
  const equipo = dropdown.value;

  if (!equipo) {
    alert("Selecciona un equipo primero.");
    return;
  }

  // 🔒 Bloquear botón para evitar doble click
  btnEnviar.disabled = true;
  spinner.style.display = "block";
  resultado.innerHTML = "";

  const formData = new FormData();
  formData.append("alineacion", texto);
  formData.append("filename", equipo + "sht");

  try {

	const response = await fetch("https://superligalv.duckdns.org/api/alineacion", {
	  method: "POST",
	  body: formData
	});

    const data = await response.json();
    
    if (response.ok) {
	  console.log(data);
      /*resultado.innerHTML = `
        <div style="color:blue;">
          🚀 <b>Alineación enviada correctamente</b><br>
          📄 Archivo: ${data.archivo}<br>
          🔗 Ruta: <a href="/alineaciones/${data.archivo}" target="_blank">
                  Ver archivo
                 </a>
        </div>
      `;*/

    } else {

      resultado.innerHTML =
        `<span style="color:red;">❌ Error: ${data.error || "Error desconocido"}</span>`;
    }

  } catch (error) {

    resultado.innerHTML =
      "<span style='color:red;'>❌ Error de conexión con la API</span>";

  } finally {

    spinner.style.display = "none";
    // 🔓 Permitir validar nuevamente si quieren modificar
    btnEnviar.disabled = true;
  }
}

textareasht.addEventListener("input", () => {
  btnEnviar.disabled = true;
});

let equiposData = [];

// Cargar equipos desde JSON
fetch('./JS/teams.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('No se pudo cargar el JSON');
    }
    return response.json();
  })
  .then(equipos => {
    equiposData = equipos;

    equipos.forEach(e => {
      const option = document.createElement('option');
      option.value = e.id;
      option.textContent = e.team;
      dropdown.appendChild(option);
    });
  })
  .catch(error => {
    console.error('Error cargando equipos:', error);
  });


// Cuando el usuario selecciona equipo
/*dropdown.addEventListener('change', () => {

  const selectedId = dropdown.value;
  if (!selectedId) {
    textarea.value = "";
    return;
  }

  const equipo = equiposData.find(e => e.id === selectedId);

  if (!equipo || !equipo.dropbox_dir) {
    textarea.value = "No hay enlace disponible.";
    return;
  }

  textarea.value = "Cargando plantilla...";

  fetch(equipo.dropbox_dir)
    .then(response => {
      if (!response.ok) {
        throw new Error("No se pudo cargar la plantilla");
      }
      return response.text();
    })
    .then(data => {
      textarea.value = data;
    })
    .catch(error => {
      console.error("Error cargando plantilla:", error);
      textarea.value = "Error cargando plantilla.";
    });

});*/