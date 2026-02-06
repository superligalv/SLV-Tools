const container = document.getElementById("teamsContainer");

// Usa la ruta correcta según tu estructura
fetch("../JS/teams.json")
  .then(res => {
    console.log("Response status:", res.status);
    console.log("Response headers:", res.headers.get("content-type"));
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - No se pudo cargar teams.json`);
    }
    
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn("Advertencia: La respuesta no es JSON. Tipo recibido:", contentType);
      // Intenta parsear de todas formas
    }
    
    return res.text(); // Primero obtenemos como texto
  })
  .then(text => {
    console.log("Respuesta recibida (primeros 500 chars):", text.substring(0, 500));
    
    try {
      const teams = JSON.parse(text);
      renderTeams(teams);
    } catch (e) {
      console.error("Error parseando JSON:", e);
      container.innerHTML = `
        <div style="color: red; padding: 20px; border: 1px solid red;">
          <h3>Error en el formato JSON</h3>
          <p>${e.message}</p>
          <pre>${text.substring(0, 200)}...</pre>
        </div>
      `;
    }
  })
  .catch(err => {
    console.error("Error completo:", err);
    container.innerHTML = `
      <div style="color: red; padding: 20px; border: 1px solid red;">
        <h3>Error cargando equipos</h3>
        <p>${err.message}</p>
        <p>Verifica la consola para más detalles.</p>
      </div>
    `;
  });

function renderTeams(teams) {
  if (!teams || !teams.length) {
    container.innerHTML = "<p>No hay equipos disponibles.</p>";
    return;
  }

  let html = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f2f2f2;">
		  <th style="border: 1px solid #ddd; padding: 8px;">LOGO</th>
          <th style="border: 1px solid #ddd; padding: 8px;">ID</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Equipo</th>
		  <th style="border: 1px solid #ddd; padding: 8px;">Jugadpres</th>
		  <th style="border: 1px solid #ddd; padding: 8px;">Salarios</th>
		  <th style="border: 1px solid #ddd; padding: 8px;">Potencial</th>
        </tr>
      </thead>
      <tbody>
  `;

  teams.forEach(team => {
    html += `
      <tr>
	    <td style="border: 1px solid #ddd; padding: 8px;"><img src="../images/flags/headerRund/${team.id}.png" alt="${team.id}"/></td>
        <td style="border: 1px solid #ddd; padding: 8px;">${team.id}</td>
        <td style="border: 1px solid #ddd; padding: 8px;"><a href="../ver_equipo.html?id=${team.id}" target="_blank" style="color: blue; text-decoration: none;">${team.team}</a></td>
        <td style="border: 1px solid #ddd; padding: 8px;">-</td>
		<td style="border: 1px solid #ddd; padding: 8px;">-</td>
		<td style="border: 1px solid #ddd; padding: 8px;">-</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
    <p style="margin-top: 20px;">Total equipos: ${teams.length}</p>
  `;

  container.innerHTML = html;
}