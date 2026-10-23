// --- CONFIGURACIÓN DE SUPABASE ---
// Reemplaza con tus credenciales reales de Supabase
const SUPABASE_URL = 'https://bxgkacenzipwwbawftdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTEyNDQsImV4cCI6MjEwNjI4NzI0NH0.V4jfI7wDvKN-yePelVeAeA-3pEByfwS99o3s7k-vSWs';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentTeamId = null;

document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
});

async function initAdmin() {
    await loadTeamsDropdown();

    const form = document.getElementById('objective-form');
    form.addEventListener('submit', handleFormSubmit);
}

// 1. Cargar equipos en el selector del panel de administración
async function loadTeamsDropdown() {
    try {
        const { data: teams, error } = await db
            .from('teams')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error cargando equipos:', error.message);
            return;
        }

        const select = document.getElementById('team-select');
        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            select.appendChild(option);
        });

        select.addEventListener('change', async (e) => {
            const teamId = e.target.value;
            if (teamId) {
                currentTeamId = teamId;
                await loadTeamDataForEdit(teamId);
            } else {
                currentTeamId = null;
                document.getElementById('objective-form').classList.add('hidden');
                document.getElementById('no-team-selected').classList.remove('hidden');
            }
        });

    } catch (err) {
        console.error('Error inesperado:', err);
    }
}

// 2. Cargar datos del equipo seleccionado en los inputs del formulario
async function loadTeamDataForEdit(teamId) {
    const form = document.getElementById('objective-form');
    const noTeamMsg = document.getElementById('no-team-selected');
    
    noTeamMsg.textContent = "Cargando objetivos...";
    noTeamMsg.classList.remove('hidden');
    form.classList.add('hidden');

    try {
        const { data, error } = await db
            .from('team_objectives')
            .select('*')
            .eq('team_id', teamId)
            .single();

        if (error || !data) {
            noTeamMsg.textContent = "Este equipo aún no tiene un registro de objetivos creado en la base de datos.";
            return;
        }

        noTeamMsg.classList.add('hidden');
        form.classList.remove('hidden');

        // Rellenar clase
        document.getElementById('class-tier').value = data.class_tier || '';

        // Definir estructura de campos editables (3 mercado, 1 liga, 1 europa, 1 stats)
        const fieldsConfig = [
            { label: 'Mercado 1', textKey: 'market_objective_one', statusKey: 'market_objective_one_status' },
            { label: 'Mercado 2', textKey: 'market_objective_two', statusKey: 'market_objective_two_status' },
            { label: 'Mercado 3', textKey: 'market_objective_three', statusKey: 'market_objective_three_status' },
            { label: 'Liga / Copa', textKey: 'league_objective_one', statusKey: 'league_objective_one_status' },
            { label: 'Europa', textKey: 'europe_objective_one', statusKey: 'europe_objective_one_status' },
            { label: 'Estadísticas', textKey: 'stats_objective_one', statusKey: 'stats_objective_one_status' }
        ];

        const container = document.getElementById('objectives-container');
        container.innerHTML = '';

        fieldsConfig.forEach((field, index) => {
            const currentText = data[field.textKey] || '';
            const currentStatus = data[field.statusKey] || 'PENDIENTE';

            const div = document.createElement('div');
            div.className = 'bg-gray-50 p-4 rounded border border-gray-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-center';
            div.innerHTML = `
                <div class="md:col-span-3 font-bold text-xs uppercase tracking-wider text-gray-700">
                    ${index + 1}. ${field.label}
                </div>
                <div class="md:col-span-6">
                    <input type="text" name="${field.textKey}" value="${currentText}" required
                        class="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-black outline-none">
                </div>
                <div class="md:col-span-3">
                    <select name="${field.statusKey}" 
                        class="w-full border border-gray-300 rounded px-3 py-2 text-sm font-bold bg-white focus:ring-2 focus:ring-black outline-none">
                        <option value="PENDIENTE" ${currentStatus === 'PENDIENTE' ? 'selected' : ''}>PENDIENTE</option>
                        <option value="CONSEGUIDO" ${currentStatus === 'CONSEGUIDO' ? 'selected' : ''}>CONSEGUIDO</option>
                        <option value="FALLADO" ${currentStatus === 'FALLADO' ? 'selected' : ''}>FALLADO</option>
                    </select>
                </div>
            `;
            container.appendChild(div);
        });

    } catch (err) {
        console.error('Error cargando datos para edición:', err);
        noTeamMsg.textContent = "Error al conectar con la base de datos.";
    }
}

// 3. Guardar cambios en Supabase
async function handleFormSubmit(e) {
    e.preventDefault();
    if (!currentTeamId) return;

    const saveBtn = document.getElementById('save-btn');
    saveBtn.textContent = "Guardando...";
    saveBtn.disabled = true;

    // Recoger valores del formulario
    const formData = new FormData(e.target);
    const updatedData = {
        class_tier: document.getElementById('class-tier').value,
        market_objective_one: formData.get('market_objective_one'),
        market_objective_one_status: formData.get('market_objective_one_status'),
        market_objective_two: formData.get('market_objective_two'),
        market_objective_two_status: formData.get('market_objective_two_status'),
        market_objective_three: formData.get('market_objective_three'),
        market_objective_three_status: formData.get('market_objective_three_status'),
        league_objective_one: formData.get('league_objective_one'),
        league_objective_one_status: formData.get('league_objective_one_status'),
        europe_objective_one: formData.get('europe_objective_one'),
        europe_objective_one_status: formData.get('europe_objective_one_status'),
        stats_objective_one: formData.get('stats_objective_one'),
        stats_objective_one_status: formData.get('stats_objective_one_status'),
    };

    try {
        const { error } = await db
            .from('team_objectives')
            .update(updatedData)
            .eq('team_id', currentTeamId);

        if (error) {
            console.eror('Error al actualizar:', error.message);
            alert('Hubo un error al guardar los cambios: ' + error.message);
        } else {
            alert('¡Objetivos actualizados correctamente!');
        }
    } catch (err) {
        console.error('Error inesperado al guardar:', err);
        alert('Error inesperado al guardar.');
    } finally {
        saveBtn.textContent = "Guardar Cambios";
        saveBtn.disabled = false;
    }
}

