// Funciones de edad
export function esSub21(jugador) {
  const age = parseInt(jugador.Age, 10);
  return !isNaN(age) && age <= 21;
}

export function esMayor30(jugador) {
  const age = parseInt(jugador.Age, 10);
  return !isNaN(age) && age >= 30;
}

// Función para obtener query param
export function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Función para crear tabla
export function crearTabla(jugadores, headers, containerEl) {
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
// Contadores y medias por posición
// =======================

// Porteros
export function contarPorteros(jugadores) {
  let maxSt = Math.max(...jugadores.map(j => parseInt(j.St,10)||0));
  return jugadores.filter(j => parseInt(j.St,10)===maxSt).length;
}

export function mediaPorteros(jugadores) {
  let maxSt = Math.max(...jugadores.map(j => parseInt(j.St,10)||0));
  let porteros = jugadores.filter(j => parseInt(j.St,10)===maxSt);
  if (!porteros.length) return 0;
  let sum = porteros.reduce((a,j)=>a + (parseInt(j.St,10)||0),0);
  return (sum / porteros.length).toFixed(2);
}

// Defensas
export function contarDFs(jugadores) {
  let maxTk = Math.max(...jugadores.map(j => parseInt(j.Tk,10)||0));
  return jugadores.filter(j => parseInt(j.Tk,10)===maxTk).length;
}

export function mediaDFs(jugadores) {
  let maxTk = Math.max(...jugadores.map(j => parseInt(j.Tk,10)||0));
  let dfs = jugadores.filter(j => parseInt(j.Tk,10)===maxTk);
  if (!dfs.length) return 0;
  let sum = dfs.reduce((a,j)=>a + (parseInt(j.Tk,10)||0),0);
  return (sum / dfs.length).toFixed(2);
}

// Delanteros
export function contarFWs(jugadores) {
  let maxSh = Math.max(...jugadores.map(j => parseInt(j.Sh,10)||0));
  return jugadores.filter(j => parseInt(j.Sh,10)===maxSh).length;
}

export function mediaFWs(jugadores) {
  let maxSh = Math.max(...jugadores.map(j => parseInt(j.Sh,10)||0));
  let fws = jugadores.filter(j => parseInt(j.Sh,10)===maxSh);
  if (!fws.length) return 0;
  let sum = fws.reduce((a,j)=>a + (parseInt(j.Sh,10)||0),0);
  return (sum / fws.length).toFixed(2);
}

// Mediocampistas
export function contarMediocampistas(jugadores) {
  let MF=0, DM=0, AM=0;
  jugadores.forEach(j=>{
    const ps=parseInt(j.Ps,10)||0;
    const tk=parseInt(j.Tk,10)||0;
    const sh=parseInt(j.Sh,10)||0;
    const maxVal = Math.max(ps, tk, sh);
    if(maxVal===ps){
      if(tk>=9) DM++;
      else if(sh>=9) AM++;
      else MF++;
    }
  });
  return { MF, DM, AM };
}

export function mediaMediocampistas(jugadores) {
  let MF_vals=[], DM_vals=[], AM_vals=[];
  jugadores.forEach(j=>{
    const ps=parseInt(j.Ps,10)||0;
    const tk=parseInt(j.Tk,10)||0;
    const sh=parseInt(j.Sh,10)||0;
    const maxVal = Math.max(ps, tk, sh);
    if(maxVal===ps){
      if(tk>=9) DM_vals.push(ps);
      else if(sh>=9) AM_vals.push(ps);
      else MF_vals.push(ps);
    }
  });
  const media = arr=>arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2) : 0;
  return {
    MF: media(MF_vals),
    DM: media(DM_vals),
    AM: media(AM_vals)
  };
}
