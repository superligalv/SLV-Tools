// Función para obtener query string ?id=XXX
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const teamId = getQueryParam('id');

const teamNameEl = document.getElementById('teamName');
const teamContentEl = document.getElementById('teamContent');

if (!teamId) {
  teamNameEl.textContent = "Equipo no especificado";
  teamContentEl.textContent = "";
} else {
  // Cargar teams.json
  fetch('./JS/teams.json')
    .then(response => {
      if (!response.ok) throw new Error('No se pudo cargar teams.json');
      return response.json();
    })
    .then(equipos => {
      const team = equipos.find(e => e.id === teamId.toLowerCase());
      if (!team) {
        teamNameEl.textContent = "Equipo no encontrado";
        teamContentEl.textContent = "";
        return;
      }

      teamNameEl.textContent = team.team;

      // Cargar contenido del TXT de Dropbox
      fetch(team.dropbox_dir)
        .then(resp => {
          if (!resp.ok) throw new Error('No se pudo cargar el archivo del equipo');
          return resp.text();
        })
        .then(txt => {
          teamContentEl.textContent = txt;
        })
        .catch(err => {
          teamContentEl.textContent = "Error cargando contenido del equipo.";
          console.error(err);
        });
    })
    .catch(err => {
      teamNameEl.textContent = "Error cargando datos de equipos";
      teamContentEl.textContent = "";
      console.error(err);
    });
}
