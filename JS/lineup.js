// ===============================
// VARIABLES GLOBALES
// ===============================
let selectedPosition = null;
let lineup = {
    GK: Array(1).fill(null),
    DF: Array(7).fill(null),
    DM: Array(3).fill(null),
    MF: Array(6).fill(null),
    AM: Array(3).fill(null),
    FW: Array(5).fill(null)
};
let substitutes = Array(5).fill(null);
let allPlayers = [];
let teamId = null;
let teamData = null;

// Configuración de límites
const limits = {
    GK: { min: 1, max: 1, count: 1 },
    DF: { min: 2, max: 7, count: 7 },
    DM: { min: 0, max: 3, count: 3 },
    MF: { min: 0, max: 6, count: 6 },
    AM: { min: 0, max: 3, count: 3 },
    FW: { min: 1, max: 5, count: 5 },
    BENCH: { min: 0, max: 5, count: 5 }
};

const MAX_STARTERS = 11;

// ===============================
// FUNCIÓN PARA OBTENER PARÁMETROS DE URL
// ===============================
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// ===============================
// FUNCIÓN POSICIÓN (basada en habilidades)
// ===============================
function determinarPosicion(jugador) {
    const St = parseInt(jugador.St, 10) || 0;
    const Tk = parseInt(jugador.Tk, 10) || 0;
    const Ps = parseInt(jugador.Ps, 10) || 0;
    const Sh = parseInt(jugador.Sh, 10) || 0;
    
    const maxValor = Math.max(St, Tk, Ps, Sh);
    
    if (maxValor === St) return "GK";
    if (maxValor === Tk) return "DF";
    if (maxValor === Sh) return "FW";
    
    if (Tk > Sh && Tk >= 9) return "DM";
    if (Sh > Tk && Sh >= 9) return "AM";
    
    return "MF";
}

// ===============================
// OBTENER COLOR DEL FIT
// ===============================
function getFitColor(fit) {
    const fitNum = parseInt(fit, 10) || 0;
    if (fitNum >= 80) return '#4CAF50'; // Verde
    if (fitNum >= 60) return '#8BC34A'; // Verde claro
    if (fitNum >= 40) return '#FFC107'; // Amarillo
    if (fitNum >= 20) return '#FF9800'; // Naranja
    return '#F44336'; // Rojo
}

// ===============================
// INICIALIZAR LA APLICACIÓN
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    // Obtener teamId de la URL
    teamId = getQueryParam('id');
    
    // Inicializar UI
    initField();
    initSubstitutes();
    initCondicionales(); // NUEVO: Inicializar sección de condicionales
    initEventListeners();
    addResetButton();
    addEnviarButton();
    
    // Cargar equipo
    if (teamId) {
        cargarEquipo();
    } else {
        showTemporaryMessage('❌ No se especificó ID de equipo', 'error');
        cargarDatosEjemplo();
    }
});

// ===============================
// CARGAR EQUIPO DESDE JSON
// ===============================
function cargarEquipo() {
    fetch('./JS/teams.json')
        .then(res => {
            if (!res.ok) throw new Error('Error cargando teams.json');
            return res.json();
        })
        .then(equipos => {
            const team = equipos.find(e => e.id === teamId.toLowerCase());
            if (!team) throw new Error('Equipo no encontrado');

            // Guardar datos del equipo
            teamData = team;

            // Actualizar nombre del equipo
            const teamNameEl = document.getElementById('teamName');
            if (teamNameEl) teamNameEl.textContent = team.team;

            // Actualizar logo
            const teamLogoEl = document.getElementById('teamLogo');
            if (teamLogoEl) {
                teamLogoEl.src = `./images/flags/headerRund/${team.id}.png`;
                teamLogoEl.alt = team.team;
                teamLogoEl.style.display = 'inline';
            }

            return fetch(team.dropbox_dir);
        })
        .then(resp => {
            if (!resp.ok) throw new Error('Error cargando archivo de jugadores');
            return resp.text();
        })
        .then(txt => {
            procesarArchivoJugadores(txt);
        })
        .catch(err => {
            console.error('Error:', err);
            showTemporaryMessage('❌ Error cargando equipo: ' + err.message, 'error');
            cargarDatosEjemplo();
        });
}

// ===============================
// PROCESAR ARCHIVO DE JUGADORES (formato TXT con columnas)
// ===============================
function procesarArchivoJugadores(txt) {
    const lines = txt.trim().split('\n');
    
    // Buscar la línea de separador (---)
    const sepIndex = lines.findIndex(l => l.includes('---'));
    
    if (sepIndex === -1) {
        console.error('Formato de archivo no válido: no se encontró separador ---');
        return;
    }
    
    // Las cabeceras están justo antes del separador
    const headersLine = lines[sepIndex - 1];
    const dataLines = lines.slice(sepIndex + 1).filter(l => l.trim() !== '');
    
    // Procesar cabeceras (pueden tener espacios variables)
    const headers = headersLine.trim().split(/\s+/);
    
    // Mapear índices de columnas importantes
    const nameIndex = headers.indexOf('Name');
    const injIndex = headers.indexOf('Inj');
    const susIndex = headers.indexOf('Sus');
    const fitIndex = headers.indexOf('Fit');
    
    console.log('Índices - Name:', nameIndex, 'Inj:', injIndex, 'Sus:', susIndex, 'Fit:', fitIndex);
    
    // Filtrar y procesar jugadores
    const jugadoresProcesados = [];
    const jugadoresDescartados = [];
    
    dataLines.forEach((line, lineNum) => {
        const values = line.trim().split(/\s+/);
        const jugador = {};
        
        // Asignar cada valor a su cabecera correspondiente
        headers.forEach((h, i) => {
            jugador[h] = values[i] || '';
        });
        
        // Verificar si está lesionado o sancionado
        const inj = parseInt(jugador.Inj, 10) || 0;
        const sus = parseInt(jugador.Sus, 10) || 0;
        
        if (inj > 0 || sus > 0) {
            // Jugador no disponible - lo guardamos para estadísticas
            jugadoresDescartados.push({
                nombre: jugador.Name || 'Desconocido',
                inj: inj,
                sus: sus,
                razon: inj > 0 && sus > 0 ? 'Lesionado y Sancionado' : (inj > 0 ? 'Lesionado' : 'Sancionado')
            });
            return; // No lo incluimos en la lista
        }
        
        // Añadir posición calculada
        jugador.posicionCalculada = determinarPosicion(jugador);
        
        // El fit es el último valor numérico (después de Fit)
        jugador.Fit = parseInt(jugador.Fit, 10) || 100;
        
        // Asegurar que tenemos un ID único
        jugador.id = jugador.Name || `player_${Math.random().toString(36).substr(2, 9)}`;
        
        jugadoresProcesados.push(jugador);
    });

    allPlayers = jugadoresProcesados;

    console.log('Jugadores cargados:', allPlayers.length);
    console.log('Jugadores descartados (lesionados/sancionados):', jugadoresDescartados.length);
    
    if (jugadoresDescartados.length > 0) {
        console.log('Jugadores no disponibles:', jugadoresDescartados);
        
        // Mostrar mensaje con los jugadores descartados
        let mensaje = `✅ ${allPlayers.length} jugadores disponibles. `;
        mensaje += `❌ ${jugadoresDescartados.length} no disponibles`;
        
        if (jugadoresDescartados.length <= 3) {
            // Si son pocos, mostramos sus nombres
            const nombres = jugadoresDescartados.map(j => j.nombre).join(', ');
            mensaje += `: ${nombres}`;
        }
        
        showTemporaryMessage(mensaje, 'warning');
    } else {
        showTemporaryMessage(`✅ ${allPlayers.length} jugadores disponibles`, 'success');
    }
    
    // Mostrar estado inicial
    showTeamStatus();
}

// ===============================
// CARGAR DATOS DE EJEMPLO (basado en el formato real)
// ===============================
function cargarDatosEjemplo() {
    // Simulamos los datos del ejemplo que mostraste
    allPlayers = [
        { Name: 'E_Martinez', Age: '33', Nat: 'arg', St: '20', Tk: '1', Ps: '1', Sh: '1', Ag: '20', Fit: '100', posicionCalculada: 'GK', id: 'E_Martinez' },
        { Name: 'Mike_Penders', Age: '20', Nat: 'bel', St: '14', Tk: '1', Ps: '1', Sh: '1', Ag: '20', Fit: '100', posicionCalculada: 'GK', id: 'Mike_Penders' },
        { Name: 'O_Zinchenko', Age: '29', Nat: 'ucr', St: '1', Tk: '16', Ps: '13', Sh: '7', Ag: '20', Fit: '100', posicionCalculada: 'DF', id: 'O_Zinchenko' },
        { Name: 'D_Carvajal', Age: '34', Nat: 'esp', St: '1', Tk: '16', Ps: '9', Sh: '5', Ag: '20', Fit: '100', posicionCalculada: 'DF', id: 'D_Carvajal' },
        { Name: 'Danilo', Age: '34', Nat: 'bra', St: '1', Tk: '16', Ps: '8', Sh: '4', Ag: '20', Fit: '91', posicionCalculada: 'DF', id: 'Danilo' },
        { Name: 'Mauro_Junior', Age: '26', Nat: 'bra', St: '1', Tk: '15', Ps: '9', Sh: '4', Ag: '20', Fit: '100', posicionCalculada: 'DF', id: 'Mauro_Junior' },
        { Name: 'Yarek', Age: '21', Nat: 'esp', St: '1', Tk: '15', Ps: '7', Sh: '4', Ag: '20', Fit: '96', posicionCalculada: 'DF', id: 'Yarek' },
        { Name: 'M_De_Sciglio', Age: '33', Nat: 'ita', St: '1', Tk: '15', Ps: '10', Sh: '4', Ag: '20', Fit: '96', posicionCalculada: 'DF', id: 'M_De_Sciglio' },
        { Name: 'D_Rugani', Age: '31', Nat: 'ita', St: '1', Tk: '15', Ps: '5', Sh: '2', Ag: '20', Fit: '96', posicionCalculada: 'DF', id: 'D_Rugani' },
        { Name: 'M_Locatelli', Age: '28', Nat: 'ita', St: '1', Tk: '11', Ps: '16', Sh: '1', Ag: '20', Fit: '100', posicionCalculada: 'DM', id: 'M_Locatelli' },
        { Name: 'S_Magassa', Age: '22', Nat: 'fra', St: '1', Tk: '12', Ps: '15', Sh: '1', Ag: '20', Fit: '96', posicionCalculada: 'DM', id: 'S_Magassa' },
        { Name: 'D_Szoboszlai', Age: '25', Nat: 'hun', St: '1', Tk: '4', Ps: '16', Sh: '9', Ag: '20', Fit: '91', posicionCalculada: 'AM', id: 'D_Szoboszlai' },
        { Name: 'Adrien_Rabiot', Age: '30', Nat: 'fra', St: '1', Tk: '7', Ps: '16', Sh: '5', Ag: '20', Fit: '96', posicionCalculada: 'MF', id: 'Adrien_Rabiot' },
        { Name: 'Fabio_Miretti', Age: '22', Nat: 'ita', St: '1', Tk: '5', Ps: '16', Sh: '6', Ag: '20', Fit: '100', posicionCalculada: 'MF', id: 'Fabio_Miretti' },
        { Name: 'N_Fagioli', Age: '25', Nat: 'ita', St: '1', Tk: '5', Ps: '14', Sh: '3', Ag: '20', Fit: '100', posicionCalculada: 'MF', id: 'N_Fagioli' },
        { Name: 'C_Nkunku', Age: '28', Nat: 'fra', St: '1', Tk: '1', Ps: '16', Sh: '11', Ag: '20', Fit: '96', posicionCalculada: 'AM', id: 'C_Nkunku' },
        { Name: 'Mohamed_Salah', Age: '33', Nat: 'egi', St: '1', Tk: '1', Ps: '12', Sh: '16', Ag: '20', Fit: '96', posicionCalculada: 'FW', id: 'Mohamed_Salah' },
        { Name: 'M_Rashford', Age: '28', Nat: 'ing', St: '1', Tk: '1', Ps: '11', Sh: '16', Ag: '20', Fit: '100', posicionCalculada: 'FW', id: 'M_Rashford' },
        { Name: 'Marco_Asensio', Age: '30', Nat: 'esp', St: '1', Tk: '1', Ps: '11', Sh: '16', Ag: '20', Fit: '100', posicionCalculada: 'FW', id: 'Marco_Asensio' },
        { Name: 'Valery', Age: '26', Nat: 'esp', St: '1', Tk: '1', Ps: '9', Sh: '15', Ag: '20', Fit: '100', posicionCalculada: 'FW', id: 'Valery' }
    ];
    
    showTemporaryMessage('⚠️ Usando datos de ejemplo', 'warning');
    showTeamStatus();
}

// ===============================
// INICIALIZAR EVENT LISTENERS
// ===============================
function initEventListeners() {
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('closePanel');
    
    if (overlay) overlay.addEventListener('click', closePanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
}

// ===============================
// INICIALIZAR EL CAMPO
// ===============================
function initField() {
    const field = document.getElementById('field');
    if (!field) return;
    
    field.innerHTML = '';

    // Generar filas por cada posición
    for (const [pos, config] of Object.entries(limits)) {
        if (pos === 'BENCH') continue;
        
        const row = document.createElement('div');
        row.className = `field-row ${pos.toLowerCase()}-row`;
        
        for (let i = 0; i < config.count; i++) {
            const positionDiv = createPositionElement(pos, i);
            row.appendChild(positionDiv);
        }
        
        field.appendChild(row);
    }
}

// ===============================
// CREAR ELEMENTO DE POSICIÓN
// ===============================
function createPositionElement(position, index) {
    const div = document.createElement('div');
    div.className = `position empty`;
    div.dataset.position = position;
    div.dataset.index = index;
    
    updatePositionDisplay(div, position, index);
    
    div.addEventListener('click', () => openPlayerSelection(position, index));
    
    return div;
}

// ===============================
// ACTUALIZAR DISPLAY DE POSICIÓN (usando el fit del jugador)
// ===============================
function updatePositionDisplay(element, position, index) {
    const player = lineup[position][index];
    
    element.innerHTML = '';
    
    if (player) {
        const fit = parseInt(player.Fit, 10) || 0;
        element.className = 'position filled';
        element.innerHTML = `
            <span class="pos-label">${position}</span>
            <span class="player-name">${player.Name || player.name}</span>
            <div class="fit-indicator" style="background: ${getFitColor(fit)}; width: ${fit}%; height: 3px; margin-top: 4px; border-radius: 2px;"></div>
            <span class="number">#${index + 1}</span>
        `;
    } else {
        element.className = 'position empty';
        element.innerHTML = `
            <span class="pos-label">${position}</span>
            <span class="player-name">Vacante</span>
            <span class="number">#${index + 1}</span>
        `;
    }
}

// ===============================
// INICIALIZAR SUPLENTES
// ===============================
function initSubstitutes() {
    const subsContainer = document.getElementById('substitutes');
    if (!subsContainer) return;
    
    subsContainer.innerHTML = '';
    
    for (let i = 0; i < limits.BENCH.count; i++) {
        const subDiv = document.createElement('div');
        subDiv.className = `sub-position ${substitutes[i] ? 'filled' : ''}`;
        subDiv.dataset.subIndex = i;
        
        if (substitutes[i]) {
            const player = substitutes[i];
            const fit = parseInt(player.Fit, 10) || 0;
            subDiv.innerHTML = `
                ${player.Name || player.name}
                <div class="fit-indicator" style="background: ${getFitColor(fit)}; width: ${fit}%; height: 3px; margin-top: 4px; border-radius: 2px;"></div>
            `;
        } else {
            subDiv.textContent = `SUP ${i + 1}`;
        }
        
        subDiv.addEventListener('click', () => openPlayerSelection('SUB', i));
        subsContainer.appendChild(subDiv);
    }
}

// ===============================
// ABRIR PANEL DE SELECCIÓN
// ===============================
function openPlayerSelection(position, index) {
    selectedPosition = { position, index };
    
    const panel = document.getElementById('playersPanel');
    const overlay = document.getElementById('overlay');
    const title = document.getElementById('panelTitle');
    
    if (!panel || !overlay || !title) return;
    
    title.textContent = `Seleccionar para ${position}${index !== undefined ? ' #' + (index + 1) : ''}`;
    
    const availablePlayers = getAvailablePlayers(position);
    displayPlayersList(availablePlayers, position);
    
    panel.classList.add('active');
    overlay.classList.add('active');
}

// ===============================
// OBTENER JUGADORES DISPONIBLES
// ===============================
function getAvailablePlayers(targetPosition) {
    const usedPlayers = new Set();
    
    // Recoger jugadores ya usados
    Object.values(lineup).forEach(posArray => {
        posArray.forEach(player => {
            if (player) usedPlayers.add(player.id);
        });
    });
    
    substitutes.forEach(player => {
        if (player) usedPlayers.add(player.id);
    });
    
    // Filtrar jugadores disponibles
    return allPlayers.filter(player => {
        if (usedPlayers.has(player.id)) return false;
        
        // Para posiciones específicas, validar que el jugador pueda jugar ahí
        if (targetPosition !== 'SUB') {
            const playerPos = player.posicionCalculada;
            
            // Permitir flexibilidad: un jugador puede jugar en posiciones relacionadas
            const posicionesPermitidas = {
                'GK': ['GK'],
                'DF': ['DF', 'DM'],
                'DM': ['DM', 'DF', 'MF'],
                'MF': ['MF', 'DM', 'AM'],
                'AM': ['AM', 'MF', 'FW'],
                'FW': ['FW', 'AM']
            };
            
            return posicionesPermitidas[targetPosition]?.includes(playerPos) || false;
        }
        
        return true;
    });
}

// ===============================
// MOSTRAR LISTA DE JUGADORES (con fit del archivo)
// ===============================
function displayPlayersList(players, targetPosition) {
    const list = document.getElementById('playersList');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (players.length === 0) {
        list.innerHTML = '<div class="player-item" style="justify-content: center;">No hay jugadores disponibles</div>';
        return;
    }
    
    players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-item';
        
        // Usar el fit del archivo
        const fit = parseInt(player.Fit, 10) || 0;
        
        div.innerHTML = `
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span class="player-name"><strong>${player.Name || player.name}</strong></span>
                    <span class="player-pos" style="background: ${getFitColor(fit)}; color: white; padding: 4px 8px; border-radius: 20px;">
                        ${player.posicionCalculada} | ${fit}%
                    </span>
                </div>
                <div style="display: flex; gap: 16px; font-size: 12px; color: #666; margin-bottom: 8px; flex-wrap: wrap;">
                    <span>⚽ St: ${player.St || 0}</span>
                    <span>🛡️ Tk: ${player.Tk || 0}</span>
                    <span>📊 Ps: ${player.Ps || 0}</span>
                    <span>🎯 Sh: ${player.Sh || 0}</span>
                    <span>🔋 Fit: ${player.Fit || 0}%</span>
                </div>
                <div style="width: 100%; height: 6px; background: #eee; border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; width: ${fit}%; background: ${getFitColor(fit)}; transition: width 0.3s;"></div>
                </div>
            </div>
        `;
        
        div.addEventListener('click', () => selectPlayer(player, targetPosition));
        list.appendChild(div);
    });
}

// ===============================
// SELECCIONAR JUGADOR
// ===============================
function selectPlayer(player, targetPosition) {
    if (!selectedPosition) return;
    
    const { position, index } = selectedPosition;
    
    // Validar que el jugador pueda jugar en esa posición
    if (position !== 'SUB') {
        const playerPos = player.posicionCalculada;
        const posicionesPermitidas = {
            'GK': ['GK'],
            'DF': ['DF', 'DM'],
            'DM': ['DM', 'DF', 'MF'],
            'MF': ['MF', 'DM', 'AM'],
            'AM': ['AM', 'MF', 'FW'],
            'FW': ['FW', 'AM']
        };
        
        if (!posicionesPermitidas[position]?.includes(playerPos)) {
            showTemporaryMessage(`❌ ${player.Name} (${playerPos}) no puede jugar como ${position}`, 'error');
            return;
        }
    }
    
    // Validar límites
    if (position !== 'SUB') {
        const currentCount = lineup[position].filter(p => p !== null).length;
        if (currentCount >= limits[position].max) {
            showTemporaryMessage(`❌ Máximo ${limits[position].max} jugadores en ${position}`, 'error');
            return;
        }
    } else {
        const currentSubs = substitutes.filter(p => p !== null).length;
        if (currentSubs >= limits.BENCH.max) {
            showTemporaryMessage(`❌ Máximo ${limits.BENCH.max} suplentes`, 'error');
            return;
        }
    }
    
    // Validar total titulares
    if (position !== 'SUB') {
        const totalStarters = Object.values(lineup).flat().filter(p => p !== null).length;
        if (totalStarters >= MAX_STARTERS && !lineup[position][index]) {
            showTemporaryMessage(`❌ Ya tienes ${MAX_STARTERS} titulares`, 'error');
            return;
        }
    }
    
    // Asignar jugador
    if (position === 'SUB') {
        substitutes[index] = player;
    } else {
        lineup[position][index] = player;
        updatePositionDisplay(
            document.querySelector(`[data-position="${position}"][data-index="${index}"]`),
            position,
            index
        );
    }
    
    // Actualizar suplentes
    initSubstitutes();
    
    // Cerrar panel
    closePanel();
    
    // Mostrar estado actual
    showTeamStatus();
    
    // Mostrar confirmación
    showTemporaryMessage(`✅ ${player.Name} añadido`, 'success');
}

// ===============================
// MOSTRAR ESTADO DEL EQUIPO
// ===============================
function showTeamStatus() {
    const oldStatus = document.querySelector('.team-status');
    if (oldStatus) oldStatus.remove();
    
    const startersCount = Object.values(lineup).flat().filter(p => p !== null).length;
    const subsCount = substitutes.filter(p => p !== null).length;
    
    // Verificar jugadores repetidos
    const usedPlayerIds = new Set();
    let hasDuplicates = false;
    
    // Comprobar titulares
    Object.values(lineup).flat().forEach(player => {
        if (player) {
            if (usedPlayerIds.has(player.id)) {
                hasDuplicates = true;
            }
            usedPlayerIds.add(player.id);
        }
    });
    
    // Comprobar suplentes
    substitutes.forEach(player => {
        if (player) {
            if (usedPlayerIds.has(player.id)) {
                hasDuplicates = true;
            }
            usedPlayerIds.add(player.id);
        }
    });
    
    // Verificar mínimos requeridos
    const gkCount = lineup.GK.filter(p => p !== null).length;
    const dfCount = lineup.DF.filter(p => p !== null).length;
    const fwCount = lineup.FW.filter(p => p !== null).length;
    
    const missingGK = Math.max(0, limits.GK.min - gkCount);
    const missingDF = Math.max(0, limits.DF.min - dfCount);
    const missingFW = Math.max(0, limits.FW.min - fwCount);
    
    const statusDiv = document.createElement('div');
    statusDiv.className = 'team-status';
    
    let statusMessage = '';
    let statusColor = '#2196F3';
    let isComplete = false;
    
    if (hasDuplicates) {
        statusMessage = '❌ Hay jugadores repetidos en el equipo';
        statusColor = '#f44336';
    } else if (missingGK > 0 || missingDF > 0 || missingFW > 0) {
        const faltan = [];
        if (missingGK > 0) faltan.push('1 POR');
        if (missingDF > 0) faltan.push(`${missingDF} DF`);
        if (missingFW > 0) faltan.push(`${missingFW} FW`);
        statusMessage = `⚠️ Faltan: ${faltan.join(' - ')}`;
        statusColor = '#ff9800';
    } else if (startersCount < MAX_STARTERS) {
        statusMessage = `📊 Titulares: ${startersCount}/${MAX_STARTERS} | Suplentes: ${subsCount}/${limits.BENCH.max}`;
        statusColor = '#2196F3';
    } else if (subsCount < limits.BENCH.max) {
        statusMessage = `📊 Faltan ${limits.BENCH.max - subsCount} suplentes`;
        statusColor = '#ff9800';
    } else {
        statusMessage = '✅ ¡Equipo completo! Ya puedes enviar la alineación';
        statusColor = '#4CAF50';
        isComplete = true;
    }
    
    statusDiv.style.cssText = `
        background: ${statusColor};
        color: white;
        padding: 12px 16px;
        border-radius: 12px;
        margin-bottom: 16px;
        text-align: center;
        font-weight: bold;
        font-size: 16px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        animation: fadeIn 0.3s ease;
    `;
    
    statusDiv.textContent = statusMessage;
    
    const container = document.querySelector('.container');
    if (container) {
        // Eliminar status anterior si existe
        const oldStatus = document.querySelector('.team-status');
        if (oldStatus) oldStatus.remove();
        
        // Insertar después del botón de enviar o al principio
        const enviarBtn = document.querySelector('.enviar-btn');
        if (enviarBtn) {
            enviarBtn.insertAdjacentElement('beforebegin', statusDiv);
        } else {
            container.insertBefore(statusDiv, container.firstChild);
        }
    }
    
    // Actualizar estado del botón de enviar
    updateEnviarButtonState(isComplete && !hasDuplicates);
}

// ===============================
// CERRAR PANEL
// ===============================
function closePanel() {
    const panel = document.getElementById('playersPanel');
    const overlay = document.getElementById('overlay');
    
    if (panel) panel.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    
    selectedPosition = null;
}

// ===============================
// MOSTRAR MENSAJE TEMPORAL
// ===============================
function showTemporaryMessage(message, type = 'info') {
    const oldMessage = document.querySelector('.temporary-message');
    if (oldMessage) oldMessage.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `temporary-message ${type}`;
    messageDiv.textContent = message;
    
    const colors = {
        error: '#f44336',
        success: '#4CAF50',
        warning: '#ff9800',
        info: '#2196F3'
    };
    
    messageDiv.style.cssText = `
        background: ${colors[type] || colors.info};
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        }
    }, 2000);
}

// ===============================
// AÑADIR BOTÓN DE RESET
// ===============================
function addResetButton() {
    const container = document.querySelector('.container');
    if (!container) return;
    
    // Verificar si ya existe
    if (document.querySelector('.reset-btn')) return;
    
    const resetBtn = document.createElement('button');
    resetBtn.className = 'reset-btn';
    resetBtn.textContent = '🔄 Reiniciar Equipo';
    resetBtn.addEventListener('click', resetLineup);
    container.insertBefore(resetBtn, container.firstChild);
}

// ===============================
// RESETEAR LINEUP
// ===============================
function resetLineup() {
    if (confirm('¿Seguro que quieres reiniciar el equipo?')) {
        lineup = {
            GK: Array(limits.GK.count).fill(null),
            DF: Array(limits.DF.count).fill(null),
            DM: Array(limits.DM.count).fill(null),
            MF: Array(limits.MF.count).fill(null),
            AM: Array(limits.AM.count).fill(null),
            FW: Array(limits.FW.count).fill(null)
        };
        substitutes = Array(limits.BENCH.count).fill(null);
        condicionales = []; // Limpiar condicionales
        
        initField();
        initSubstitutes();
        renderizarCondicionales(); // Actualizar lista de condicionales
        closePanel();
        showTeamStatus();
        updateEnviarButtonState(false);
        showTemporaryMessage('✅ Equipo reiniciado', 'success');
    }
}
// ===============================
// AÑADIR ESTAS VARIABLES GLOBALES NUEVAS
// ===============================
let enviarBtn = null; // Referencia al botón de enviar


// ===============================
// NUEVA FUNCIÓN: AÑADIR BOTÓN DE ENVIAR
// ===============================
function addEnviarButton() {
    const container = document.querySelector('.container');
    if (!container) return;
    
    // Verificar si ya existe
    if (document.querySelector('.enviar-btn')) return;
    
    enviarBtn = document.createElement('button');
    enviarBtn.className = 'enviar-btn';
    enviarBtn.textContent = '📤 Enviar Alineación';
    enviarBtn.disabled = true; // Comienza deshabilitado
    enviarBtn.addEventListener('click', enviarAlineacion);
    
    // Insertar después del botón de reset o al final
    const resetBtn = document.querySelector('.reset-btn');
    if (resetBtn) {
        resetBtn.insertAdjacentElement('afterend', enviarBtn);
    } else {
        container.appendChild(enviarBtn);
    }
}

// ===============================
// NUEVA FUNCIÓN: VERIFICAR SI EL EQUIPO ESTÁ COMPLETO
// ===============================
function isTeamComplete() {
    // Verificar que no haya jugadores repetidos
    const usedPlayerIds = new Set();
    
    // Verificar titulares (deben ser 11 exactamente)
    let totalStarters = 0;
    for (const [pos, players] of Object.entries(lineup)) {
        for (const player of players) {
            if (player) {
                totalStarters++;
                if (usedPlayerIds.has(player.id)) {
                    return false; // Jugador repetido
                }
                usedPlayerIds.add(player.id);
            }
        }
    }
    
    // Verificar que haya exactamente 11 titulares
    if (totalStarters !== MAX_STARTERS) return false;
    
    // Verificar suplentes (deben ser 5 exactamente)
    let totalSubs = 0;
    for (const player of substitutes) {
        if (player) {
            totalSubs++;
            if (usedPlayerIds.has(player.id)) {
                return false; // Jugador repetido
            }
            usedPlayerIds.add(player.id);
        }
    }
    
    // Verificar que haya exactamente 5 suplentes
    if (totalSubs !== limits.BENCH.count) return false;
    
    return true;
}

// ===============================
// NUEVA FUNCIÓN: ACTUALIZAR ESTADO DEL BOTÓN ENVIAR
// ===============================
function updateEnviarButtonState(enable) {
    if (enviarBtn) {
        enviarBtn.disabled = !enable;
        if (enable) {
            enviarBtn.classList.add('enabled');
            enviarBtn.style.background = '#4CAF50';
            enviarBtn.style.cursor = 'pointer';
        } else {
            enviarBtn.classList.remove('enabled');
            enviarBtn.style.background = '#cccccc';
            enviarBtn.style.cursor = 'not-allowed';
        }
    }
}

// ===============================
// NUEVA FUNCIÓN: ENVIAR ALINEACIÓN
// ===============================
function enviarAlineacion() {
    if (!isTeamComplete()) {
        showTemporaryMessage('❌ El equipo no está completo o tiene jugadores repetidos', 'error');
        return;
    }
    
    // Preparar datos para enviar
    const formData = {
        teamId: teamId,
        teamName: teamData ? teamData.team : 'Equipo sin nombre',
        timestamp: new Date().toISOString(),
        titulares: [],
        suplentes: [],
        condicionales: condicionales // Incluir condicionales
    };
    
    // Recoger titulares por posición
    for (const [pos, players] of Object.entries(lineup)) {
        players.forEach((player, index) => {
            if (player) {
                formData.titulares.push({
                    posicion: pos,
                    numero: index + 1,
                    nombre: player.Name || player.name,
                    fit: player.Fit,
                    stats: {
                        St: player.St,
                        Tk: player.Tk,
                        Ps: player.Ps,
                        Sh: player.Sh
                    }
                });
            }
        });
    }
    
    // Recoger suplentes
    substitutes.forEach((player, index) => {
        if (player) {
            formData.suplentes.push({
                numero: index + 1,
                nombre: player.Name || player.name,
                fit: player.Fit,
                stats: {
                    St: player.St,
                    Tk: player.Tk,
                    Ps: player.Ps,
                    Sh: player.Sh
                }
            });
        }
    });
    
    // Mostrar los datos en consola (para depuración)
    console.log('Datos a enviar:', formData);
    
    showTemporaryMessage('📤 Enviando alineación...', 'info');
    
    // Simular envío exitoso
    setTimeout(() => {
        showTemporaryMessage('✅ ¡Alineación enviada con éxito!', 'success');
    }, 1000);
}







// ===============================
// AÑADIR ESTAS VARIABLES GLOBALES NUEVAS
// ===============================
let condicionales = []; // Array para guardar los condicionales



// ===============================
// NUEVA FUNCIÓN: INICIALIZAR SECCIÓN DE CONDICIONALES
// ===============================
function initCondicionales() {
    const container = document.querySelector('.container');
    if (!container) return;
    
    // Verificar si ya existe
    if (document.querySelector('.condicionales-section')) return;
    
    // Crear la sección
    const section = document.createElement('div');
    section.className = 'condicionales-section';
    section.innerHTML = `
        <div class="condicionales-header">
            <h3>🔄 Condicionales</h3>
            <button class="add-cond-btn" id="addCondicional">+ Añadir Condicional</button>
        </div>
        <div class="condicionales-list" id="condicionalesList">
            <!-- Los condicionales se generarán dinámicamente -->
        </div>
    `;
    
    // Insertar después de los suplentes
    const substitutes = document.querySelector('.substitutes');
    if (substitutes) {
        substitutes.insertAdjacentElement('afterend', section);
    } else {
        container.appendChild(section);
    }
    
    // Añadir event listener al botón de añadir
    document.getElementById('addCondicional').addEventListener('click', abrirModalCondicional);
    
    // Renderizar condicionales existentes
    renderizarCondicionales();
}

// ===============================
// NUEVA FUNCIÓN: RENDERIZAR CONDICIONALES
// ===============================
function renderizarCondicionales() {
    const lista = document.getElementById('condicionalesList');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    if (condicionales.length === 0) {
        lista.innerHTML = '<div class="condicional-empty">No hay condicionales configurados</div>';
        return;
    }
    
    condicionales.forEach((cond, index) => {
        const condDiv = document.createElement('div');
        condDiv.className = 'condicional-item';
        
        // Formatear el texto del condicional
        let textoCond = '';
        if (cond.tipo === 'SUB') {
            textoCond = `SUB ${cond.minuto} ${cond.jugadorSale} ${cond.jugadorEntra} ${cond.posicion} IF ${cond.condicion.tipo} ${cond.condicion.operador} ${cond.condicion.valor}`;
        }
        
        condDiv.innerHTML = `
            <div class="condicional-texto">${textoCond}</div>
            <button class="delete-cond-btn" data-index="${index}">✕</button>
        `;
        
        lista.appendChild(condDiv);
    });
    
    // Añadir event listeners a los botones de borrar
    document.querySelectorAll('.delete-cond-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            borrarCondicional(index);
        });
    });
}

// ===============================
// NUEVA FUNCIÓN: ABRIR MODAL PARA AÑADIR CONDICIONAL
// ===============================
function abrirModalCondicional() {
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'cond-modal';
    modal.id = 'condModal';
    
    // Obtener lista de jugadores para los selects
    const jugadoresTitulares = obtenerJugadoresTitulares();
    const jugadoresSuplentes = obtenerJugadoresSuplentes();
    
    modal.innerHTML = `
        <div class="cond-modal-content">
            <div class="cond-modal-header">
                <h3>Nuevo Condicional</h3>
                <button class="close-modal-btn">✕</button>
            </div>
            <div class="cond-modal-body">
                <div class="cond-form-group">
                    <label>Tipo:</label>
                    <select id="condTipo" class="cond-select">
                        <option value="SUB">SUB (Sustitución)</option>
                    </select>
                </div>
                
                <div class="cond-form-group">
                    <label>Minuto:</label>
                    <input type="number" id="condMinuto" class="cond-input" min="1" max="120" value="67">
                </div>
                
                <div class="cond-form-group">
                    <label>Jugador que sale:</label>
                    <select id="condJugadorSale" class="cond-select">
                        <option value="">Seleccionar jugador</option>
                        ${jugadoresTitulares.map(j => `<option value="${j.numero}">${j.nombre} (${j.posicion} #${j.numero})</option>`).join('')}
                    </select>
                </div>
                
                <div class="cond-form-group">
                    <label>Jugador que entra:</label>
                    <select id="condJugadorEntra" class="cond-select">
                        <option value="">Seleccionar jugador</option>
                        ${jugadoresSuplentes.map(j => `<option value="${j.numero}">${j.nombre} (${j.posicion})</option>`).join('')}
                    </select>
                </div>
                
                <div class="cond-form-group">
                    <label>Posición:</label>
                    <select id="condPosicion" class="cond-select">
                        <option value="GK">GK - Portero</option>
                        <option value="DF">DF - Defensa</option>
                        <option value="DM">DM - Mediocentro defensivo</option>
                        <option value="MF">MF - Centrocampista</option>
                        <option value="AM">AM - Mediapunta</option>
                        <option value="FW">FW - Delantero</option>
                    </select>
                </div>
                
                <div class="cond-form-group">
                    <label>Condición:</label>
                    <div class="cond-condition-row">
                        <select id="condTipoCondicion" class="cond-select-small">
                            <option value="MIN">MIN (Minuto)</option>
                            <option value="SCORE">SCORE (Resultado)</option>
                        </select>
                        <select id="condOperador" class="cond-select-small">
                            <option value="=">=</option>
                            <option value=">=">>=</option>
                            <option value="<="><=</option>
                            <option value=">">></option>
                            <option value="<"><</option>
                        </select>
                        <input type="number" id="condValor" class="cond-input-small" value="67">
                    </div>
                </div>
            </div>
            <div class="cond-modal-footer">
                <button class="cancel-cond-btn">Cancelar</button>
                <button class="save-cond-btn">Guardar Condicional</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners del modal
    modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.cancel-cond-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.save-cond-btn').addEventListener('click', guardarCondicional);
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ===============================
// NUEVA FUNCIÓN: OBTENER JUGADORES TITULARES
// ===============================
function obtenerJugadoresTitulares() {
    const titulares = [];
    let numero = 1;
    
    for (const [pos, players] of Object.entries(lineup)) {
        players.forEach((player, index) => {
            if (player) {
                titulares.push({
                    numero: numero,
                    nombre: player.Name || player.name,
                    posicion: pos,
                    index: index
                });
                numero++;
            }
        });
    }
    
    return titulares;
}

// ===============================
// NUEVA FUNCIÓN: OBTENER JUGADORES SUPLENTES
// ===============================
function obtenerJugadoresSuplentes() {
    const suplentes = [];
    
    substitutes.forEach((player, index) => {
        if (player) {
            suplentes.push({
                numero: index + 1,
                nombre: player.Name || player.name,
                posicion: player.posicionCalculada
            });
        }
    });
    
    return suplentes;
}

// ===============================
// NUEVA FUNCIÓN: GUARDAR CONDICIONAL
// ===============================
function guardarCondicional() {
    const tipo = document.getElementById('condTipo').value;
    const minuto = parseInt(document.getElementById('condMinuto').value, 10);
    const jugadorSale = document.getElementById('condJugadorSale').value;
    const jugadorEntra = document.getElementById('condJugadorEntra').value;
    const posicion = document.getElementById('condPosicion').value;
    const tipoCondicion = document.getElementById('condTipoCondicion').value;
    const operador = document.getElementById('condOperador').value;
    const valor = document.getElementById('condValor').value;
    
    // Validaciones
    if (!jugadorSale) {
        showTemporaryMessage('❌ Debes seleccionar un jugador que sale', 'error');
        return;
    }
    
    if (!jugadorEntra) {
        showTemporaryMessage('❌ Debes seleccionar un jugador que entra', 'error');
        return;
    }
    
    if (jugadorSale === jugadorEntra) {
        showTemporaryMessage('❌ El jugador que sale no puede ser el mismo que entra', 'error');
        return;
    }
    
    // Crear objeto condicional
    const nuevoCondicional = {
        tipo: tipo,
        minuto: minuto,
        jugadorSale: jugadorSale,
        jugadorEntra: jugadorEntra,
        posicion: posicion,
        condicion: {
            tipo: tipoCondicion,
            operador: operador,
            valor: tipoCondicion === 'MIN' ? parseInt(valor, 10) : parseFloat(valor)
        }
    };
    
    // Añadir a la lista
    condicionales.push(nuevoCondicional);
    
    // Cerrar modal y renderizar
    document.getElementById('condModal').remove();
    renderizarCondicionales();
    
    showTemporaryMessage('✅ Condicional añadido correctamente', 'success');
}

// ===============================
// NUEVA FUNCIÓN: BORRAR CONDICIONAL
// ===============================
function borrarCondicional(index) {
    if (confirm('¿Seguro que quieres eliminar este condicional?')) {
        condicionales.splice(index, 1);
        renderizarCondicionales();
        showTemporaryMessage('✅ Condicional eliminado', 'success');
    }
}

