// Configuración de posiciones
const POSITIONS = {
    GK: { label: 'GK', min: 1, max: 1, count: 1 },
    DF: { label: 'DF', min: 2, max: 7, count: 7 },
    DM: { label: 'DM', min: 0, max: 3, count: 3 },
    MF: { label: 'MF', min: 0, max: 6, count: 6 },
    AM: { label: 'AM', min: 0, max: 3, count: 3 },
    FW: { label: 'FW', min: 1, max: 5, count: 5 }
};

const SUBSTITUTES = 5;
const TOTAL_STARTERS = 11; // 1 + (mínimos) pero pueden ser más hasta 25

// Datos de ejemplo
const PLAYERS = [
    { id: 1, name: 'Courtois', position: 'GK' },
    { id: 2, name: 'Ter Stegen', position: 'GK' },
    { id: 3, name: 'Carvajal', position: 'DF' },
    { id: 4, name: 'Alaba', position: 'DF' },
    { id: 5, name: 'Militao', position: 'DF' },
    { id: 6, name: 'Mendy', position: 'DF' },
    { id: 7, name: 'Rüdiger', position: 'DF' },
    { id: 8, name: 'Casemiro', position: 'DM' },
    { id: 9, name: 'Modric', position: 'MF' },
    { id: 10, name: 'Kroos', position: 'MF' },
    { id: 11, name: 'Valverde', position: 'MF' },
    { id: 12, name: 'Bellingham', position: 'AM' },
    { id: 13, name: 'Müller', position: 'AM' },
    { id: 14, name: 'Vinicius', position: 'FW' },
    { id: 15, name: 'Rodrygo', position: 'FW' },
    { id: 16, name: 'Benzema', position: 'FW' },
    { id: 17, name: 'Haaland', position: 'FW' },
    { id: 18, name: 'Mbappé', position: 'FW' },
    { id: 19, name: 'Pedri', position: 'MF' },
    { id: 20, name: 'Gavi', position: 'MF' },
    { id: 21, name: 'De Bruyne', position: 'AM' },
    { id: 22, name: 'Kimmich', position: 'DM' },
    { id: 23, name: 'Goretzka', position: 'DM' }
];

// Estado de la aplicación
let selectedPosition = null;
let lineup = {
    GK: Array(POSITIONS.GK.count).fill(null),
    DF: Array(POSITIONS.DF.count).fill(null),
    DM: Array(POSITIONS.DM.count).fill(null),
    MF: Array(POSITIONS.MF.count).fill(null),
    AM: Array(POSITIONS.AM.count).fill(null),
    FW: Array(POSITIONS.FW.count).fill(null)
};
let substitutes = Array(SUBSTITUTES).fill(null);

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    initField();
    initSubstitutes();
    initEventListeners();
    
    // Validar solo cuando sea necesario (cambios en el lineup)
    // Eliminamos el setInterval que causaba el mensaje molesto
});

// Inicializar event listeners
function initEventListeners() {
    document.getElementById('overlay').addEventListener('click', closePanel);
    document.getElementById('closePanel').addEventListener('click', closePanel);
}

// Inicializar el campo
function initField() {
    const field = document.getElementById('field');
    field.innerHTML = '';

    // Generar filas por cada posición
    for (const [pos, config] of Object.entries(POSITIONS)) {
        const row = document.createElement('div');
        row.className = `field-row ${pos.toLowerCase()}-row`;
        
        for (let i = 0; i < config.count; i++) {
            const positionDiv = createPositionElement(pos, i);
            row.appendChild(positionDiv);
        }
        
        field.appendChild(row);
    }
}

// Crear elemento de posición
function createPositionElement(position, index) {
    const div = document.createElement('div');
    div.className = `position empty`;
    div.dataset.position = position;
    div.dataset.index = index;
    
    updatePositionDisplay(div, position, index);
    
    div.addEventListener('click', () => openPlayerSelection(position, index));
    
    return div;
}

// Actualizar display de posición
function updatePositionDisplay(element, position, index) {
    const player = lineup[position][index];
    
    element.innerHTML = '';
    
    if (player) {
        element.className = 'position filled';
        element.innerHTML = `
            <span class="pos-label">${position}</span>
            <span class="player-name">${player.name}</span>
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

// Inicializar suplentes
function initSubstitutes() {
    const subsContainer = document.getElementById('substitutes');
    subsContainer.innerHTML = '';
    
    for (let i = 0; i < SUBSTITUTES; i++) {
        const subDiv = document.createElement('div');
        subDiv.className = `sub-position ${substitutes[i] ? 'filled' : ''}`;
        subDiv.dataset.subIndex = i;
        
        if (substitutes[i]) {
            subDiv.textContent = substitutes[i].name;
        } else {
            subDiv.textContent = `SUP ${i + 1}`;
        }
        
        subDiv.addEventListener('click', () => openPlayerSelection('SUB', i));
        subsContainer.appendChild(subDiv);
    }
}

// Abrir panel de selección de jugadores
function openPlayerSelection(position, index) {
    selectedPosition = { position, index };
    
    const panel = document.getElementById('playersPanel');
    const overlay = document.getElementById('overlay');
    const title = document.getElementById('panelTitle');
    
    title.textContent = `Seleccionar jugador para ${position}${index !== undefined ? ' #' + (index + 1) : ''}`;
    
    // Filtrar jugadores disponibles
    const availablePlayers = getAvailablePlayers(position);
    displayPlayersList(availablePlayers);
    
    panel.classList.add('active');
    overlay.classList.add('active');
}

// Obtener jugadores disponibles
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
    return PLAYERS.filter(player => {
        if (usedPlayers.has(player.id)) return false;
        
        // Validar límites por posición
        if (targetPosition !== 'SUB') {
            const currentCount = lineup[targetPosition].filter(p => p !== null).length;
            const maxCount = POSITIONS[targetPosition].max;
            
            // Si ya llegó al máximo, no permitir más
            if (currentCount >= maxCount) return false;
        }
        
        return true;
    });
}

// Mostrar lista de jugadores
function displayPlayersList(players) {
    const list = document.getElementById('playersList');
    list.innerHTML = '';
    
    if (players.length === 0) {
        list.innerHTML = '<div class="player-item" style="justify-content: center;">No hay jugadores disponibles</div>';
        return;
    }
    
    players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-item';
        div.innerHTML = `
            <span class="player-name">${player.name}</span>
            <span class="player-pos">${player.position}</span>
        `;
        
        div.addEventListener('click', () => selectPlayer(player));
        list.appendChild(div);
    });
}

// Seleccionar jugador
function selectPlayer(player) {
    if (!selectedPosition) return;
    
    const { position, index } = selectedPosition;
    
    // Validar que el jugador pueda jugar en esa posición
    if (position !== 'SUB' && player.position !== position) {
        showTemporaryMessage(`❌ Este jugador es ${player.position} y no puede jugar como ${position}`, 'error');
        return;
    }
    
    // Validar mínimos y máximos antes de asignar
    if (position !== 'SUB') {
        const validationError = validatePositionAssignment(position, player);
        if (validationError) {
            showTemporaryMessage(validationError, 'error');
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
    
    // Mostrar estado actual del equipo
    showTeamStatus();
}

// Validar asignación de posición
function validatePositionAssignment(position, player) {
    const currentCount = lineup[position].filter(p => p !== null).length;
    const newCount = currentCount + 1; // Contando el que vamos a asignar
    
    // Verificar máximos
    if (newCount > POSITIONS[position].max) {
        return `❌ No puedes tener más de ${POSITIONS[position].max} ${position}`;
    }
    
    return null; // No hay error
}

// Mostrar mensaje temporal (no persistente)
function showTemporaryMessage(message, type = 'info') {
    // Remover mensaje anterior si existe
    const oldMessage = document.querySelector('.temporary-message');
    if (oldMessage) oldMessage.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `temporary-message ${type}`;
    messageDiv.textContent = message;
    
    // Estilos para el mensaje temporal
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#f44336' : '#4CAF50'};
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
    
    // Eliminar después de 2 segundos
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        }
    }, 2000);
}

// Mostrar estado actual del equipo
function showTeamStatus() {
    // Remover mensaje de estado anterior
    const oldStatus = document.querySelector('.team-status');
    if (oldStatus) oldStatus.remove();
    
    // Calcular estadísticas
    const startersCount = Object.values(lineup).flat().filter(p => p !== null).length;
    const subsCount = substitutes.filter(p => p !== null).length;
    const totalPlayers = startersCount + subsCount;
    
    // Verificar mínimos requeridos
    const dfCount = lineup.DF.filter(p => p !== null).length;
    const fwCount = lineup.FW.filter(p => p !== null).length;
    const gkCount = lineup.GK.filter(p => p !== null).length;
    
    const missingDF = Math.max(0, POSITIONS.DF.min - dfCount);
    const missingFW = Math.max(0, POSITIONS.FW.min - fwCount);
    const missingGK = Math.max(0, POSITIONS.GK.min - gkCount);
    
    const totalMissing = missingDF + missingFW + missingGK;
    
    // Crear mensaje de estado
    const statusDiv = document.createElement('div');
    statusDiv.className = 'team-status';
    
    let statusMessage = '';
    let statusColor = '#ff9800'; // Naranja por defecto
    
    if (startersCount === 0 && subsCount === 0) {
        statusMessage = '👆 Comienza seleccionando jugadores';
        statusColor = '#2196F3'; // Azul
    } else if (totalMissing > 0) {
        statusMessage = `⚠️ Faltan: ${missingGK ? '1 POR ' : ''}${missingDF ? missingDF + ' DF ' : ''}${missingFW ? missingFW + ' FW' : ''}`;
        statusColor = '#ff9800'; // Naranja
    } else if (startersCount >= TOTAL_STARTERS && subsCount === SUBSTITUTES) {
        statusMessage = '✅ Equipo completo!';
        statusColor = '#4CAF50'; // Verde
    } else if (startersCount >= TOTAL_STARTERS) {
        statusMessage = `⚠️ Faltan ${SUBSTITUTES - subsCount} suplentes`;
        statusColor = '#ff9800'; // Naranja
    } else {
        statusMessage = `📊 Titulares: ${startersCount}/11 | Suplentes: ${subsCount}/5`;
        statusColor = '#2196F3'; // Azul
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
    
    // Insertar al principio del container
    const container = document.querySelector('.container');
    container.insertBefore(statusDiv, container.firstChild);
}

// Cerrar panel
function closePanel() {
    document.getElementById('playersPanel').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    selectedPosition = null;
}

// Función para resetear el lineup
function resetLineup() {
    if (confirm('¿Seguro que quieres reiniciar el equipo?')) {
        lineup = {
            GK: Array(POSITIONS.GK.count).fill(null),
            DF: Array(POSITIONS.DF.count).fill(null),
            DM: Array(POSITIONS.DM.count).fill(null),
            MF: Array(POSITIONS.MF.count).fill(null),
            AM: Array(POSITIONS.AM.count).fill(null),
            FW: Array(POSITIONS.FW.count).fill(null)
        };
        substitutes = Array(SUBSTITUTES).fill(null);
        
        // Re-inicializar todo
        initField();
        initSubstitutes();
        closePanel();
        showTeamStatus();
    }
}

// Añadir animaciones CSS adicionales
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .temporary-message {
        font-size: 14px;
        pointer-events: none;
    }
    
    .team-status {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);

// Añadir botón de reset al HTML
function addResetButton() {
    const container = document.querySelector('.container');
    const resetBtn = document.createElement('button');
    resetBtn.textContent = '🔄 Reiniciar Equipo';
    resetBtn.style.cssText = `
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
    `;
    
    resetBtn.addEventListener('click', resetLineup);
    resetBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        resetLineup();
    });
    
    container.insertBefore(resetBtn, container.firstChild);
}

// Llamar a la función después de que cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    addResetButton();
});