const dropdown = document.getElementById('teamsDropdown');
const btnValidar = document.getElementById("btnValidar");
const textareasht = document.getElementById("shtData");
const validationSection = document.getElementById("validation");

btnValidar.addEventListener("click", validar);

function validar() {

  const contenido = textareasht.value.trim();
  const selectedId = dropdown.value;

  // Validar si está vacío
  if (contenido === "") {
    validationSection.innerHTML = "<span style='color:red;'>⚠ El textarea está vacío.</span>";
    return;
  }

  // Primera línea del textarea
  const primeraLinea = contenido.split("\n")[0].trim();
  // Aquí luego puedes añadir más validaciones
  if (primeraLinea.toLowerCase() !== selectedId.toLowerCase()) {
    validationSection.innerHTML =
      `<span style='color:red;'>❌ La primera línea debe ser "${selectedId}" y actualmente es "${primeraLinea}".</span>`;
    return;
  }
  // Si no está vacío
  validationSection.innerHTML = "<span style='color:green;'>✔ Alineacion correcta.</span>";

  
}


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