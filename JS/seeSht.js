const btnVer = document.getElementById("btnVer");
const pinModal = document.getElementById("pinModal");
const confirmPin = document.getElementById("confirmPin");
const dropdown = document.getElementById('teamsDropdown');

let equiposData = [];

fetch('./JS/teams.json')
  .then(response => response.json())
  .then(equipos => {

    equiposData = equipos;

    equipos.forEach(e => {

      const option = document.createElement('option');
      option.value = e.id;
      option.textContent = e.team;

      dropdown.appendChild(option);

    });

  });
btnVer.addEventListener("click", () => {

    const equipo = document.getElementById("teamsDropdown").value;

    if (!equipo) {
        alert("Selecciona un equipo");
        return;
    }

    pinModal.style.display = "block";
});

confirmPin.addEventListener("click", async () => {

    const equipo = document.getElementById("teamsDropdown").value;
    const pin = document.getElementById("teamPin").value;

    const formData = new FormData();

    formData.append("equipo", equipo);
    formData.append("pin", pin);

    try {

        const response = await fetch("/alineacion/ver", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            document.getElementById("pinError").textContent =
                data.error || "Error";
            return;
        }

        document.getElementById("shtData").value =
            data.alineacion;

        document.getElementById("resultado").innerHTML =
            "✅ Alineación cargada correctamente";

        pinModal.style.display = "none";
        document.getElementById("teamPin").value = "";

    } catch (err) {

        document.getElementById("resultado").innerHTML =
            "❌ Error de conexión";

    }
});
