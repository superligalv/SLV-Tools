const players = document.querySelectorAll(".player");
const positions = document.querySelectorAll(".position");

let draggedPlayer = null;

// Cuando empieza a arrastrar
players.forEach(player => {
  player.addEventListener("dragstart", () => {
    draggedPlayer = player;
  });
});

// Permitir soltar
positions.forEach(pos => {
  pos.addEventListener("dragover", e => {
    e.preventDefault();
  });

  pos.addEventListener("drop", () => {
    if (!draggedPlayer) return;

    // Si ya hay alguien en la posición, lo devolvemos al panel
    if (pos.firstChild && pos.firstChild.classList.contains("player")) {
      document.querySelector(".players-panel").appendChild(pos.firstChild);
    }

    pos.textContent = "";
    pos.appendChild(draggedPlayer);
    draggedPlayer = null;
  });
});