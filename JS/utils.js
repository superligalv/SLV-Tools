
// Función para obtener query param
export function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
// Funciones de edad
export function esSub21(jugador) {
  const age = parseInt(jugador.Age, 10);
  return !isNaN(age) && age <= 21;
}

export function esMayor30(jugador) {
  const age = parseInt(jugador.Age, 10);
  return !isNaN(age) && age >= 30;
}

export function parsearTablaSalarios(texto) {
  const lineas = texto.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && !l.startsWith('numMedias'));

  return lineas.map(linea => {
    const [avg, sec, mon] = linea.split(';');
    return {
      avg: parseInt(avg, 10),
      sec: sec,
      mon: parseFloat(mon)
    };
  });
}

export function calcularSalarioTotal(jugadores) {
  return jugadores.reduce((total, j) => total + (j.salario || 0), 0);
}


export function calcularSalarioJugador(jugador, tablaSalarios) {
  const medias = obtenerMediasJugador(jugador);

  if (medias.length < 2) return 0;

  const mediaPrincipal = medias[0];
  const mediaSecundaria = medias[1];

  const tieneSecundaria = mediaSecundaria >= 8 ? "SI" : "NO";

  const fila = tablaSalarios.find(f =>
    f.avg === mediaPrincipal && f.sec === tieneSecundaria
  );

  return fila ? fila.mon : 0;
}

export function obtenerMediasJugador(jugador) {
  const medias = [
    parseInt(jugador.St, 10),
    parseInt(jugador.Tk, 10),
    parseInt(jugador.Ps, 10),
    parseInt(jugador.Sh, 10)
  ].filter(n => !isNaN(n));

  return medias.sort((a, b) => b - a); // mayor a menor
}

// Funciones de posicion
export function posicion(jugador) {
  const St = parseInt(jugador.St, 10);
  const Tk = parseInt(jugador.Tk, 10);
  const Ps = parseInt(jugador.Ps, 10);
  const Sh = parseInt(jugador.Sh, 10);
  
  // Encontrar el valor más alto
  const valores = { St, Tk, Ps, Sh };
  const maxValor = Math.max(St, Tk, Ps, Sh);
  
  // Determinar cuál es el más alto
  if (maxValor === St) {
    return "GK";
  }
  
  if (maxValor === Tk) {
    return "DF";
  }
  
  if (maxValor === Sh) {
    return "FW";
  }
  
  // Si Ps es el más alto (ya que no entró en los casos anteriores)
  if (maxValor === Ps) {
    // Verificar condiciones adicionales para Ps
    if (Tk > Sh && Tk >= 9) {
      return "DM";
    } else if (Sh > Tk && Sh >= 9) {
      return "AM";
    } else if (Sh < 9 && Tk < 9) {
      return "MF";
    } else {
      // Caso por defecto cuando Ps es el más alto
      return "MF";
    }
  }
  
  // Caso por defecto (no debería llegar aquí normalmente)
  return "position";
}

// Crear tabla de plantilla
export function crearTabla(jugadores, headers, containerEl) {
  containerEl.innerHTML = '<h3 style="text-align:center;margin-bottom:1rem;">Plantilla</h3>';
  const tableWrapper = document.createElement('div');
  tableWrapper.style.overflowX = 'auto';
  tableWrapper.style.marginTop = '1rem';

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';

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

  const tbody = document.createElement('tbody');
  jugadores.forEach((j, idx) => {
    const tr = document.createElement('tr');
	const posicionJugador = posicion(j).toLowerCase();
	// Añadir clase según la posición
	tr.classList.add(posicionJugador);
    //tr.style.background = idx % 2 === 0 ? '#f9f9f9' : '#fff';
    headers.forEach(h => {
      const td = document.createElement('td');
      td.textContent = j[h] || '';
      td.style.border = '1px solid #ccc';
      td.style.padding = '4px';
      td.style.fontSize = '12px';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  containerEl.appendChild(tableWrapper);
}

// =======================
// Conteos y medias definitivas
// =======================

// Porteros
export function porteros(jugadores) {
  const lista = jugadores.filter(j => {
    const st = parseInt(j.St, 10) || 0;
    const tk = parseInt(j.Tk, 10) || 0;
    const ps = parseInt(j.Ps, 10) || 0;
    const sh = parseInt(j.Sh, 10) || 0;

    return st > tk && st > ps && st > sh;
  });

  return { count: lista.length };
}

export function avgporteros(jugadores) {
  // Filtrar solo porteros (St es el valor más alto)
  const porteros = jugadores.filter(j => {
    const st = parseInt(j.St, 10) || 0;
    const tk = parseInt(j.Tk, 10) || 0;
    const ps = parseInt(j.Ps, 10) || 0;
    const sh = parseInt(j.Sh, 10) || 0;

    return st > tk && st > ps && st > sh;
  });
  
  // Si no hay porteros, retornar 0
  if (porteros.length === 0) return 0;
  
  // Calcular promedio de St de los porteros
  const sumaSt = porteros.reduce((total, j) => {
    return total + (parseInt(j.St, 10) || 0);
  }, 0);
  
  return parseFloat((sumaSt / defensas.length).toFixed(2));
}

// Defensas
export function defensas(jugadores) {
    const lista = jugadores.filter(j => {
    const st = parseInt(j.St, 10) || 0;
    const tk = parseInt(j.Tk, 10) || 0;
    const ps = parseInt(j.Ps, 10) || 0;
    const sh = parseInt(j.Sh, 10) || 0;

    return tk > st && tk > ps && tk > sh;
  });

  return { count: lista.length };
}


export function avgdefensas(jugadores) {
  // Filtrar solo porteros (St es el valor más alto)
  const defensas = jugadores.filter(j => {
    const st = parseInt(j.St, 10) || 0;
    const tk = parseInt(j.Tk, 10) || 0;
    const ps = parseInt(j.Ps, 10) || 0;
    const sh = parseInt(j.Sh, 10) || 0;

    return tk > st && tk > ps && tk > sh;
  });
  
  // Si no hay porteros, retornar 0
  if (defensas.length === 0) return 0;
  
  // Calcular promedio de St de los defensas
  const sumaTk = defensas.reduce((total, j) => {
    return total + (parseInt(j.Tk, 10) || 0);
  }, 0);
  
  return parseFloat((sumaTk / defensas.length).toFixed(2));
}

// Delanteros
export function delanteros(jugadores) {
    const lista = jugadores.filter(j => {
    const st = parseInt(j.St, 10) || 0;
    const tk = parseInt(j.Tk, 10) || 0;
    const ps = parseInt(j.Ps, 10) || 0;
    const sh = parseInt(j.Sh, 10) || 0;

    return sh > st && sh > ps && sh > tk;
  });
  
  return { count: lista.length };
}
 
export function avgdelanteros(jugadores) {
  // Filtrar solo porteros (St es el valor más alto)
  const delanteros = jugadores.filter(j => {
    const st = parseInt(j.St, 10) || 0;
    const tk = parseInt(j.Tk, 10) || 0;
    const ps = parseInt(j.Ps, 10) || 0;
    const sh = parseInt(j.Sh, 10) || 0;

    return sh > st && sh > ps && sh > tk;
  });
  
  // Si no hay porteros, retornar 0
  if (delanteros.length === 0) return 0;
  
  // Calcular promedio de St de los delanteros
  const sumaSh = delanteros.reduce((total, j) => {
    return total + (parseInt(j.Sh, 10) || 0);
  }, 0);
  
  return parseFloat((sumaSh / delanteros.length).toFixed(2));
}

// Mediocampistas
export function mediocampistas(jugadores) {
    const lista = jugadores.filter(j => {
    const st = parseInt(j.St, 10) || 0;
    const tk = parseInt(j.Tk, 10) || 0;
    const ps = parseInt(j.Ps, 10) || 0;
    const sh = parseInt(j.Sh, 10) || 0;

    return ps > st && ps > sh && ps > tk && tk < 9 && sh < 9;
  });
  
  return { count: lista.length };
}

export function avgmediocampistas(jugadores) {
  // Filtrar solo porteros (St es el valor más alto)
  const mediocampistas = jugadores.filter(j => {
    const st = parseInt(j.St, 10) || 0;
    const tk = parseInt(j.Tk, 10) || 0;
    const ps = parseInt(j.Ps, 10) || 0;
    const sh = parseInt(j.Sh, 10) || 0;

    return ps > st && ps > sh && ps > tk && tk < 9 && sh < 9;
  });
  
  // Si no hay porteros, retornar 0
  if (mediocampistas.length === 0) return 0;
  
  // Calcular promedio de St de los mediocampistas
  const sumaPs = mediocampistas.reduce((total, j) => {
    return total + (parseInt(j.Ps, 10) || 0);
  }, 0);
  
  return parseFloat((sumaPs / mediocampistas.length).toFixed(2));
}

// Mediocampistas
export function mediapuntas(jugadores) {
    const lista = jugadores.filter(j => {
    const st = parseInt(j.St, 10) || 0;
    const tk = parseInt(j.Tk, 10) || 0;
    const ps = parseInt(j.Ps, 10) || 0;
    const sh = parseInt(j.Sh, 10) || 0;

    return ps > st && ps > sh && ps > tk && sh > tk && sh > 8;
  });
  
  return { count: lista.length };
}



export function pivotes(jugadores) {
    const lista = jugadores.filter(j => {
    const st = parseInt(j.St, 10) || 0;
    const tk = parseInt(j.Tk, 10) || 0;
    const ps = parseInt(j.Ps, 10) || 0;
    const sh = parseInt(j.Sh, 10) || 0;

    return ps > st && ps > sh && ps > tk && tk > st && tk > 8;
  });
  
  return { count: lista.length };
}