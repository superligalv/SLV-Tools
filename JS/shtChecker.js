const listbox = document.getElementById('teamsList');

fetch('./JS/teams.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('No se pudo cargar el JSON');
    }
    return response.json();
  })
  .then(equipos => {

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


// Evento cambio de selección
listbox.addEventListener('change', () => {
  const selectedId = listbox.value;
  if (selectedId) {
    window.location.href = `ver_equipo.html?id=${selectedId}`;
  }
});