const container = document.getElementById("teamsContainer");

fetch("../JS/teams.json")
.then(res => res.ok ? res.json() : Promise.reject("Error cargando teams.json"))
.then(teams => {
if (!teams.length) {
container.innerHTML = "No hay equipos.";
return;
}

```
let html = `
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Equipo</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
`;

teams.forEach(team => {
  html += `
    <tr>
	  <td>${team.id}</td>
      <td>${team.team}</td>
      <td>
        <a href="../ver_equipo.html?id=${team.id}" target="_blank">
          Ver
        </a>
      </td>
    </tr>
  `;
});

html += `
    </tbody>
  </table>
`;

container.innerHTML = html;
```

})
.catch(err => {
container.innerHTML = "Error cargando equipos";
console.error(err);
});
