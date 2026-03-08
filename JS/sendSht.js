const dropdown = document.getElementById('teamsDropdown');
const btnValidar = document.getElementById("btnValidar");
const textareasht = document.getElementById("shtData");
const validationSection = document.getElementById("validation");
const btnEnviar = document.getElementById("btnEnviar");
const spinner = document.getElementById("spinner");
const resultado = document.getElementById("resultado");

const modal = document.getElementById("pinModal");
const confirmPin = document.getElementById("confirmPin");
const cancelPin = document.getElementById("cancelPin");
const pinError = document.getElementById("pinError");
const tactic_7 = true;
let equiposData = [];
let pinActual = "";

/* =========================
   MODAL PIN
========================= */

cancelPin.onclick = () => {
  modal.style.display = "none";
  pinError.innerText = "";
};

confirmPin.onclick = () => {

  const pinInput = document.getElementById("teamPin").value.trim();

  if (!pinInput) {
    pinError.innerText = "Introduce el PIN";
    return;
  }

  pinActual = pinInput;

  modal.style.display = "none";
  pinError.innerText = "";

  enviarAApi();
};

function validarJugadoresDisponibles(lines){

  const titulares = lines.slice(2,13);
  const suplentes = lines.slice(13,18);

  const jugadores = [...titulares, ...suplentes].map(l => l.substring(3).trim());

  const errores = [];

  jugadores.forEach(j => {

    if(!jugadoresDisponibles.includes(j)){
      errores.push(`❌ ${j} no está disponible (lesión o sanción)`);
    }

  });

  return errores;
}

/* =========================
   VALIDAR PK
========================= */
function validarPK(lines){

  let pkIndex = lines.findIndex(l => l.startsWith("PK:"))

  if(pkIndex === -1){
    return {ok:false, error:"Falta la línea PK:"}
  }

  const tokens = lines[pkIndex].split(/\s+/)

  if(tokens.length < 2){
    return {ok:false, error:"PK sin jugador especificado"}
  }

  const pkPlayer = tokens.slice(1).join(" ").trim()

  /* jugadores de la alineación */

  const starters = lines.slice(2,13)
  const subs = lines.slice(13,18)

  const jugadores = [...starters, ...subs].map(l => l.substring(3).trim())

  if(!jugadores.includes(pkPlayer)){
    return {
      ok:false,
      error:`El lanzador de PK (${pkPlayer}) no está en la alineación`
    }
  }

  return {ok:true, player:pkPlayer, index:pkIndex}
}
/* =========================
   VALIDAR CONDICIONALES
========================= */
function validarCondicionales(lines){

  const validOrders = ["SUB","TACTIC","CHANGEPOS","CHANGEAGG","AGG"]
  const validConditions = ["MIN","SCORE","SHOTS","RED","YELLOW","INJURED"]
  const validSigns = ["=","<=",">=","=<","=>"]
  const validPos = ["GK","DF","DM","MF","AM","FW"]

  let errores = []

  lines.forEach((line,index)=>{

    const tokens = line.split(/\s+/)

    if(tokens.length === 0) return

    const order = tokens[0]

    if(!validOrders.includes(order)){
      errores.push(`❌ Línea ${index+1}: Orden desconocida (${order})`)
      return
    }

    if(order === "AGG"){
      const val = parseInt(tokens[1])

      if(isNaN(val) || val < 1 || val > 20){
        errores.push(`❌ Línea ${index+1}: AGG debe ser entre 1 y 20`)
      }

      return
    }

    const ifIndex = tokens.indexOf("IF")

    if(ifIndex === -1){
      errores.push(`❌ Línea ${index+1}: Falta IF`)
      return
    }

    const condType = tokens[ifIndex+1]

    if(!validConditions.includes(condType)){
      errores.push(`❌ Línea ${index+1}: Condición inválida (${condType})`)
      return
    }

    if(["MIN","SCORE","SHOTS"].includes(condType)){

      const sign = tokens[ifIndex+2]
      const value = tokens[ifIndex+3]

      if(!validSigns.includes(sign)){
        errores.push(`❌ Línea ${index+1}: Signo inválido (${sign})`)
      }

      if(isNaN(parseInt(value))){
        errores.push(`❌ Línea ${index+1}: Valor numérico inválido`)
      }
    }

    if(["RED","YELLOW","INJURED"].includes(condType)){

      const target = tokens[ifIndex+2]

      if(!target){
        errores.push(`❌ Línea ${index+1}: Falta posición o número`)
      }

      if(!validPos.includes(target) && isNaN(parseInt(target))){
        errores.push(`❌ Línea ${index+1}: Posición o número inválido`)
      }
    }

  })

  return errores
}
/* =========================
   VALIDAR JUGADORES
========================= */
function validarJugadores(){

  const text = document.getElementById("shtData").value.trim()

  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l !== "")

  if(lines.length < 18){
    return {ok:false, error:"Formato incompleto de alineación"}
  }

  const starters = lines.slice(2,13)
  const subs = lines.slice(13,18)

  const validPos = ["GK","DF","DM","MF","AM","FW"]

  let errors = []

  /* ---- validar titulares ---- */

  if(starters.length !== 11){
    errors.push("Debe haber exactamente 11 titulares")
  }

  starters.forEach((line,i)=>{

    const parts = line.split(/\s+/)
    const pos = parts[0]

    if(!validPos.includes(pos)){
      errors.push(`Posición inválida en titular ${i+1}: ${pos}`)
    }

  })

  /* ---- validar suplentes ---- */

  if(subs.length !== 5){
    errors.push("Debe haber exactamente 5 suplentes")
  }

  subs.forEach((line,i)=>{

    const parts = line.split(/\s+/)
    const pos = parts[0]

    if(!validPos.includes(pos)){
      errors.push(`Posición inválida en suplente ${i+1}: ${pos}`)
    }

  })

  if(errors.length > 0){
    return {ok:false, errors}
  }

  return {ok:true}
}
/* =========================
   VALIDAR ALINEACION
========================= */

btnValidar.addEventListener("click", validar);

function validar() {

  const contenido = textareasht.value.trim();
  const selectedId = dropdown.value;

  resultado.innerHTML = "";
  btnEnviar.disabled = true;

  let errores = [];
  let checks = [];

  if (contenido === "") {
    validationSection.innerHTML =
      "<span style='color:red;'>⚠ El textarea está vacío.</span>";
    return;
  }

  const lines = contenido
    .split("\n")
    .map(l => l.trim())
    .filter(l => l !== "");

  /* =========================
     VALIDAR NOMBRE EQUIPO
  ========================= */

  const primeraLinea = lines[0];

  if (primeraLinea.toLowerCase() !== selectedId.toLowerCase()) {

    errores.push(`❌ La primera línea debe ser "${selectedId}"`);

  } else {

    checks.push("✔ Nombre del equipo correcto");

  }

  /* =========================
     VALIDAR TACTICA
  ========================= */

  const resTactic = validarTactica();

  if (!resTactic.ok) {

    errores.push(`❌ ${resTactic.error}`);

  } else {

    checks.push(`✔ Táctica válida (${resTactic.tactic})`);

  }

  /* =========================
     VALIDAR JUGADORES
  ========================= */

  const validPos = ["GK","DF","DM","MF","AM","FW"];

  const starters = lines.slice(2,13);
  const subs = lines.slice(13,18);

  if (starters.length !== 11) {

    errores.push("❌ Debe haber exactamente 11 titulares");

  } else {

    checks.push("✔ 11 titulares");

  }

  if (subs.length !== 5) {

    errores.push("❌ Debe haber exactamente 5 suplentes");

  } else {

    checks.push("✔ 5 suplentes");

  }
    /* =========================
     VALIDAR DISPONIBLES
  ========================= */
const erroresDisponibilidad = validarJugadoresDisponibles(lines);

if(erroresDisponibilidad.length){

  errores.push(...erroresDisponibilidad);

}else{

  checks.push("✔ Todos los jugadores están disponibles");

}
  /* =========================
     VALIDAR POSICIONES
  ========================= */

  starters.forEach((line,i)=>{

    const parts = line.split(/\s+/);
    const pos = parts[0];

    if(!validPos.includes(pos)){
      errores.push(`❌ Posición inválida en titular ${i+1}: ${pos}`);
    }

  });

  subs.forEach((line,i)=>{

    const parts = line.split(/\s+/);
    const pos = parts[0];

    if(!validPos.includes(pos)){
      errores.push(`❌ Posición inválida en suplente ${i+1}: ${pos}`);
    }

  });

  if(errores.length === 0){
    checks.push("✔ Posiciones válidas");
  }

  /* =========================
     VALIDAR GK TITULAR
  ========================= */

  const gkTitulares = starters.filter(l => l.startsWith("GK")).length;

  if (gkTitulares !== 1) {

    errores.push("❌ Debe haber exactamente 1 portero titular");

  } else {

    checks.push("✔ 1 portero titular");

  }

  /* =========================
     VALIDAR JUGADORES DUPLICADOS
  ========================= */

  const jugadores = [...starters, ...subs].map(l => l.substring(3).trim());

  const setJugadores = new Set(jugadores);

  if (setJugadores.size !== jugadores.length) {

    errores.push("❌ Hay jugadores duplicados en la alineación");

  } else {

    checks.push("✔ Sin jugadores duplicados");

  }

  /* =========================
     SUPLENTES NO TITULARES
  ========================= */

  const titularesNombres = starters.map(l => l.substring(3).trim());

  subs.forEach(l => {

    const nombre = l.substring(3).trim();

    if (titularesNombres.includes(nombre)) {

      errores.push(`❌ ${nombre} está como titular y suplente`);

    }

  });

  if(!errores.some(e => e.includes("titular y suplente"))){
    checks.push("✔ Suplentes diferentes a titulares");
  }
/* =========================
   VALIDAR PK
========================= */

const resPK = validarPK(lines)

if(!resPK.ok){

  errores.push("❌ " + resPK.error)

}else{

  checks.push(`✔ Lanzador de PK válido (${resPK.player})`)

}
/* =========================
   VALIDAR CONDICIONALES
========================= */

const conditionalLines =  lines.slice(resPK.index + 1)

const erroresCond = validarCondicionales(conditionalLines)

if(erroresCond.length){

  errores.push(...erroresCond)

}else{

  checks.push("✔ Condicionales válidas")

}
  /* =========================
     RESULTADO
  ========================= */

  let html = "";

  if(checks.length){
    html += "<div style='color:green'>" + checks.join("<br>") + "</div>";
  }

  if(errores.length){
    html += "<div style='color:red;margin-top:10px'>" + errores.join("<br>") + "</div>";
  }

  validationSection.innerHTML = html;

  if(errores.length === 0){
    btnEnviar.disabled = false;
  }

}


/* =========================
   ABRIR MODAL PIN
========================= */

btnEnviar.addEventListener("click", () => {

  const equipo = dropdown.value;

  if (!equipo) {
    alert("Selecciona un equipo primero.");
    return;
  }

  document.getElementById("teamPin").value = "";
  modal.style.display = "flex";

});
/* =========================
   Validaciones
========================= */
/* TACTICA */
function validTactic(tactic){

  const valid = ["A","D","C","N","L","P","T"]

  if(valid.includes(tactic)) return true

  if(tactic_7 && tactic === "E") return true

  return false
}

function validarTactica(){

  const text = document.getElementById("shtData").value.trim()
  const lines = text.split("\n").map(l => l.trim()).filter(l => l !== "")

  if(lines.length < 2){
    return {ok:false, error:"Formato incorrecto"}
  }

  const tactic = lines[1]

  if(!validTactic(tactic)){
    return {ok:false, error:`Táctica inválida: ${tactic}`}
  }

  return {ok:true, tactic}
}

/* =========================
   ENVIAR A API
========================= */

async function enviarAApi() {

  const texto = textareasht.value.trim();
  const equipo = dropdown.value;

  if (!equipo) {
    alert("Selecciona un equipo primero.");
    return;
  }

  btnEnviar.disabled = true;
  spinner.style.display = "block";
  resultado.innerHTML = "";

  const formData = new FormData();
  formData.append("alineacion", texto);
  formData.append("equipo", equipo);
  formData.append("pin", pinActual);

  try {
    ///console.log(formData);
    const response = await fetch("https://superligalv.duckdns.org/api/alineacion", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
	//console.log(data);
    if (response.ok) {

      resultado.innerHTML = `
        <div style="color:green;">
          ✔ Alineación enviada correctamente
        </div>
      `;

    } else {

      resultado.innerHTML =
        `<span style="color:red;">❌ ${data.error || "Error desconocido"}</span>`;

    }

  } catch (error) {

    resultado.innerHTML =
      "<span style='color:red;'>❌ Error de conexión con la API</span>";

  } finally {

    spinner.style.display = "none";
    btnEnviar.disabled = true;

  }
}


/* =========================
   RESETEAR ENVIO SI CAMBIA TEXTO
========================= */

textareasht.addEventListener("input", () => {
  btnEnviar.disabled = true;
});


let jugadoresDisponibles = [];

function cargarPlantilla(dropboxUrl){

  return fetch(dropboxUrl)
    .then(response => {
      if(!response.ok){
        throw new Error("No se pudo cargar la plantilla");
      }
      return response.text();
    })
    .then(data => {

      jugadoresDisponibles = parsearPlantilla(data);

      return jugadoresDisponibles;

    })
    .catch(error => {
      console.error("Error cargando plantilla:", error);
      jugadoresDisponibles = [];
      throw error;
    });

}
/*
function parsearPlantilla(data){

  const lines = data.split("\n");

  const disponibles = [];

  lines.forEach(line => {

    line = line.trim();

    if(!line) return;

    const tokens = line.split(/\s+/);

    const pos = tokens[0];
    const nombre = tokens[1];

    if(!nombre) return;
    const inj = tokens[tokens.length - 3];
	const sus = tokens[tokens.length - 2]
    const estado = tokens.slice(2).join(" ");
    console.log(tokens.slice(2).join(" "));
    if(
      estado.includes("INJ") ||
      estado.includes("SUSP") ||
      estado.includes("OUT")
    ){
      return;
    }

    disponibles.push(nombre);

  });

  return disponibles;
}*/

function parsearPlantilla(data) {
  const lines = data.split("\n");
  const disponibles = [];
  const noDisponibles = [];

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    const tokens = line.split(/\s+/);

    //const pos = tokens[0];
    const nombre = tokens[0];

    if (!nombre) return;
    
    // Obtener valores
    const inj = parseInt(tokens[tokens.length - 3]) || 0;
    const sus = parseInt(tokens[tokens.length - 2]) || 0;
    
    // También podemos mantener el estado original si lo necesitas
    const estado = tokens.slice(2).join(" ");
    
    // Validar disponibilidad
    if (inj > 0 || sus > 0) {
      noDisponibles.push({
        nombre,
        pos,
        inj,
        sus,
        estado
      });
      return; // No disponible
    }

    // Jugador disponible
    disponibles.push(nombre);
  });

  console.log(`Jugadores disponibles: ${disponibles.length}`);
  console.log(`Jugadores NO disponibles: ${noDisponibles.length}`);
  if (noDisponibles.length > 0) {
    console.log('Detalle de no disponibles:', noDisponibles);
  }

  return disponibles;
}

/* =========================
   CARGAR EQUIPOS
========================= */

fetch('./JS/teams.json')
  .then(response => {

    if (!response.ok) {
      throw new Error('No se pudo cargar el JSON');
    }

    return response.json();

  })
  .then(equipos => {

    equiposData = equipos;

    equipos.forEach(e => {

      const option = document.createElement('option');
      option.value = e.id;
      option.textContent = e.team;

      dropdown.appendChild(option);

    });

  })
  .catch(error => {

    console.error('Error cargando equipos:', error);

  });
  
dropdown.addEventListener('change', async () => {

  const selectedId = dropdown.value;

  if (!selectedId) {
    jugadoresDisponibles = [];
    return;
  }

  const equipo = equiposData.find(e => e.id === selectedId);

  if (!equipo || !equipo.dropbox_dir) {
    return;
  }

  try {

    const data = await fetch(equipo.dropbox_dir);

    if (!data.ok) {
      throw new Error("No se pudo cargar la plantilla");
    }

    const text = await data.text();

    /* 👇 aquí guardamos los jugadores disponibles */
    jugadoresDisponibles = parsearPlantilla(text);

    console.log("Jugadores disponibles:", jugadoresDisponibles);

  } catch (error) {

    console.error("Error cargando plantilla:", error);
    jugadoresDisponibles = [];

  }

});