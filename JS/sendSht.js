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

let equiposData = [];
let pinActual = "";

/* =========================
   MODAL PIN
========================= */

cancelPin.onclick = () => {
  modal.style.display = "none";
  pinError.innerText = "";
};

confirmPin.onclick = () => {

  const pinInput = document.getElementById("teamPin").value.trim();

  if (!pinInput) {
    pinError.innerText = "Introduce el PIN";
    return;
  }

  pinActual = pinInput;

  modal.style.display = "none";
  pinError.innerText = "";

  enviarAApi();
};


/* =========================
   VALIDAR ALINEACION
========================= */

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
    "<span style='color:green;'>✔ Alineación correcta.</span>";

  btnEnviar.disabled = false;
}


/* =========================
   ABRIR MODAL PIN
========================= */

btnEnviar.addEventListener("click", () => {

  const equipo = dropdown.value;

  if (!equipo) {
    alert("Selecciona un equipo primero.");
    return;
  }

  document.getElementById("teamPin").value = "";
  modal.style.display = "flex";

});


/* =========================
   ENVIAR A API
========================= */

async function enviarAApi() {

  const texto = textareasht.value.trim();
  const equipo = dropdown.value;

  if (!equipo) {
    alert("Selecciona un equipo primero.");
    return;
  }

  btnEnviar.disabled = true;
  spinner.style.display = "block";
  resultado.innerHTML = "";

  const formData = new FormData();
  formData.append("alineacion", texto);
  formData.append("equipo", equipo);
  formData.append("pin", pinActual);

  try {

    const response = await fetch("https://superligalv.duckdns.org/api/alineacion", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (response.ok) {

      resultado.innerHTML = `
        <div style="color:green;">
          ✔ Alineación enviada correctamente
        </div>
      `;

    } else {

      resultado.innerHTML =
        `<span style="color:red;">❌ ${data.error || "Error desconocido"}</span>`;

    }

  } catch (error) {

    resultado.innerHTML =
      "<span style='color:red;'>❌ Error de conexión con la API</span>";

  } finally {

    spinner.style.display = "none";
    btnEnviar.disabled = true;

  }
}


/* =========================
   RESETEAR ENVIO SI CAMBIA TEXTO
========================= */

textareasht.addEventListener("input", () => {
  btnEnviar.disabled = true;
});


/* =========================
   CARGAR EQUIPOS
========================= */

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