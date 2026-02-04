// JSON de equipos (puedes reemplazarlo por fetch a un JSON externo si quieres)
const equipos = [
  { "id": "aja", "team": "Ajax", "dropbox_dir": "https://dl.dropboxusercontent.com/s/30knw09xzakgh3bv03zu1/aja.txt" },
  { "id": "atm", "team": "Atletico Madrid", "dropbox_dir": "https://dl.dropboxusercontent.com/s/0u0vih5iaoc7phiyxucd0/atm.txt" },
  { "id": "fcb", "team": "Barcelona", "dropbox_dir": "https://dl.dropboxusercontent.com/s/tghc4kt0p7zieellppjiv/fcb.txt" }
  // ...añade el resto de tu JSON aquí
];

const grid = document.getElementById('teamsGrid');

equipos.forEach(e => {
  const button = document.createElement('button');
  button.classList.add('team-button');

  // Imagen del equipo (placeholder, cambiar por logo real si tienes)
  const img = document.createElement('img');
  img.src = `https://via.placeholder.com/150?text=${e.id.toUpperCase()}`;
  img.alt = e.id;

  // Nombre del equipo debajo de la imagen
  const span = document.createElement('span');
  span.textContent = e.team;

  button.appendChild(img);
  button.appendChild(span);

  // Acción al hacer click: abre archivo de Dropbox en nueva pestaña
  button.addEventListener('click', () => {
    window.open(e.dropbox_dir, '_blank');
  });

  grid.appendChild(button);
});
