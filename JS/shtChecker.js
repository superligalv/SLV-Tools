const listbox = document.getElementById('teamsList');
const textarea = document.getElementById('squadData');

let equiposData = []; // guardamos el JSON completo

// Cargar equipos
fetch('./JS/teams.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('No se pudo cargar el JSON');
    }
    return response.json();
  })
  .then(equipos => {
    equiposData = equipos; // guardamos referencia

    equipos.forEach(e => {
      const option = document.createElement('option');
      option.value = e.id;
      option.textContent = e.team;
      listbox.appendChild(option);
    });
  })
  .catch(error => {
    console.error('Error cargando equipos:', error);
    listbox.innerHTML = '<option>Error cargando equipos</option>';
  });


// Cuando se selecciona equipo
listbox.addEventListener('change', () => {

  const selectedId = listbox.value;
  if (!selectedId) return;

  // Buscar el objeto equipo en el JSON
  const equipo = equiposData.find(e => e.id === selectedId);

  if (!equipo || !equipo.dropbox_dir) {
    textarea.value = "No hay enlace de plantilla.";
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