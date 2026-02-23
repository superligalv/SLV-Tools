
        // Detectar si estamos en un iframe
        if (window.self !== window.top) {
            document.getElementById('fullscreen-btn').classList.remove('hidden');
        }

        // Configurar el botón de pantalla completa
        document.getElementById('fullscreen-btn').addEventListener('click', function() {
            window.open('https://www.tusoccermanager.com/h43-lineupgenerator-html', '_blank');
        });

        // Configurar el botón de modo oscuro
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Verificar preferencia guardada o del sistema
        if (localStorage.getItem('dark-mode') === 'enabled' || 
            (localStorage.getItem('dark-mode') === null && (prefersDarkScheme.matches || window.self !== window.top || window.innerWidth < 1024))) {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }

        darkModeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('dark-mode', 'enabled');
                darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            } else {
                localStorage.setItem('dark-mode', 'disabled');
                darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            }
        });

        // Configurar el botón de volver arriba
        const backToTopBtn = document.getElementById('back-to-top');
        
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Configurar el enlace "Ver plantilla"
        document.getElementById('viewSquadLink').addEventListener('click', function(e) {
            e.preventDefault();
            const squadText = document.getElementById('squad').value;
            if (!squadText.trim()) {
                alert('No hay plantilla para mostrar.');
                return;
            }

            // Obtener el equipo seleccionado
            const teamDropdown = document.getElementById('teamDropdown');
            const selectedTeam = teamDropdown.options[teamDropdown.selectedIndex].text;
            
            // Establecer el nombre del equipo en el modal
            document.getElementById('modalTeamName').textContent = selectedTeam;

            // Obtener el escudo del equipo
            fetchTeamBadge(selectedTeam);

            // Formatear y mostrar la plantilla
            displayFormattedSquad(squadText);

            // Mostrar el modal
            document.getElementById('squadModal').style.display = 'flex';
        });

        // Configurar el botón para cerrar el modal
        document.getElementById('closeModal').addEventListener('click', function() {
            document.getElementById('squadModal').style.display = 'none';
        });

        // Cerrar el modal al hacer clic fuera de él
        window.addEventListener('click', function(e) {
            const modal = document.getElementById('squadModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Función para obtener el escudo del equipo
        async function fetchTeamBadge(teamName) {
            try {
                const response = await fetch('https://www.tusoccermanager.com/h63-teambadgedb-html');
                const html = await response.text();
                
                // Parsear el HTML para encontrar el escudo del equipo
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Buscar en la lista de escudos
                const listItems = doc.querySelectorAll('#shields-list li');
                let badgeUrl = '';
                
                for (const item of listItems) {
                    const text = item.textContent.trim();
                    // El formato es: "Nombre del equipo: URL"
                    const parts = text.split(':');
                    if (parts.length >= 2) {
                        const name = parts[0].trim();
                        const url = parts.slice(1).join(':').trim(); // Unir el resto por si hay más de un ":"
                        if (name === teamName) {
                            badgeUrl = url;
                            break;
                        }
                    }
                }
                
                // Si no se encuentra, usar un escudo por defecto
                if (!badgeUrl) {
                    badgeUrl = 'https://via.placeholder.com/96x96/3B82F6/FFFFFF?text=' + teamName.charAt(0);
                }
                
                document.getElementById('modalBadge').src = badgeUrl;
            } catch (error) {
                console.error('Error al cargar el escudo:', error);
                document.getElementById('modalBadge').src = 'https://via.placeholder.com/96x96/3B82F6/FFFFFF?text=' + teamName.charAt(0);
            }
        }

        // Función para formatear y mostrar la plantilla
        function displayFormattedSquad(squadText) {
            const lines = squadText.trim().split('\n');
            let formattedHTML = '';
            
            if (lines.length > 0) {
                // Crear tabla para la plantilla
                formattedHTML = '<table class="squad-table">';
                
                // Encabezados
                if (lines.length > 1) {
                    const headers = lines[0].split(/\s+/).filter(h => h);
                    formattedHTML += '<thead><tr>';
                    headers.forEach(header => {
                        formattedHTML += `<th>${header}</th>`;
                    });
                    formattedHTML += '</tr></thead>';
                }
                
                // Datos de jugadores
                formattedHTML += '<tbody>';
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim() && !lines[i].includes('---')) {
                        const playerData = lines[i].split(/\s+/).filter(d => d);
                        formattedHTML += '<tr>';
                        playerData.forEach((data, index) => {
                            // Resaltar el nombre del jugador
                            if (index === 0) {
                                formattedHTML += `<td><strong>${data}</strong></td>`;
                            } else {
                                formattedHTML += `<td>${data}</td>`;
                            }
                        });
                        formattedHTML += '</tr>';
                    }
                }
                formattedHTML += '</tbody></table>';
            } else {
                formattedHTML = '<p>No hay datos de plantilla para mostrar.</p>';
            }
            
            document.getElementById('modalSquadContent').innerHTML = formattedHTML;
        }

        // Función para validar condicionales
        function validateConditionals(conditionalsText) {
            const lines = conditionalsText.split('\n');
            const validKeywords = ['CHANGEAGG', 'CHANGEPOS', 'SUB', 'TACTIC'];
            const errors = [];
            
            lines.forEach((line, index) => {
                const lineNumber = index + 1;
                const trimmedLine = line.trim();
                
                // Saltar líneas vacías
                if (!trimmedLine) return;
                
                // Verificar que tenga exactamente un "IF"
                const ifCount = (trimmedLine.match(/IF/gi) || []).length;
                if (ifCount !== 1) {
                    errors.push(`Línea ${lineNumber}: debe contener exactamente un "IF" (encontrados: ${ifCount})`);
                    return;
                }
                
                // Verificar que contenga al menos una palabra clave válida
                const hasValidKeyword = validKeywords.some(keyword => 
                    trimmedLine.includes(keyword)
                );
                
                if (!hasValidKeyword) {
                    errors.push(`Línea ${lineNumber}: debe contener al menos una de las palabras clave: CHANGEAGG, CHANGEPOS, SUB, TACTIC`);
                    return;
                }
                
                // Verificar que no haya números mayores a 120
                const numbers = trimmedLine.match(/\d+/g) || [];
                for (const numStr of numbers) {
                    const num = parseInt(numStr, 10);
                    if (num > 120) {
                        errors.push(`Línea ${lineNumber}: contiene un número mayor a 120 (${num})`);
                        break;
                    }
                }
            });
            
            return {
                isValid: errors.length === 0,
                errors: errors
            };
        }

        // Resto del código JavaScript existente...
        document.getElementById('aggression').addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('aggressionSlider').classList.remove('hidden');
            } else {
                document.getElementById('aggressionSlider').classList.add('hidden');
            }
        });
        
        document.getElementById('aggressionValue').addEventListener('input', function() {
            document.getElementById('aggressionDisplay').innerText = this.value;
        });

        // Make prioritizeSubs and mixStartersSubs mutually exclusive
        document.getElementById('prioritizeSubs').addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('mixStartersSubs').checked = false;
            }
        });
        
        document.getElementById('mixStartersSubs').addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('prioritizeSubs').checked = false;
            }
        });

        // Team dropdown event listener
        document.getElementById('teamDropdown').addEventListener('change', function() {
            const url = this.value;
            if (url) {
                // Reiniciar las alineaciones
                document.getElementById('lineups-section').classList.add('hidden');
                document.getElementById('unavailable-players').classList.add('hidden');
                
                loadFromDropbox(url);
            }
        });

        let allPlayers = []; // Store all available players for modifications
        let fullPlayers = []; // Store all players including unavailable
        let lineups = [[], [], []]; // Store lineups for each option
        let conditionalsText = '';
        let substitutionsText = ['', '', '']; // Store substitutions for each lineup

        async function pasteSquad() {
            try {
                const text = await navigator.clipboard.readText();
                document.getElementById('squad').value = text;
            } catch (err) {
                alert('Error al acceder al portapapeles. Por favor, pega el contenido manualmente.');
            }
        }

        function loadFile() {
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('squad').value = e.target.result;
                };
                reader.readAsText(file);
            }
        }

        function loadConditionals() {
            const conditionalsInput = document.getElementById('conditionalsInput');
            const file = conditionalsInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const text = e.target.result;
                    
                    // Validar los condicionales
                    const validation = validateConditionals(text);
                    
                    if (validation.isValid) {
                        conditionalsText = text;
                        document.getElementById('conditionalsLoaded').classList.remove('hidden');
                        document.getElementById('conditionalsLoaded').classList.add('visible');
                    } else {
                        alert('Errores en los condicionales:\n\n' + validation.errors.join('\n'));
                        conditionalsText = '';
                        document.getElementById('conditionalsLoaded').classList.remove('visible');
                        document.getElementById('conditionalsLoaded').classList.add('hidden');
                    }
                };
                reader.readAsText(file);
            }
        }

        function clearConditionals() {
            conditionalsText = '';
            document.getElementById('conditionalsLoaded').classList.remove('visible');
            document.getElementById('conditionalsLoaded').classList.add('hidden');
            document.getElementById('conditionalsInput').value = '';
        }

        function clearSquad() {
            document.getElementById('squad').value = '';
            document.getElementById('teamDropdown').value = '';
        }

        async function loadFromDropbox(url) {
            try {
                const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url);
                const response = await fetch(proxyUrl);
                
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                
                const text = await response.text();
                document.getElementById('squad').value = text;
                
                // Set the abbreviation based on the selected team
                const teamDropdown = document.getElementById('teamDropdown');
                const selectedTeam = teamDropdown.options[teamDropdown.selectedIndex].text;
                const teamAbbrMap = {
                    'Ajax': 'AJX',
                    'Arsenal': 'ARS',
                    'Aston Villa': 'ASV',
                    'Atalanta': 'ATA',
                    'Atlético de Madrid': 'ATM',
                    'Barcelona': 'FCB',
                    'Bayer Leverkusen': 'BLE',
                    'Bayern de Múnich': 'BAY',
                    'Borussia Dortmund': 'BDO',
                    'Chelsea': 'CHE',
                    'Inter de Milán': 'INT',
                    'Juventus': 'JUV',
                    'Liverpool': 'LIV',
                    'Manchester City': 'MCI',
                    'Manchester United': 'MAN',
                    'Milan': 'MIL',
                    'Nápoles': 'NAP',
                    'Newcastle United': 'NEW',
                    'PSG': 'PSG',
                    'RB Leipzig': 'RBL',
                    'Real Madrid': 'RMA',
                    'Sevilla': 'SEV',
                    'Tottenham Hotspur': 'TOT',
                    'Villarreal': 'VIL'
                };
                
                if (teamAbbrMap[selectedTeam]) {
                    document.getElementById('abbreviation').value = teamAbbrMap[selectedTeam];
                }
                
            } catch (error) {
                alert(`Error al cargar desde Dropbox: ${error.message}`);
                console.error('Error:', error);
            }
        }

        function validateAbbreviation() {
            const abbreviationInput = document.getElementById('abbreviation');
            const abbreviation = abbreviationInput.value.trim();
            
            // Remove any error styling
            abbreviationInput.classList.remove('error');
            
            // Check if abbreviation is exactly 3 letters
            if (abbreviation.length !== 3 || !/^[A-Za-z]{3}$/.test(abbreviation)) {
                abbreviationInput.classList.add('error');
                return false;
            }
            
            return true;
        }

        function generateLineups() {
            // Reproducir sonido
            document.getElementById('confirmation-sound').play();
            
            // Validate abbreviation
            if (!validateAbbreviation()) {
                showError('La abreviación debe contener exactamente 3 letras.');
                return;
            }

            const abbreviation = document.getElementById('abbreviation').value.toUpperCase();
            let tactic = document.getElementById('tactic').value;
            let formation = document.getElementById('formation').value;
            const fitPriority = document.getElementById('fitPriority').checked;
            const substitutions = document.getElementById('substitutions').checked;
            const prioritizeSubs = document.getElementById('prioritizeSubs').checked;
            const mixStartersSubs = document.getElementById('mixStartersSubs').checked;
            const aggressionChecked = document.getElementById('aggression').checked;
            const conditionalsChecked = document.getElementById('conditionals').checked;
            const aggressionValue = aggressionChecked ? document.getElementById('aggressionValue').value : null;

            if (!document.getElementById('squad').value.trim()) {
                showError('Por favor, introduce la plantilla del equipo.');
                return;
            }

            // Handle random tactic, excluding 'T'
            if (tactic === 'Aleatoria') {
                const tactics = ['A', 'C', 'D', 'E', 'L', 'N', 'P'];
                tactic = tactics[Math.floor(Math.random() * tactics.length)];
            }

            // Handle random formation
            if (formation === 'Aleatoria') {
                const formations = ['4-4-2', '4-3-3', '4-5-1', '5-3-2', '3-4-3', '3-5-2'];
                formation = formations[Math.floor(Math.random() * formations.length)];
            }

            try {
                const players = parseSquad(document.getElementById('squad').value, 'available');
                allPlayers = players; // Store for modifications
                fullPlayers = parseSquad(document.getElementById('squad').value, 'all');

                // Show unavailable players
                const unavailablePlayers = parseSquad(document.getElementById('squad').value, 'unavailable');
                const unavailableContent = document.getElementById('unavailable-players-content');
                if (unavailablePlayers.length > 0) {
                    unavailableContent.innerHTML = unavailablePlayers.map(player => {
                        const reason = player.injured > 0 ? 'Lesión' : 'Sanción';
                        const icon = player.injured > 0 ? 'fa-user-injured' : 'fa-ban';
                        return `<div class="flex items-center gap-2"><span>${player.name}</span><span class="text-gray-500">(${reason} <em class="fas ${icon} text-xs"></em>)</span></div>`;
                    }).join('');
                } else {
                    unavailableContent.innerHTML = '<div class="text-gray-500">Todos los jugadores están disponibles.</div>';
                }
                document.getElementById('unavailable-players').classList.remove('hidden');

                // Show lineups section
                document.getElementById('lineups-section').classList.remove('hidden');

                // Show modification sections
                for (let i = 1; i <= 3; i++) {
                    document.getElementById(`modification-${i}`).style.display = 'block';
                    document.getElementById(`penalty-${i}`).style.display = 'block';
                }

                // Define conditional categories
                const category1 = [
                    'TACTIC L IF SCORE = 3',
                    'TACTIC P IF SCORE = 2',
                    'TACTIC D IF SCORE = -3',
                    'TACTIC A IF MIN >= 65 SCORE <= -1',
                    'TACTIC C IF MIN >= 50 SCORE >= 1',
                    'TACTIC D IF MIN >= 70 SCORE >= 2'
                ];
                const category2 = [
                    'CHANGEPOS 9 AM IF MIN = 65 SCORE <= -1',
                    'CHANGEPOS 7 DM IF MIN >= 65 SCORE <= 1',
                    'CHANGEAGG 18 IF SCORE <= -2',
                    'CHANGEAGG 10 IF SCORE <= 2'
                ];

                for (let i = 1; i <= 3; i++) {
                    const lineup = createLineup(players, fitPriority, i, formation, prioritizeSubs, mixStartersSubs, tactic);
                    lineups[i - 1] = lineup; // Store lineup for modifications
                    let formattedLineup = formatLineup(abbreviation, lineup, tactic, aggressionValue, formation);

                    // Store substitutions text
                    substitutionsText[i - 1] = '';

                    // Add random substitutions if checked
                    if (substitutions) {
                        const dfPlayer = Math.random() < 0.5 ? 2 : 3;
                        const mfPlayer = Math.random() < 0.5 ? 7 : 8;
                        const fwPlayer = Math.random() < 0.5 ? 11 : 10;
                        const substitutionsList = [
                            { text: `SUB ${dfPlayer} 13 DF IF MIN = ${Math.floor(Math.random() * (90 - 45 + 1)) + 45}`, min: 0 },
                            { text: `SUB ${mfPlayer} 15 MF IF MIN = ${Math.floor(Math.random() * (90 - 45 + 1)) + 45}`, min: 0 },
                            { text: `SUB ${fwPlayer} 16 FW IF MIN = ${Math.floor(Math.random() * (90 - 45 + 1)) + 45}`, min: 0 }
                        ];
                        // Extract minutes and sort by minute
                        substitutionsList.forEach(sub => {
                            const minMatch = sub.text.match(/MIN = (\d+)/);
                            if (minMatch) sub.min = parseInt(minMatch[1]);
                        });
                        substitutionsList.sort((a, b) => a.min - b.min);
                        substitutionsText[i - 1] = substitutionsList.map(sub => sub.text).join('\n');
                        formattedLineup += `\n\n${substitutionsText[i - 1]}`;
                    }

                    // Add conditionals if checked (override imported conditionals)
                    if (conditionalsChecked) {
                        // Select 2 random lines from Category 1, excluding the current tactic
                        const shuffledCat1 = category1.filter(cond => !cond.includes(`TACTIC ${tactic}`)).sort(() => 0.5 - Math.random());
                        const selectedCat1 = shuffledCat1.slice(0, 2);

                        // Select 0, 1, or 2 random lines from Category 2
                        const numCat2 = Math.floor(Math.random() * 3); // 0, 1, or 2
                        const shuffledCat2 = category2.sort(() => 0.5 - Math.random());
                        const selectedCat2 = shuffledCat2.slice(0, numCat2);

                        const conditionals = [...selectedCat1, ...selectedCat2].join('\n');
                        formattedLineup += `\n\n${conditionals}`;
                    } else if (conditionalsText) {
                        // Use imported conditionals if checkbox is not checked but file is loaded
                        formattedLineup += `\n\n${conditionalsText}`;
                    }

                    document.getElementById(`output${i}`).innerHTML =
                        `<div class="font-mono text-sm whitespace-pre-wrap">${formattedLineup}</div>`;

                    // Populate modification dropdowns
                    updatePlayerOut(i);
                    updatePlayerIn(i, '');
                    updatePenaltyTakers(i);
                }

                // Scroll to the lineups section
                document.getElementById('lineups-section').scrollIntoView({ behavior: 'smooth' });
            } catch (error) {
                showError(error.message);
            }
        }

        function showError(message) {
            document.getElementById('lineups-section').classList.remove('hidden');
            document.getElementById('unavailable-players').classList.remove('hidden');
            document.getElementById('unavailable-players-content').innerHTML = '<div class="text-gray-500">No se pudo cargar la plantilla para verificar jugadores no disponibles.</div>';
            for (let i = 1; i <= 3; i++) {
                document.getElementById(`output${i}`).innerHTML =
                    `<div class="text-red-600 bg-red-50 p-4 rounded-md border border-red-200">${message}</div>`;
                document.getElementById(`player-out-${i}`).innerHTML = '<option value="">Remplazar a...</option>';
                document.getElementById(`player-in-${i}`).innerHTML = '<option value="">por...</option>';
            }
            document.getElementById('lineups-section').scrollIntoView({ behavior: 'smooth' });
        }

        async function copyLineup(id, button) {
            const text = document.getElementById(id).querySelector('.font-mono').innerText;
            try {
                await navigator.clipboard.writeText(text);
                button.classList.add('action-animation');
                setTimeout(() => {
                    button.classList.remove('action-animation');
                }, 400);
            } catch (err) {
                alert('Error al copiar al portapapeles.');
            }
        }

        function downloadLineup(id, filename, button) {
            const text = document.getElementById(id).querySelector('.font-mono').innerText;
            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            element.setAttribute('download', filename.replace('${abbreviation.toLowerCase()}', document.getElementById('abbreviation').value.toLowerCase()));

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);

            button.classList.add('action-animation');
            setTimeout(() => {
                button.classList.remove('action-animation');
            }, 400);
        }

        function updatePlayerOut(index) {
            const playerOutSelect = document.getElementById(`player-out-${index}`);
            playerOutSelect.innerHTML = '<option value="">Remplazar a...</option>';

            const lineup = lineups[index - 1];
            const lineupPlayers = [
                ...lineup.starters.gk.map(p => ({ ...p, position: 'GK', role: 'GK' })),
                ...lineup.starters.df.map(p => ({ ...p, position: 'DF', role: 'DF' })),
                ...lineup.starters.mf.map(p => ({ ...p, position: 'MF', role: p.role || 'MF' })),
                ...lineup.starters.fw.map(p => ({ ...p, position: 'FW', role: 'FW' })),
                ...lineup.subs.gk.map(p => ({ ...p, position: 'GK', role: 'GK' })),
                ...lineup.subs.df.map(p => ({ ...p, position: 'DF', role: 'DF' })),
                ...lineup.subs.mf.map(p => ({ ...p, position: 'MF', role: p.role || 'MF' })),
                ...lineup.subs.fw.map(p => ({ ...p, position: 'FW', role: 'FW' }))
            ];

            const groups = { GK: [], DF: [], MF: [], FW: [] };

            lineupPlayers.forEach(player => {
                groups[player.position].push(player);
            });

            for (const groupName in groups) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = groupName;
                groups[groupName].forEach(player => {
                    const option = document.createElement('option');
                    option.value = `${player.name}|${player.position}|${player.role}`;
                    option.text = `${player.name} (${player.fit}%)`;
                    optgroup.appendChild(option);
                });
                playerOutSelect.appendChild(optgroup);
                const separator = document.createElement('option');
                separator.disabled = true;
                separator.value = '';
                separator.text = '';
                playerOutSelect.appendChild(separator);
            }
        }

        function updatePlayerIn(index, outName) {
            const playerInSelect = document.getElementById(`player-in-${index}`);
            playerInSelect.innerHTML = '<option value="">por...</option>';

            const lineup = lineups[index - 1];
            const lineupPlayers = [
                ...lineup.starters.gk.map(p => ({ ...p, position: 'GK', role: 'GK' })),
                ...lineup.starters.df.map(p => ({ ...p, position: 'DF', role: 'DF' })),
                ...lineup.starters.mf.map(p => ({ ...p, position: 'MF', role: p.role || 'MF' })),
                ...lineup.starters.fw.map(p => ({ ...p, position: 'FW', role: 'FW' })),
                ...lineup.subs.gk.map(p => ({ ...p, position: 'GK', role: 'GK' })),
                ...lineup.subs.df.map(p => ({ ...p, position: 'DF', role: 'DF' })),
                ...lineup.subs.mf.map(p => ({ ...p, position: 'MF', role: p.role || 'MF' })),
                ...lineup.subs.fw.map(p => ({ ...p, position: 'FW', role: 'FW' }))
            ];

            const groups = { GK: [], DF: [], MF: [], FW: [] };

            // Include all players from the lineup (except the one being replaced)
            lineupPlayers.forEach(player => {
                if (player.name !== outName) {
                    groups[player.position].push(player);
                }
            });

            // Also include players not in the lineup
            fullPlayers.forEach(player => {
                const isInLineup = lineupPlayers.some(p => p.name === player.name);
                if (!isInLineup && player.name !== outName) {
                    const bestPosition = ['gk', 'df', 'mf', 'fw'].reduce((best, pos) =>
                        player[pos] > player[best] ? pos : best, 'mf').toUpperCase();
                    player.bestPosition = bestPosition;
                    player.role = bestPosition === 'MF' ? (player.role || 'MF') : bestPosition;
                    groups[bestPosition].push(player);
                }
            });

            for (const groupName in groups) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = groupName;
                groups[groupName].forEach(player => {
                    const option = document.createElement('option');
                    option.value = `${player.name}|${player.position || player.bestPosition}|${player.role}`;
                    option.text = `${player.name} (${player.fit}%)`;
                    if (player.injured > 0 || player.suspended > 0) {
                        let reason = '';
                        if (player.injured > 0 && player.suspended > 0) {
                            reason = 'Les. San.';
                        } else if (player.injured > 0) {
                            reason = 'Les.';
                        } else if (player.suspended > 0) {
                            reason = 'San.';
                        }
                        option.text += ` - ${reason}`;
                        option.disabled = true;
                        option.style.color = 'gray';
                    }
                    optgroup.appendChild(option);
                });
                playerInSelect.appendChild(optgroup);
                const separator = document.createElement('option');
                separator.disabled = true;
                separator.value = '';
                separator.text = '';
                playerInSelect.appendChild(separator);
            }
        }

        function updatePenaltyTakers(index) {
            const penaltyTakerSelect = document.getElementById(`penalty-taker-${index}`);
            penaltyTakerSelect.innerHTML = '<option value="">Seleccionar lanzador...</option>';

            const lineup = lineups[index - 1];
            const allStarters = [
                ...lineup.starters.gk,
                ...lineup.starters.df,
                ...lineup.starters.mf,
                ...lineup.starters.fw
            ];

            allStarters.forEach(player => {
                const option = document.createElement('option');
                option.value = player.name;
                option.text = player.name;
                penaltyTakerSelect.appendChild(option);
            });
        }

        function changePenaltyTaker(index, playerName) {
            if (!playerName) return;

            const lineup = lineups[index - 1];
            const abbreviation = document.getElementById('abbreviation').value.toUpperCase();
            const tactic = lineups[index - 1].tactic;
            const formation = lineups[index - 1].formation;
            const aggressionValue = document.getElementById('aggression').checked ? document.getElementById('aggressionValue').value : null;

            // Find the player in starters
            const allStarters = [
                ...lineup.starters.gk,
                ...lineup.starters.df,
                ...lineup.starters.mf,
                ...lineup.starters.fw
            ];
            const newPenaltyTaker = allStarters.find(p => p.name === playerName);

            if (!newPenaltyTaker) {
                alert('El lanzador de penaltis debe ser un jugador titular.');
                return;
            }

            // Update the penalty taker
            lineup.penaltyTaker = newPenaltyTaker;

            // Format the lineup
            let formattedLineup = formatLineup(abbreviation, lineup, tactic, aggressionValue, formation);

            // Add substitutions if they exist
            if (substitutionsText[index - 1]) {
                formattedLineup += `\n\n${substitutionsText[index - 1]}`;
            }

            // Add conditionals if they exist
            const conditionalsChecked = document.getElementById('conditionals').checked;
            if (conditionalsChecked || conditionalsText) {
                const originalOutput = document.getElementById(`output${index}`).querySelector('.font-mono').innerText;
                const parts = originalOutput.split('\n\n');
                if (parts.length > 1) {
                    const conditionals = parts[parts.length - 1];
                    formattedLineup += `\n\n${conditionals}`;
                }
            }

            document.getElementById(`output${index}`).innerHTML =
                `<div class="font-mono text-sm whitespace-pre-wrap">${formattedLineup}</div>`;

            // Play confirmation sound
            document.getElementById('confirmation-sound').play();

            // Reset the select
            document.getElementById(`penalty-taker-${index}`).value = "";
        }

        function modifyLineup(index) {
            const playerOutSelect = document.getElementById(`player-out-${index}`);
            const playerInSelect = document.getElementById(`player-in-${index}`);
            const playerOutValue = playerOutSelect.value;
            const playerInValue = playerInSelect.value;

            if (playerOutValue && !playerInValue) {
                const outName = playerOutValue.split('|')[0];
                updatePlayerIn(index, outName);
                return;
            }

            if (!playerOutValue || !playerInValue) return;

            const [outName, outPosition, outRole] = playerOutValue.split('|');
            const [inName, inPosition, inRole] = playerInValue.split('|');

            // Prevent swapping the same player
            if (outName === inName) {
                alert('No puedes sustituir un jugador por sí mismo.');
                playerOutSelect.value = '';
                playerInSelect.value = '';
                return;
            }

            // Clone the lineup to modify
            const lineup = JSON.parse(JSON.stringify(lineups[index - 1]));
            const abbreviation = document.getElementById('abbreviation').value.toUpperCase();
            const tactic = lineups[index - 1].tactic;
            const formation = lineups[index - 1].formation;
            const aggressionValue = document.getElementById('aggression').checked ? document.getElementById('aggressionValue').value : null;

            // Find the out player location
            const sections = ['starters', 'subs'];
            const positions = ['gk', 'df', 'mf', 'fw'];
            let outSection, outPos, outIndex;
            for (const section of sections) {
                for (const pos of positions) {
                    const players = lineup[section][pos];
                    const playerIndex = players.findIndex(p => p.name === outName && (pos !== 'mf' || p.role === outRole));
                    if (playerIndex !== -1) {
                        outSection = section;
                        outPos = pos;
                        outIndex = playerIndex;
                        break;
                    }
                }
                if (outSection) break;
            }

            if (!outSection) return;

            // Find if in player is already in the lineup
            let inSection, inPos, inIndex;
            for (const section of sections) {
                for (const pos of positions) {
                    const players = lineup[section][pos];
                    const playerIndex = players.findIndex(p => p.name === inName && (pos !== 'mf' || p.role === inRole));
                    if (playerIndex !== -1) {
                        inSection = section;
                        inPos = pos;
                        inIndex = playerIndex;
                        break;
                    }
                }
                if (inSection) break;
            }

            if (inSection) {
                // Swap players
                const temp = lineup[outSection][outPos][outIndex];
                lineup[outSection][outPos][outIndex] = lineup[inSection][inPos][inIndex];
                lineup[inSection][inPos][inIndex] = temp;
            } else {
                // Replace with new player
                const newPlayerData = fullPlayers.find(p => p.name === inName);
                if (!newPlayerData) {
                    alert('Jugador no encontrado en la plantilla.');
                    return;
                }
                const newRole = (outPos === 'mf') ? (inRole || 'MF') : outPos.toUpperCase();
                lineup[outSection][outPos][outIndex] = {
                    name: inName,
                    role: newRole,
                    fit: newPlayerData.fit,
                    gk: newPlayerData.gk,
                    df: newPlayerData.df,
                    mf: newPlayerData.mf,
                    fw: newPlayerData.fw
                };
            }

            // Update penalty taker if necessary
            if (lineup.penaltyTaker.name === outName) {
                lineup.penaltyTaker = { 
                    name: inName, 
                    role: inRole || 'FW', 
                    fit: fullPlayers.find(p => p.name === inName).fit 
                };
            }

            // Format and display the updated lineup
            let formattedLineup = formatLineup(abbreviation, lineup, tactic, aggressionValue, formation);

            // Add substitutions if they exist
            if (substitutionsText[index - 1]) {
                formattedLineup += `\n\n${substitutionsText[index - 1]}`;
            }

            // Add conditionals if they exist
            const conditionalsChecked = document.getElementById('conditionals').checked;
            if (conditionalsChecked || conditionalsText) {
                const originalOutput = document.getElementById(`output${index}`).querySelector('.font-mono').innerText;
                const parts = originalOutput.split('\n\n');
                if (parts.length > 1) {
                    const conditionals = parts[parts.length - 1];
                    formattedLineup += `\n\n${conditionals}`;
                }
            }

            document.getElementById(`output${index}`).innerHTML =
                `<div class="font-mono text-sm whitespace-pre-wrap">${formattedLineup}</div>`;

            // Update stored lineup
            lineups[index - 1] = lineup;

            // Play confirmation sound
            document.getElementById('confirmation-sound').play();

            // Reset dropdowns
            playerOutSelect.value = '';
            playerInSelect.value = '';

            // Repopulate dropdowns
            updatePlayerOut(index);
            updatePlayerIn(index, '');
            updatePenaltyTakers(index);
        }

        function parseSquad(squadText, filterType = 'available') {
            const lines = squadText.trim().split('\n')
                .filter(line => line && !line.includes('Name') && !line.includes('---'));

            const players = lines.map(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length < 27) {
                    throw new Error('Formato de plantilla inválido');
                }

                return {
                    name: parts[0],
                    gk: parseInt(parts[3]),
                    df: parseInt(parts[4]),
                    mf: parseInt(parts[5]),
                    fw: parseInt(parts[6]),
                    injured: parseInt(parts[24]),
                    suspended: parseInt(parts[25]),
                    fit: parseInt(parts[26]),
                    totalScore: parseInt(parts[3]) + parseInt(parts[4]) + parseInt(parts[5]) + parseInt(parts[6])
                };
            });

            if (filterType === 'available') {
                return players.filter(p => p.injured === 0 && p.suspended === 0);
            } else if (filterType === 'unavailable') {
                return players.filter(p => p.injured > 0 || p.suspended > 0);
            } else if (filterType === 'all') {
                return players;
            }
        }

        function assignMidfieldRoles(players) {
            const assignRole = (player) => {
                if (player.mf < Math.max(player.gk, player.df, player.fw)) {
                    return { ...player, role: 'MF' }; // Not a primary midfielder
                }

                const dfScore = player.df;
                const fwScore = player.fw;
                let role = 'MF';

                const baseProbability = (score) => {
                    if (score <= 5) return 0;
                    return Math.min(0.95, 0.50 + (score - 6) * (0.45 / 9));
                };

                if (dfScore > fwScore && dfScore > 5) {
                    const probDM = baseProbability(dfScore);
                    if (Math.random() < probDM) {
                        role = 'DM';
                    }
                } else if (fwScore > dfScore && fwScore > 5) {
                    const probAM = baseProbability(fwScore);
                    if (Math.random() < probAM) {
                        role = 'AM';
                    }
                }

                return { ...player, role };
            };

            return players.map(assignRole);
        }

        function createLineup(players, fitPriority, variation, formation, prioritizeSubs, mixStartersSubs, tactic) {
            if (players.length < 16) {
                throw new Error('No hay suficientes jugadores disponibles para generar una alineación');
            }

            const applyFitPriority = (sortedPlayers) => {
                if (fitPriority) {
                    const highFitPlayers = sortedPlayers.filter(p => p.fit > 90);
                    const otherPlayers = sortedPlayers.filter(p => p.fit <= 90);

                    if (highFitPlayers.length < 16) {
                        return [...highFitPlayers, ...otherPlayers];
                    } else {
                        return highFitPlayers;
                    }
                }
                return sortedPlayers;
            };

            const applyPrioritizeSubs = (sortedPlayers, position) => {
                return sortedPlayers.filter(p => p[position] >= 15)
                    .sort((a, b) => {
                        return (a[position] - b[position]) || (b.fit - a.fit);
                    });
            };

            const applyStarters = (sortedPlayers, position) => {
                return sortedPlayers.sort((a, b) => b[position] - a[position] || b.variationScore - a.variationScore);
            };

            const addVariation = (players, variationNum) => {
                return players.map(p => ({
                    ...p,
                    variationScore: p.totalScore + (Math.random() * (5 + variationNum * 2))
                }));
            };

            const variatedPlayers = addVariation(players, variation);
            const playersWithRoles = assignMidfieldRoles(variatedPlayers);
            const sortedGK = applyFitPriority([...playersWithRoles]);
            const sortedDF = applyFitPriority([...playersWithRoles]);
            const sortedMF = applyFitPriority([...playersWithRoles]);
            const sortedFW = applyFitPriority([...playersWithRoles]);

            const lineup = {
                starters: {
                    gk: [],
                    df: [],
                    mf: [],
                    fw: []
                },
                subs: {
                    gk: [],
                    df: [],
                    mf: [],
                    fw: []
                },
                tactic,
                formation
            };

            const formationConfig = {
                '4-4-2': { df: 4, mf: 4, fw: 2 },
                '4-3-3': { df: 4, mf: 3, fw: 3 },
                '4-5-1': { df: 4, mf: 5, fw: 1 },
                '5-3-2': { df: 5, mf: 3, fw: 2 },
                '3-4-3': { df: 3, mf: 4, fw: 3 },
                '3-5-2': { df: 3, mf: 5, fw: 2 }
            };

            const { df: dfCount, mf: mfCount, fw: fwCount } = formationConfig[formation];

            // Select players based on prioritizeSubs or mixStartersSubs
            const selectPlayersForPosition = (sortedPlayers, position, count, usedPlayers) => {
                const selected = [];
                const usedNames = new Set(usedPlayers.map(p => p.name));

                if (mixStartersSubs) {
                    // Select approximately half substitutes and half starters
                    const subCount = Math.ceil(count / 2);
                    const starterCount = count - subCount;

                    // Select substitutes (players with position score >= 15)
                    let subs = applyPrioritizeSubs([...sortedPlayers], position);
                    subs = subs.filter(p => !usedNames.has(p.name));
                    for (let i = 0; i < Math.min(subCount, subs.length); i++) {
                        selected.push(subs[i]);
                        usedNames.add(subs[i].name);
                    }

                    // Select starters (highest position score)
                    let starters = applyStarters([...sortedPlayers], position);
                    starters = starters.filter(p => !usedNames.has(p.name));
                    for (let i = 0; i < Math.min(starterCount, starters.length); i++) {
                        selected.push(starters[i]);
                        usedNames.add(starters[i].name);
                    }
                } else if (prioritizeSubs) {
                    // Select only substitutes (players with position score >= 15)
                    let subs = applyPrioritizeSubs([...sortedPlayers], position);
                    subs = subs.filter(p => !usedNames.has(p.name));
                    for (let i = 0; i < Math.min(count, subs.length); i++) {
                        selected.push(subs[i]);
                        usedNames.add(subs[i].name);
                    }
                } else {
                    // Select starters (highest position score)
                    let starters = applyStarters([...sortedPlayers], position);
                    starters = starters.filter(p => !usedNames.has(p.name));
                    for (let i = 0; i < Math.min(count, starters.length); i++) {
                        selected.push(starters[i]);
                        usedNames.add(starters[i].name);
                    }
                }

                if (selected.length < count) {
                    // Fallback to remaining players if not enough
                    const remaining = sortedPlayers.filter(p => !usedNames.has(p.name));
                    for (let i = 0; i < Math.min(count - selected.length, remaining.length); i++) {
                        selected.push(remaining[i]);
                        usedNames.add(remaining[i].name);
                    }
                }

                if (selected.length < count) {
                    throw new Error('No hay suficientes jugadores disponibles para generar una alineación');
                }

                return selected;
            };

            lineup.starters.gk.push(selectPlayersForPosition(sortedGK, 'gk', 1, [])[0]);
            lineup.starters.df = selectPlayersForPosition(sortedDF, 'df', dfCount, lineup.starters.gk);

            // Handle midfielders with DM/AM roles, ensuring max 2 DMs, max 2 AMs, and min 2 MFs
            const midfielders = selectPlayersForPosition(sortedMF, 'mf', mfCount, [...lineup.starters.gk, ...lineup.starters.df]);
            const dmCandidates = midfielders.filter(p => p.role === 'DM').sort((a, b) => b.df - a.df);
            const amCandidates = midfielders.filter(p => p.role === 'AM').sort((a, b) => b.fw - a.fw);
            const mfCandidates = midfielders.filter(p => p.role === 'MF').sort((a, b) => b.mf - a.mf);

            const dmCount = Math.min(dmCandidates.length, 2);
            const amCount = Math.min(amCandidates.length, 2);
            const minMFCount = Math.max(2, mfCount - dmCount - amCount); // Ensure at least 2 MFs
            const availableMFCount = mfCandidates.length;

            if (availableMFCount < minMFCount) {
                // If not enough MFs, reassign some DMs/AMs to MF
                const neededMFs = minMFCount - availableMFCount;
                const extraDMs = dmCandidates.slice(dmCount);
                const extraAMs = amCandidates.slice(amCount);
                const reassignable = [...extraDMs, ...extraAMs].sort((a, b) => b.mf - a.mf);
                const reassignedMFs = reassignable.slice(0, neededMFs).map(p => ({ ...p, role: 'MF' }));
                lineup.starters.mf = [
                    ...dmCandidates.slice(0, dmCount),
                    ...mfCandidates,
                    ...reassignedMFs,
                    ...amCandidates.slice(0, amCount)
                ].slice(0, mfCount);
            } else {
                lineup.starters.mf = [
                    ...dmCandidates.slice(0, dmCount),
                    ...mfCandidates.slice(0, Math.min(mfCandidates.length, minMFCount)),
                    ...amCandidates.slice(0, amCount)
                ].slice(0, mfCount);
            }

            lineup.starters.fw = selectPlayersForPosition(sortedFW, 'fw', fwCount, [...lineup.starters.gk, ...lineup.starters.df, ...lineup.starters.mf]);

            const usedPlayers = [...lineup.starters.gk, ...lineup.starters.df, ...lineup.starters.mf, ...lineup.starters.fw];
            lineup.subs.gk.push(selectPlayersForPosition(sortedGK, 'gk', 1, usedPlayers)[0]);
            lineup.subs.df = selectPlayersForPosition(sortedDF, 'df', 2, [...usedPlayers, ...lineup.subs.gk]);
            lineup.subs.mf = selectPlayersForPosition(sortedMF, 'mf', 1, [...usedPlayers, ...lineup.subs.gk, ...lineup.subs.df]);
            lineup.subs.fw = selectPlayersForPosition(sortedFW, 'fw', 1, [...usedPlayers, ...lineup.subs.gk, ...lineup.subs.df, ...lineup.subs.mf]);

            if (variation > 1) {
                for (let position of ['df', 'mf', 'fw']) {
                    if (lineup.starters[position].length > 1 && lineup.subs[position].length > 0) {
                        let indexToSwap = Math.floor(Math.random() * lineup.starters[position].length);
                        let swappedPlayer = lineup.starters[position].splice(indexToSwap, 1, lineup.subs[position].shift())[0];
                        lineup.subs[position].push(swappedPlayer);
                    }
                }
            }

            const penaltyTaker = [...lineup.starters.fw, ...lineup.starters.mf]
                .sort((a, b) => b.fw - a.fw || b.mf - a.mf)[0];

            return {
                starters: lineup.starters,
                subs: lineup.subs,
                penaltyTaker,
                tactic,
                formation
            };
        }

        function formatLineup(abbreviation, lineup, tactic, aggressionValue, formation) {
            const formatSection = (players, position) => {
                if (position === 'mf') {
                    // Sort midfielders: DM first, then MF, then AM
                    const sortedMF = [
                        ...players[position].filter(p => p.role === 'DM'),
                        ...players[position].filter(p => p.role === 'MF'),
                        ...players[position].filter(p => p.role === 'AM')
                    ];
                    return sortedMF.map(player => {
                        const role = player.role || 'MF';
                        return `${role} ${player.name}`;
                    }).join('\n');
                }
                return players[position].map(player => {
                    const role = position.toUpperCase();
                    return `${role} ${player.name}`;
                }).join('\n');
            };

            let formatted = `${abbreviation}\n${tactic}\n\n`;

            formatted += `${formatSection(lineup.starters, 'gk')}\n${formatSection(lineup.starters, 'df')}\n${formatSection(lineup.starters, 'mf')}\n${formatSection(lineup.starters, 'fw')}\n\n`;
            formatted += `${formatSection(lineup.subs, 'gk')}\n${formatSection(lineup.subs, 'df')}\n${formatSection(lineup.subs, 'mf')}\n${formatSection(lineup.subs, 'fw')}\n\nPK: ${lineup.penaltyTaker.name}`;

            if (aggressionValue !== null) {
                formatted += `\nAGG ${aggressionValue}`;
            }

            return formatted;
        }