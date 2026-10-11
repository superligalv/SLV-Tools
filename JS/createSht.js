(function(){
  "use strict";

  /* ---------- Configuración ----------
     Se puede sobrescribir sin tocar este archivo, definiendo antes de script.js:
       <script>window.TSM_CONFIG = { teamsUrl: "./JS/teams.json", sendUrl: "https://..." };</script>
     sendUrl: destino del envío (POST JSON {team, pin, teamsheet}). Vacío = envío desactivado. */
  var CONFIG = Object.assign({
    teamsUrl: "./JS/teams.json",
    sendUrl: ""
  }, window.TSM_CONFIG || {});

  /*
    NOTA DE IMPLEMENTACIÓN:
    El formato del bloque de alineación, suplentes y "PK:" está copiado del
    ejemplo de las capturas. El formato de las líneas de condiciones
    (TACTIC / REPOSITION / AGGRESSION) está deducido por analogía con el único
    ejemplo visible:
      SUB <fila_titular> <fila_suplente> <POS> IF MIN = 67
    Si la sintaxis real difiere, se ajusta en las funciones de los botones "Add".
  */

  var POSITIONS = ["", "GK", "DF", "DM", "MF", "AM", "FW"];
  var TOTAL_ROWS = 16; // 1-11 titulares, 12-16 suplentes

  var players = [];
  for (var i = 0; i < TOTAL_ROWS; i++) players.push({ pos: "", name: "" });

  var conditions = [];
  var roster = [];
  var rosterRaw = "";
  var rowRefs = [];
  var primaryMode = "validar";   // "validar" | "enviar"
  var validatedText = null;      // teamsheet que pasó la validación
  var teamsData = {};            // id (minúsculas) -> {team, dropbox_dir}
  var rosterReq = 0;             // evita que una carga lenta pise a otra más reciente
  var pendingAbbr = "";          // abreviatura cargada antes de que lleguen los equipos

  function $(id){ return document.getElementById(id); }
  function range(a, b){ var arr = []; for (var k = a; k <= b; k++) arr.push(k); return arr; }

  var titleText = $("titleText");
  var output = $("teamsheetOutput");

  // ---------- Sin persistencia ----------
  // La plantilla NO se guarda entre sesiones: se pega con "Load Roster" cada vez.
  // Se borran los datos que dejaron versiones anteriores en el navegador.
  function saveRoster(){}
  function loadRosterFromStorage(){
    try {
      localStorage.removeItem("tsm_roster");
      localStorage.removeItem("tsm_roster_raw");
    } catch(e){}
    roster = [];
    rosterRaw = "";
  }

  // ---------- Colores de posición (clases de positions.css) ----------
  var POS_CLASSES = ["gk", "df", "dm", "mf", "am", "fw"];
  function paintSelect(sel){
    POS_CLASSES.forEach(function(c){ sel.classList.remove(c); });
    if (sel.value) sel.classList.add(sel.value.toLowerCase());
  }

  // ---------- Filas de jugadores ----------
  function buildRow(rowIndex){
    var wrap = document.createElement("div");
    wrap.className = "p-row";

    var idx = document.createElement("span");
    idx.className = "idx";
    idx.textContent = rowIndex;
    wrap.appendChild(idx);

    var posSel = document.createElement("select");
    posSel.className = "pos-select";
    POSITIONS.forEach(function(p){
      var o = document.createElement("option");
      o.value = p; o.textContent = p;
      posSel.appendChild(o);
    });
    posSel.addEventListener("change", function(){
      players[rowIndex - 1].pos = posSel.value;
      refreshDynamic();
      renderTeamsheet();
    });
    wrap.appendChild(posSel);

    var nameInput = document.createElement("select");
    nameInput.className = "name-input";
    nameInput.addEventListener("change", function(){
      players[rowIndex - 1].name = nameInput.value;
      if (!players[rowIndex - 1].pos){
        var match = roster.filter(function(r){ return r.name === players[rowIndex - 1].name; })[0];
        if (match && match.pos){
          players[rowIndex - 1].pos = match.pos;
          posSel.value = match.pos;
        }
      }
      refreshDynamic();
      renderTeamsheet();
    });
    wrap.appendChild(nameInput);

    wrap._pos = posSel;
    wrap._name = nameInput;
    return wrap;
  }

  function buildAllRows(){
    $("startingEleven").innerHTML = "";
    $("substitutes").innerHTML = "";
    rowRefs = [];
    range(1, 11).forEach(function(r){
      var row = buildRow(r);
      $("startingEleven").appendChild(row);
      rowRefs[r - 1] = row;
    });
    range(12, 16).forEach(function(r){
      var row = buildRow(r);
      $("substitutes").appendChild(row);
      rowRefs[r - 1] = row;
    });
  }

  // ---------- Desplegables dinámicos ----------
  function optionLabel(rowIndex){
    var p = players[rowIndex - 1];
    return rowIndex + " - " + (p.name || "(vacío)") + (p.pos ? " [" + p.pos + "]" : "");
  }

  function fillSelect(sel, rows, includeBlank){
    var current = sel.value;
    sel.innerHTML = "";
    if (includeBlank){
      var b = document.createElement("option");
      b.value = ""; b.textContent = "";
      sel.appendChild(b);
    }
    rows.forEach(function(r){
      if (!players[r - 1].name) return;
      var o = document.createElement("option");
      o.value = r;
      o.textContent = optionLabel(r);
      sel.appendChild(o);
    });
    var stillThere = [].slice.call(sel.options).some(function(o){ return o.value === current; });
    if (stillThere) sel.value = current;
  }

  function refreshDynamic(){
    var names = roster.map(function(r){ return r.name; });
    players.forEach(function(p){ if (p.name && names.indexOf(p.name) === -1) names.push(p.name); });
    rowRefs.forEach(function(row, idx){
      var sel = row._name;
      sel.innerHTML = "";
      var blank = document.createElement("option");
      blank.value = ""; blank.textContent = "";
      sel.appendChild(blank);
      names.forEach(function(n){
        var o = document.createElement("option");
        o.value = n; o.textContent = n;
        sel.appendChild(o);
      });
      sel.value = players[idx].name || "";
      paintSelect(row._pos);
    });

    fillSelect($("pkSelect"), range(1, 16), true);
    fillSelect($("sub-off"), range(1, 11), true);
    fillSelect($("sub-on"), range(12, 16), true);
    fillSelect($("rp-player"), range(1, 16), true);
  }

  function fillPosSelect(sel){
    sel.innerHTML = "";
    ["GK", "DF", "DM", "MF", "AM", "FW"].forEach(function(p){
      var o = document.createElement("option");
      o.value = p; o.textContent = p;
      sel.appendChild(o);
    });
  }

  // ---------- Generación del teamsheet ----------
  function playerLine(rowIndex){
    var p = players[rowIndex - 1];
    if (!p.name) return null;
    return (p.pos ? p.pos + " " : "") + p.name;
  }

  function renderTeamsheet(){
    var lines = [];
    var abbr = $("abbrInput").value.trim();
    var tactic = $("tacticInput").value.trim() || "P";

    lines.push(abbr);
    lines.push(tactic);
    lines.push("");

    var starters = range(1, 11).map(playerLine).filter(Boolean);
    if (starters.length){ lines = lines.concat(starters); lines.push(""); }

    var subs = range(12, 16).map(playerLine).filter(Boolean);
    if (subs.length){ lines = lines.concat(subs); lines.push(""); }

    var pk = $("pkSelect").value;
    var agg = $("aggSelect").value;
    var hasPk = pk && players[pk - 1] && players[pk - 1].name;
    if (hasPk) lines.push("PK: " + players[pk - 1].name);
    if (agg) lines.push("AGG " + agg);
    if (hasPk || agg) lines.push("");

    if (conditions.length) lines = lines.concat(conditions);

    while (lines.length && lines[lines.length - 1] === "") lines.pop();

    output.value = lines.join("\n");
    titleText.textContent = abbr ? ("TSM - " + abbr) : "TSM Plus v3";

    if (primaryMode === "enviar" && output.value !== validatedText){
      setPrimaryMode("validar");
      $("validation").innerHTML = '<p class="msg warn">Has cambiado la alineación: vuelve a validarla antes de enviar.</p>';
    }
  }

  // ---------- Condiciones ----------
  function conditionSuffix(prefix){
    var parts = [];
    [["min", "MIN"], ["score", "SCORE"], ["shots", "SHOTS"]].forEach(function(k){
      var op = $(prefix + "-" + k[0] + "-op").value;
      var val = $(prefix + "-" + k[0] + "-val").value;
      if (op && val !== "") parts.push(k[1] + " " + op + " " + val);
    });
    if ($(prefix + "-yellow").value === "Yes") parts.push("YELLOW");
    if ($(prefix + "-red").value === "Yes") parts.push("RED");
    if ($(prefix + "-injured").value === "Yes") parts.push("INJURED");
    return parts.length ? " IF " + parts.join(" AND ") : "";
  }

  function clearConditionInputs(prefix){
    ["min-op", "min-val", "score-op", "score-val", "shots-op", "shots-val", "yellow", "red", "injured"].forEach(function(k){
      $(prefix + "-" + k).value = "";
    });
  }

  $("tc-add").addEventListener("click", function(){
    var tactic = $("tc-tactic").value.trim();
    if (!tactic){ alert("Elige una nueva táctica."); return; }
    conditions.push("TACTIC " + tactic + conditionSuffix("tc"));
    clearConditionInputs("tc");
    $("tc-tactic").value = "";
    renderTeamsheet();
  });

  $("sub-add").addEventListener("click", function(){
    var off = $("sub-off").value, on = $("sub-on").value, pos = $("sub-pos").value;
    if (!off || !on){ alert("Selecciona jugador de salida (Off) y de entrada (On)."); return; }
    conditions.push("SUB " + off + " " + on + " " + (pos || players[on - 1].pos || "") + conditionSuffix("sub"));
    clearConditionInputs("sub");
    renderTeamsheet();
  });
  $("sub-off").addEventListener("change", function(){
    var off = $("sub-off").value;
    if (off && players[off - 1].pos){
      $("sub-pos").value = players[off - 1].pos;
      paintSelect($("sub-pos"));
    }
  });

  $("rp-add").addEventListener("click", function(){
    var player = $("rp-player").value, pos = $("rp-pos").value;
    if (!player){ alert("Selecciona un jugador."); return; }
    conditions.push("REPOSITION " + player + " " + pos + conditionSuffix("rp"));
    clearConditionInputs("rp");
    renderTeamsheet();
  });

  $("ca-add").addEventListener("click", function(){
    var agg = $("ca-agg").value;
    if (!agg){ alert("Elige la nueva agresividad."); return; }
    conditions.push("AGG " + agg + conditionSuffix("ca"));
    clearConditionInputs("ca");
    $("ca-agg").value = "";
    renderTeamsheet();
  });

  // ---------- Botones principales ----------
  // ---------- Validar / Enviar ----------
  function escapeHtml(t){
    return String(t).replace(/[&<>"']/g, function(ch){
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function setPrimaryMode(mode){
    primaryMode = mode;
    var b = $("btnAction");
    b.textContent = (mode === "enviar") ? "Enviar" : "Validar";
    b.classList.toggle("send", mode === "enviar");
    b.classList.toggle("primary", mode !== "enviar");
  }

  // Reglas de validación (se pueden ampliar aquí)
  function validarAlineacion(){
    var errors = [];
    if (!$("abbrInput").value) errors.push("Selecciona el equipo en Abbreviation.");

    var firstRow = {};
    var gks = 0;
    for (var r = 1; r <= TOTAL_ROWS; r++){
      var p = players[r - 1];
      var starter = r <= 11;
      var label = starter ? "Titular " + r : "Suplente " + r;
      if (!p.name && !p.pos){
        if (starter) errors.push(label + ": falta jugador y posición.");
        continue;
      }
      if (!p.name) errors.push(label + ": falta el jugador.");
      if (!p.pos) errors.push(label + ": falta la posición.");
      if (p.name){
        if (firstRow[p.name]) errors.push(p.name + " está repetido (filas " + firstRow[p.name] + " y " + r + ").");
        else firstRow[p.name] = r;
        if (roster.length && !roster.some(function(x){ return x.name === p.name; })){
          errors.push(p.name + " no está en la plantilla cargada.");
        }
      }
      if (starter && p.pos === "GK") gks++;
    }
    if (gks !== 1) errors.push("Debe haber exactamente 1 GK entre los titulares (hay " + gks + ").");
    return errors;
  }

  function showValidation(errors){
    var box = $("validation");
    if (!errors.length){
      box.innerHTML = '<p class="msg ok">✔ Alineación correcta. Pulsa Enviar para confirmar con tu PIN.</p>';
    } else {
      box.innerHTML = "<ul>" + errors.map(function(e){ return "<li>❌ " + escapeHtml(e) + "</li>"; }).join("") + "</ul>";
    }
  }

  $("btnAction").addEventListener("click", function(){
    if (primaryMode === "enviar"){ openPin(); return; }
    renderTeamsheet();
    var errors = validarAlineacion();
    showValidation(errors);
    if (!errors.length){
      validatedText = output.value;
      setPrimaryMode("enviar");
    }
  });

  // ---------- Confirmación con PIN ----------
  function pinMsg(text, kind){
    var m = $("pinError");
    m.textContent = text || "";
    m.className = kind || "";
  }
  function openPin(){
    if (output.value !== validatedText){ setPrimaryMode("validar"); return; }
    $("pinHint").textContent = "Introduce tu PIN para enviar la alineación de " + $("abbrInput").value + ".";
    $("pinInput").value = "";
    pinMsg("");
    $("pinOk").disabled = false;
    $("pinModal").classList.add("show");
    $("pinInput").focus();
  }
  function closePin(){
    $("pinModal").classList.remove("show");
    $("pinInput").value = "";
  }

  function confirmSend(){
    var pin = $("pinInput").value.trim();
    if (!pin){ pinMsg("Introduce el PIN.", "bad"); return; }
    if (output.value !== validatedText){ closePin(); setPrimaryMode("validar"); return; }
    if (!CONFIG.sendUrl){
      pinMsg("El envío no está conectado todavía: falta definir sendUrl en la configuración.", "bad");
      return;
    }
    var team = $("abbrInput").value;
    $("pinOk").disabled = true;
    pinMsg("Enviando...", "info");
    fetch(CONFIG.sendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team: team, pin: pin, teamsheet: validatedText })
    }).then(function(res){
      if (res.status === 401 || res.status === 403) throw new Error("PIN incorrecto.");
      if (!res.ok) throw new Error("Error del servidor (" + res.status + ").");
      closePin();
      validatedText = null;
      setPrimaryMode("validar");
      $("validation").innerHTML = '<p class="msg ok">✔ Alineación de ' + escapeHtml(team) + ' enviada.</p>';
    }).catch(function(err){
      pinMsg(err && err.message ? err.message : "No se pudo enviar.", "bad");
    }).then(function(){
      $("pinOk").disabled = false;
    });
  }

  $("pinOk").addEventListener("click", confirmSend);
  $("pinCancel").addEventListener("click", closePin);
  $("pinInput").addEventListener("keydown", function(e){
    if (e.key === "Enter") confirmSend();
    if (e.key === "Escape") closePin();
  });

  $("btnDeleteConditional").addEventListener("click", function(){
    conditions.pop();
    renderTeamsheet();
  });

  function doClearAll(){
    for (var i = 0; i < TOTAL_ROWS; i++){
      players[i] = { pos: "", name: "" };
      rowRefs[i]._pos.value = "";
      rowRefs[i]._name.value = "";
    }
    conditions = [];
    $("abbrInput").value = "";
    pendingAbbr = "";
    validatedText = null;
    setPrimaryMode("validar");
    $("validation").innerHTML = "";
    $("tacticInput").value = "";
    $("aggSelect").value = "";
    output.value = "";
    titleText.textContent = "TSM Plus v3";
    refreshDynamic();
  }

  $("btnClearAll").addEventListener("click", function(){
    if (confirm("¿Vaciar todos los campos?")) doClearAll();
  });

  $("abbrInput").addEventListener("change", function(){
    renderTeamsheet();
    loadRosterFor($("abbrInput").value);
  });
  ["tacticInput", "pkSelect", "aggSelect"].forEach(function(id){
    $(id).addEventListener("change", renderTeamsheet);
  });

  function fillNumbers(sel, from, to){
    for (var n = from; n <= to; n++){
      var o = document.createElement("option");
      o.value = String(n); o.textContent = String(n);
      sel.appendChild(o);
    }
  }

  // ---------- Pestañas ----------
  document.querySelectorAll(".tab").forEach(function(tab){
    tab.addEventListener("click", function(){
      document.querySelectorAll(".tab").forEach(function(t){ t.classList.remove("active"); });
      document.querySelectorAll(".tab-content").forEach(function(c){ c.classList.remove("active"); });
      tab.classList.add("active");
      $("tab-" + tab.dataset.tab).classList.add("active");
    });
  });

  // ---------- Exportar ----------
  function exportTxt(){
    var text = output.value;
    if (!text){ alert("No hay teamsheet generado todavía."); return; }
    var blob = new Blob([text], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = ($("abbrInput").value.trim() || "teamsheet") + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  $("btnExport").addEventListener("click", exportTxt);

  // ---------- Modal: Load Roster / Load Teamsheet ----------
  var modalMode = null;

  function openModal(mode){
    modalMode = mode;
    $("modalOverlay").classList.add("show");
    if (mode === "roster"){
      $("modalTitle").textContent = "Load Roster";
      $("modalHint").textContent = "Pega la tabla de la plantilla tal como la exporta el juego (Name Age Nat St Tk Ps Sh ...). Los nombres se autocompletan en las filas y la posición se deduce de las habilidades St/Tk/Ps/Sh; puedes cambiarla a mano.";
      $("modalTextarea").value = rosterRaw;
    } else {
      $("modalTitle").textContent = "Load Teamsheet";
      $("modalHint").textContent = "Pega un teamsheet generado con este mismo formato para recuperarlo en el formulario.";
      $("modalTextarea").value = "";
    }
  }
  function closeModal(){
    $("modalOverlay").classList.remove("show");
    modalMode = null;
  }

  $("btnLoadRoster").addEventListener("click", function(){ openModal("roster"); });
  $("btnLoadTeamsheet").addEventListener("click", function(){ openModal("teamsheet"); });
  $("modalCancel").addEventListener("click", closeModal);

  function looksLikeRoster(text){
    return /^\s*Name\s+Age\s+Nat/im.test(text) || /^-{10,}\s*$/m.test(text);
  }
  function looksLikeTeamsheet(text){
    return /^PK:/im.test(text) || /^SUB\s+\d/im.test(text) ||
      (text.match(/^(GK|DF|DM|MF|AM|FW)\s+\S+\s*$/gim) || []).length >= 8;
  }

  $("modalOk").addEventListener("click", function(){
    var text = $("modalTextarea").value;
    if (!text.trim()){ closeModal(); return; }
    var mode = modalMode;
    if (mode === "teamsheet" && looksLikeRoster(text)) mode = "roster";
    else if (mode === "roster" && looksLikeTeamsheet(text)) mode = "teamsheet";

    if (mode === "roster"){
      var n = parseRoster(text);
      alert(n ? "Roster cargado: " + n + " jugadores. Ya aparecen en los desplegables de nombre."
              : "No he encontrado jugadores en ese texto.");
    } else {
      parseTeamsheet(text);
    }
    closeModal();
  });

  $("modalFile").addEventListener("change", function(e){
    var f = e.target.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function(){ $("modalTextarea").value = reader.result; };
    reader.readAsText(f);
    e.target.value = "";
  });

  function guessPosition(st, tk, ps, sh){
    if (st > Math.max(tk, ps, sh)) return "GK";
    if (sh > tk && sh > ps) return "FW";
    if (tk >= ps) return "DF";
    if (tk >= 9) return "DM";
    if (sh >= 11) return "AM";
    return "MF";
  }

  function parseRoster(text){
    var list = [];
    text.split(/\r?\n/).forEach(function(line){
      var t = line.trim();
      if (!t || /^-+$/.test(t) || /^name\s+age/i.test(t)) return;
      var parts = t.split(/\s+/);
      var n = parts.slice(3, 7).map(Number);
      if (parts.length >= 7 && n.every(function(x){ return !isNaN(x); })){
        list.push({ name: parts[0], pos: guessPosition(n[0], n[1], n[2], n[3]) });
      } else if (t.indexOf(",") > -1){
        var c = t.split(",");
        list.push({ pos: c[0].trim().toUpperCase(), name: c.slice(1).join(",").trim() });
      }
    });
    roster = list.filter(function(r){ return r.name; });
    rosterRaw = text;
    saveRoster();
    refreshDynamic();
    return roster.length;
  }

  function setRow(rowNumber, pos, name){
    players[rowNumber - 1] = { pos: pos, name: name };
    rowRefs[rowNumber - 1]._pos.value = pos;
    rowRefs[rowNumber - 1]._name.value = name;
  }

  function parseTeamsheet(text){
    var lines = text.split("\n").map(function(l){ return l.replace(/\r$/, ""); });
    var i = 0;
    function skipBlank(){ while (i < lines.length && lines[i].trim() === "") i++; }

    doClearAll();

    skipBlank();
    if (i < lines.length){ setAbbr(lines[i].trim()); i++; }
    skipBlank();
    if (i < lines.length){
      var t = lines[i].trim();
      $("tacticInput").value = ["P","A","C","N","L","E","D"].indexOf(t) > -1 ? t : "";
      i++;
    }

    var posRegex = /^(GK|DF|DM|MF|AM|FW)\s+(.+)$/;
    var starterRow = 1, subRow = 12, block = 1;
    var pkName = null;

    while (i < lines.length){
      var trimmed = lines[i].trim();
      i++;

      if (trimmed === ""){ if (block === 1 && starterRow > 1) block = 2; continue; }

      var m = trimmed.match(posRegex);
      if (m){
        if (block === 1 && starterRow <= 11) setRow(starterRow++, m[1], m[2].trim());
        else if (subRow <= 16) setRow(subRow++, m[1], m[2].trim());
        continue;
      }

      var am = trimmed.match(/^AGG\s+(\d+)$/i);
      if (am && !conditions.length){ $("aggSelect").value = am[1]; continue; }

      if (/^PK:/i.test(trimmed)){ pkName = trimmed.replace(/^PK:\s*/i, "").trim(); continue; }

      conditions.push(trimmed);
    }

    refreshDynamic();
    if (pkName){
      for (var r = 0; r < TOTAL_ROWS; r++){
        if (players[r].name === pkName){ $("pkSelect").value = String(r + 1); break; }
      }
    }
    renderTeamsheet();
  }

  // ---------- Equipos (teams.json) ----------
  function setAbbr(v){
    var sel = $("abbrInput"), found = "";
    [].slice.call(sel.options).forEach(function(o){
      if (o.value && o.value.toLowerCase() === v.toLowerCase()) found = o.value;
    });
    sel.value = found;
    pendingAbbr = found ? "" : v;
    if (found) loadRosterFor(found);
  }

  // Carga la plantilla del equipo desde su fichero, igual que "Load Roster"
  function loadRosterFor(id){
    var st = $("rosterStatus");
    var token = ++rosterReq;
    function status(text, kind){ st.textContent = text; st.className = "roster-status" + (kind ? " " + kind : ""); }
    if (!id){ status(""); return; }
    var t = teamsData[id.toLowerCase()];
    if (!t || !t.dropbox_dir){ status("No hay enlace de plantilla para " + id + ".", "bad"); return; }
    status("Cargando plantilla...");
    fetch(t.dropbox_dir).then(function(res){
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    }).then(function(text){
      if (token !== rosterReq) return;
      var n = parseRoster(text);
      if (!n){ status("El fichero de " + id + " no contiene jugadores.", "bad"); return; }
      status("Plantilla de " + id + " cargada: " + n + " jugadores.", "ok");
      if (primaryMode === "enviar"){
        setPrimaryMode("validar");
        $("validation").innerHTML = '<p class="msg warn">Ha cambiado la plantilla: vuelve a validar la alineación.</p>';
      }
    }).catch(function(err){
      if (token !== rosterReq) return;
      console.error("Error cargando plantilla:", err);
      status("No se pudo cargar la plantilla de " + id + ".", "bad");
    });
  }

  function loadTeams(){
    var sel = $("abbrInput");
    fetch(CONFIG.teamsUrl).then(function(res){
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function(teams){
      teams.forEach(function(t){
        if (!t || !t.id) return;
        var o = document.createElement("option");
        o.value = t.id;
        o.textContent = t.id;
        if (t.team) o.title = t.team;
        teamsData[String(t.id).toLowerCase()] = t;
        sel.appendChild(o);
      });
      if (pendingAbbr){ setAbbr(pendingAbbr); renderTeamsheet(); }
    }).catch(function(err){
      console.error("Error cargando equipos:", err);
      sel.options[0].textContent = "Error cargando equipos";
    });
  }

  // ---------- Inicio ----------
  buildAllRows();
  loadTeams();
  loadRosterFromStorage();
  fillNumbers($("aggSelect"), 1, 20);
  fillNumbers($("ca-agg"), 1, 20);
  fillPosSelect($("sub-pos"));
  fillPosSelect($("rp-pos"));
  ["sub-pos", "rp-pos"].forEach(function(id){
    var sel = $(id);
    paintSelect(sel);
    sel.addEventListener("change", function(){ paintSelect(sel); });
  });
  refreshDynamic();
})();

