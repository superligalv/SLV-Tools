const dropdown = document.getElementById('teamsDropdown');
const textarea = document.getElementById('squadData');

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
dropdown.addEventListener('change', () => {

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

});