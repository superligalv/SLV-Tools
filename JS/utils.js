
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
    tr.style.background = idx % 2 === 0 ? '#f9f9f9' : '#fff';
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
  if (!jugadores.length) return { count: 0, media: 0 };
  const maxSt = Math.max(...jugadores.map(j => parseInt(j.St,10)||0));
  const porteros = jugadores.filter(j => parseInt(j.St,10) === maxSt);
  const sum = porteros.reduce((a,j)=>a + (parseInt(j.St,10)||0),0);
  return { count: porteros.length, media: porteros.length ? (sum/porteros.length).toFixed(2) : 0 };
}

// Defensas
export function defensas(jugadores) {
  if (!jugadores.length) return { count: 0, media: 0 };
  const maxTk = Math.max(...jugadores.map(j => parseInt(j.Tk,10)||0));
  const dfs = jugadores.filter(j => parseInt(j.Tk,10) === maxTk);
  const sum = dfs.reduce((a,j)=>a + (parseInt(j.Tk,10)||0),0);
  return { count: dfs.length, media: dfs.length ? (sum/dfs.length).toFixed(2) : 0 };
}

// Delanteros
export function delanteros(jugadores) {
  if (!jugadores.length) return { count:0, media:0 };
  const maxSh = Math.max(...jugadores.map(j => parseInt(j.Sh,10)||0));
  const fws = jugadores.filter(j => parseInt(j.Sh,10) === maxSh);
  const sum = fws.reduce((a,j)=>a + (parseInt(j.Sh,10)||0),0);
  return { count:fws.length, media:fws.length ? (sum/fws.length).toFixed(2) : 0 };
}

// Mediocampistas
export function mediocampistas(jugadores) {
  let MF=[], DM=[], AM=[];
  jugadores.forEach(j=>{
    const ps=parseInt(j.Ps,10)||0;
    const tk=parseInt(j.Tk,10)||0;
    const sh=parseInt(j.Sh,10)||0;
    const maxVal = Math.max(ps, tk, sh);
    if(maxVal===ps){
      if(tk>=9) DM.push(ps);
      else if(sh>=9) AM.push(ps);
      else MF.push(ps);
    }
  });
  const media = arr => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2) : 0;
  return {
    MF: { count: MF.length, media: media(MF) },
    DM: { count: DM.length, media: media(DM) },
    AM: { count: AM.length, media: media(AM) }
  };
}
