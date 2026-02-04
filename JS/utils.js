// utils.js

// Obtener query param de la URL
export function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Crear tabla desde vector de objetos
export function crearTabla(jugadores, headers, containerEl) {
  const tableWrapper = document.createElement('div');
  tableWrapper.style.overflowX = 'auto';
  tableWrapper.style.maxHeight = '80vh';
  tableWrapper.style.marginTop = '1rem';

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';

  // Encabezado
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    th.style.border = '1px solid #ccc';
    th.style.padding = '6px';
    th.style.background = '#3498db';
    th.style.color = '#fff';
    th.style.fontSize = '12px';
    th.style.position = 'sticky';
    th.style.top = '0';
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  // Cuerpo
  const tbody = document.createElement('tbody');
  jugadores.forEach((j, idx) => {
    const tr = document.createElement('tr');
    tr.style.background = idx % 2 === 0 ? '#f9f9f9' : '#fff';
    headers.forEach(h => {
      const td = document.createElement('td');
      td.textContent = j[h];
      td.style.border = '1px solid #ccc';
      td.style.padding = '4px';
      td.style.fontSize = '12px';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  tableWrapper.appendChild(table);

  containerEl.innerHTML = '';
  containerEl.appendChild(tableWrapper);
}

// Función para comprobar si un jugador es sub21
export function esSub21(jugador) {
  const age = parseInt(jugador.Age, 10);
  return !isNaN(age) && age <= 21;
}

// Función para comprobar si un jugador es mayor o igual a 30
export function esMayor30(jugador) {
  const age = parseInt(jugador.Age, 10);
  return !isNaN(age) && age >= 30;
}
