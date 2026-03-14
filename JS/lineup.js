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
// CALCULAR FIT DEL JUGADOR PARA UNA POSICIÓN
// ===============================
function calcularFit(jugador, posicion) {
    const St = parseInt(jugador.St, 10) || 0;
    const Tk = parseInt(jugador.Tk, 10) || 0;
    const Ps = parseInt(jugador.Ps, 10) || 0;
    const Sh = parseInt(jugador.Sh, 10) || 0;
    
    switch(posicion) {
        case 'GK':
            return Math.min(100, Math.round((St / 20) * 100));
        case 'DF':
            return Math.min(100, Math.round(((Tk * 1.5 + Ps * 0.5) / 30) * 100));
        case 'DM':
            return Math.min(100, Math.round(((Tk + Ps) / 40) * 100));
        case 'MF':
            return Math.min(100, Math.round(((Ps * 1.5 + Tk * 0.5 + Sh * 0.5) / 50) * 100));
        case 'AM':
            return Math.min(100, Math.round(((Ps + Sh) / 40) * 100));
        case 'FW':
            return Math.min(100, Math.round(((Sh * 1.5 + Ps * 0.5) / 30) * 100));
        default:
            return 50;
    }
}

// ===============================
// OBTENER COLOR DEL FIT
// ===============================
function getFitColor(fit) {
    if (fit >= 80) return '#4CAF50'; // Verde
    if (fit >= 60) return '#8BC34A'; // Verde claro
    if (fit >= 40) return '#FFC107'; // Amarillo
    if (fit >= 20) return '#FF9800'; // Naranja
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
    initEventListeners();
    addResetButton();
    
    // Cargar equipo
    if (teamId) {
        cargarEquipo();
    } else {
        showTemporaryMessage('❌ No se especificó ID de equipo', 'error');
        // Cargar datos de ejemplo como fallback
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
            showTemporaryMessage('❌ Error cargando equipo', 'error');
            cargarDatosEjemplo();
        });
}

// ===============================
// PROCESAR ARCHIVO DE JUGADORES
// ===============================
function procesarArchivoJugadores(txt) {
    const lines = txt.trim().split('\n');
    const sep = lines.findIndex(l => l.includes('---'));
    const headersLine = sep >= 0 ? lines[0] : lines[0];
    const dataLines = sep >= 0 ? lines.slice(sep + 1) : lines.slice(1);
    const headers = headersLine.trim().split(/\s+/);

    allPlayers = dataLines
        .filter(l => l.trim() !== '')
        .map(line => {
            const values = line.trim().split(/\s+/);
            const jugador = {};
            headers.forEach((h, i) => jugador[h] = values[i] || '');
            
            // Añadir posición calculada
            jugador.posicionCalculada = determinarPosicion(jugador);
            
            // Añadir ID único si no tiene
            jugador.id = jugador.ID || `player_${Math.random().toString(36).substr(2, 9)}`;
            
            // Asegurar que Name existe
            jugador.Name = jugador.Name || `${jugador.posicionCalculada}_${jugador.id}`;
            
            return jugador;
        });

    console.log('Jugadores cargados:', allPlayers.length);
    showTemporaryMessage(`✅ ${allPlayers.length} jugadores cargados`, 'success');
    
    // Mostrar estado inicial
    showTeamStatus();
}

// ===============================
// CARGAR DATOS DE EJEMPLO (FALLBACK)
// ===============================
function cargarDatosEjemplo() {
    allPlayers = [
        { id: 1, Name: 'Courtois', St: '19', Tk: '3', Ps: '5', Sh: '2', posicionCalculada: 'GK' },
        { id: 2, Name: 'Ter Stegen', St: '18', Tk: '4', Ps: '6', Sh: '3', posicionCalculada: 'GK' },
        { id: 3, Name: 'Carvajal', St: '2', Tk: '16', Ps: '12', Sh: '5', posicionCalculada: 'DF' },
        { id: 4, Name: 'Alaba', St: '1', Tk: '15', Ps: '14', Sh: '6', posicionCalculada: 'DF' },
        { id: 5, Name: 'Militao', St: '2', Tk: '17', Ps: '8', Sh: '4', posicionCalculada: 'DF' },
        { id: 6, Name: 'Mendy', St: '1', Tk: '16', Ps: '10', Sh: '5', posicionCalculada: 'DF' },
        { id: 7, Name: 'Casemiro', St: '3', Tk: '17', Ps: '13', Sh: '7', posicionCalculada: 'DM' },
        { id: 8, Name: 'Modric', St: '2', Tk: '10', Ps: '18', Sh: '12', posicionCalculada: 'MF' },
        { id: 9, Name: 'Kroos', St: '1', Tk: '8', Ps: '19', Sh: '11', posicionCalculada: 'MF' },
        { id: 10, Name: 'Bellingham', St: '2', Tk: '12', Ps: '16', Sh: '14', posicionCalculada: 'AM' },
        { id: 11, Name: 'Vinicius', St: '1', Tk: '5', Ps: '13', Sh: '18', posicionCalculada: 'FW' },
        { id: 12, Name: 'Benzema', St: '2', Tk: '6', Ps: '15', Sh: '19', posicionCalculada: 'FW' },
    ];
    
    showTemporaryMessage('⚠️ Usando datos de ejemplo', 'warning');
    showTeamStatus();
}

// ===============================
// INICIALIZAR EVENT LISTENERS
// ===============================
function initEventListeners() {
    document.getElementById('overlay').addEventListener('click', closePanel);
    document.getElementById('closePanel').addEventListener('click', closePanel);
}

// ===============================
// INICIALIZAR EL CAMPO
// ===============================
function initField() {
    const field = document.getElementById('field');
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
// ACTUALIZAR DISPLAY DE POSICIÓN
// ===============================
function updatePositionDisplay(element, position, index) {
    const player = lineup[position][index];
    
    element.innerHTML = '';
    
    if (player) {
        const fit = calcularFit(player, position);
        element.className = 'position filled';
        element.innerHTML = `
            <span class="pos-label">${position}</span>
            <span class="player-name">${player.Name || player.name}</span>
            <span class="fit-indicator" style="background: ${getFitColor(fit)}; width: ${fit}%; height: 3px; margin-top: 4px; border-radius: 2px;"></span>
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
    subsContainer.innerHTML = '';
    
    for (let i = 0; i < limits.BENCH.count; i++) {
        const subDiv = document.createElement('div');
        subDiv.className = `sub-position ${substitutes[i] ? 'filled' : ''}`;
        subDiv.dataset.subIndex = i;
        
        if (substitutes[i]) {
            const player = substitutes[i];
            const fit = calcularFit(player, 'BENCH');
            subDiv.innerHTML = `
                ${player.Name || player.name}
                <span class="fit-indicator" style="background: ${getFitColor(fit)}; width: ${fit}%; height: 3px; margin-top: 4px; border-radius: 2px; display: block;"></span>
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
// MOSTRAR LISTA DE JUGADORES
// ===============================
function displayPlayersList(players, targetPosition) {
    const list = document.getElementById('playersList');
    list.innerHTML = '';
    
    if (players.length === 0) {
        list.innerHTML = '<div class="player-item" style="justify-content: center;">No hay jugadores disponibles</div>';
        return;
    }
    
    players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-item';
        
        // Calcular fit para la posición objetivo
        const fit = targetPosition !== 'SUB' ? calcularFit(player, targetPosition) : 50;
        
        div.innerHTML = `
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span class="player-name"><strong>${player.Name || player.name}</strong></span>
                    <span class="player-pos" style="background: ${getFitColor(fit)}; color: white; padding: 4px 8px; border-radius: 20px;">
                        ${player.posicionCalculada} | ${fit}%
                    </span>
                </div>
                <div style="display: flex; gap: 16px; font-size: 12px; color: #666; margin-bottom: 8px;">
                    <span>⚽ St: ${player.St || 0}</span>
                    <span>🛡️ Tk: ${player.Tk || 0}</span>
                    <span>📊 Ps: ${player.Ps || 0}</span>
                    <span>🎯 Sh: ${player.Sh || 0}</span>
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
    
    if (startersCount === 0 && subsCount === 0) {
        statusMessage = '👆 Selecciona jugadores para formar tu equipo';
        statusColor = '#2196F3';
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
        statusMessage = `📊 Equipo completo. Faltan ${limits.BENCH.max - subsCount} suplentes`;
        statusColor = '#ff9800';
    } else {
        statusMessage = '✅ ¡Equipo completo!';
        statusColor = '#4CAF50';
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
    container.insertBefore(statusDiv, container.firstChild);
}

// ===============================
// CERRAR PANEL
// ===============================
function closePanel() {
    document.getElementById('playersPanel').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
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
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-weight: bold;
        z-index: 2000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease;
        max-width: 90%;
        text-align: center;
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
        
        initField();
        initSubstitutes();
        closePanel();
        showTeamStatus();
        showTemporaryMessage('✅ Equipo reiniciado', 'success');
    }
}

// ===============================
// AÑADIR ANIMACIONES CSS
// ===============================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
    }
    
    @keyframes slideUp {
        from { opacity: 1; transform: translate(-50%, 0); }
        to { opacity: 0; transform: translate(-50%, -20px); }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .reset-btn {
        background: #f44336;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 50px;
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 20px;
        cursor: pointer;
        width: 100%;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        transition: all 0.3s;
        -webkit-tap-highlight-color: transparent;
    }
    
    .reset-btn:active {
        transform: scale(0.98);
        background: #d32f2f;
    }
    
    .fit-indicator {
        transition: width 0.3s ease;
    }
`;
document.head.appendChild(style);