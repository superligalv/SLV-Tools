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
    
    // Actualizar validación cada vez que cambia el lineup
    setInterval(validateLineup, 500);
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
            
            // Validar mínimos por posición
            if (targetPosition === 'DF') {
                const dfCount = lineup.DF.filter(p => p !== null).length;
                if (dfCount >= POSITIONS.DF.max) return false;
            }
            if (targetPosition === 'FW') {
                const fwCount = lineup.FW.filter(p => p !== null).length;
                if (fwCount >= POSITIONS.FW.max) return false;
            }
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
        alert(`Este jugador es ${player.position} y no puede jugar como ${position}`);
        return;
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
}

// Cerrar panel
function closePanel() {
    document.getElementById('playersPanel').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    selectedPosition = null;
}

// Validar lineup completo
function validateLineup() {
    const validationDiv = document.createElement('div');
    validationDiv.className = 'validation-message';
    
    // Verificar mínimo de DF
    const dfCount = lineup.DF.filter(p => p !== null).length;
    if (dfCount < POSITIONS.DF.min) {
        validationDiv.textContent = `❌ Faltan ${POSITIONS.DF.min - dfCount} defensores`;
    }
    // Verificar mínimo de FW
    else {
        const fwCount = lineup.FW.filter(p => p !== null).length;
        if (fwCount < POSITIONS.FW.min) {
            validationDiv.textContent = `❌ Faltan ${POSITIONS.FW.min - fwCount} delanteros`;
        } else {
            validationDiv.textContent = '✅ Lineup válido';
            validationDiv.style.background = '#4CAF50';
        }
    }
    
    // Verificar máximos
    if (lineup.DM.filter(p => p !== null).length > POSITIONS.DM.max) {
        validationDiv.textContent = '❌ Demasiados mediocentros defensivos';
        validationDiv.style.background = '#ff9800';
    }
    if (lineup.AM.filter(p => p !== null).length > POSITIONS.AM.max) {
        validationDiv.textContent = '❌ Demasiados mediapuntas';
        validationDiv.style.background = '#ff9800';
    }
    
    // Remover mensaje anterior
    const oldMessage = document.querySelector('.validation-message');
    if (oldMessage) oldMessage.remove();
    
    // Insertar nuevo mensaje
    const field = document.querySelector('.field');
    if (field) {
        field.parentNode.insertBefore(validationDiv, field);
    }
}

// Función para resetear el lineup (útil para pruebas)
function resetLineup() {
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
}

// Función para exportar lineup (útil para guardar)
function exportLineup() {
    return {
        lineup: lineup,
        substitutes: substitutes,
        timestamp: new Date().toISOString()
    };
}