const grid = document.getElementById('teamsGrid');

// Cargar JSON desde archivo local
fetch('./JS/teams.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('No se pudo cargar el JSON');
    }
    return response.json();
  })
  .then(equipos => {
    equipos.forEach(e => {
      const button = document.createElement('button');
      button.classList.add('team-button');

      // Imagen placeholder
      const img = document.createElement('img');
      //img.src = `https://via.placeholder.com/150?text=${e.id.toUpperCase()}`;
	  img.src = `./images/flags/headerRund/${e.id}.png`;
      img.alt = e.id;

      const span = document.createElement('span');
      span.textContent = e.team;

      button.appendChild(img);
      button.appendChild(span);

      // Click abre archivo Dropbox
      button.addEventListener('click', () => {
        window.open(e.dropbox_dir, '_blank');
      });

      grid.appendChild(button);
    });
  })
  .catch(error => {
    console.error('Error cargando equipos:', error);
    grid.innerHTML = '<p>Error cargando los equipos.</p>';
  });
