const SUPABASE_URL = 'https://bxgkacenzipwwbawftdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTEyNDQsImV4cCI6MjEwNjI4NzI0NH0.V4jfI7wDvKN-yePelVeAeA-3pEByfwS99o3s7k-vSWs';

// CORREGIDO: Usamos 'db' para evitar el conflicto con el objeto global de Supabase
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    await loadTeamsDropdown();
}

// 1. Cargar la lista de equipos en el desplegable
async function loadTeamsDropdown() {
    try {
        // CORREGIDO: Usamos 'db' en vez de 'supabase'
        const { data: teams, error } = await db
            .from('teams')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error de Supabase al cargar equipos:', error.message);
            alert('Hubo un error al cargar los equipos. Revisa la consola.');
            return;
        }

        const select = document.getElementById('team-select');

        if (!teams || teams.length === 0) {
            console.warn('La tabla teams está vacía o no devolvió registros.');
            return;
        }

        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            if (e.target.value) {
                loadTeamObjectives(e.target.value);
            }
        });

    } catch (err) {
        console.error('Error inesperado en loadTeamsDropdown:', err);
    }
}

// 2. Cargar los objetivos del equipo seleccionado
async function loadTeamObjectives(teamId) {
    const tbody = document.getElementById('objectives-body');
    tbody.innerHTML = `<tr><td colspan="3" class="p-6 text-center text-gray-500">Cargando objetivos...</td></tr>`;

    try {
        // CORREGIDO: Usamos 'db' en vez de 'supabase'
        const { data, error } = await db
            .from('team_objectives')
            .select(`
                *,
                teams (name, division)
            `)
            .eq('team_id', teamId)
            .single();

        if (error || !data) {
            console.error('Error cargando objetivos:', error ? error.message : 'No hay datos');
            tbody.innerHTML = `<tr><td colspan="3" class="p-6 text-center text-red-500">No se encontraron objetivos para este equipo.</td></tr>`;
            document.getElementById('team-title').textContent = "Sin objetivos asignados";
            return;
        }

        // Actualizar título
        const teamName = data.teams ? data.teams.name : 'Equipo';
        document.getElementById('team-title').textContent = `Objetivos GENERALES : ${teamName} (Clase ${data.class_tier || 'A'})`;

        // Mapear los 6 objetivos fijos
        const rows = [
            { type: 'MERCADO', text: data.market_objective_one, status: data.market_objective_one_status },
            { type: 'MERCADO', text: data.market_objective_two, status: data.market_objective_two_status },
            { type: 'MERCADO', text: data.market_objective_three, status: data.market_objective_three_status },
            { type: 'LIGA/COPA', text: data.league_objective_one, status: data.league_objective_one_status },
            { type: 'EUROPA', text: data.europe_objective_one, status: data.europe_objective_one_status },
            { type: 'ESTADÍSTICAS', text: data.stats_objective_one, status: data.stats_objective_one_status }
        ];

        tbody.innerHTML = '';

        rows.forEach(row => {
            let statusBg = 'bg-yellow-400 text-black'; // PENDIENTE
            if (row.status === 'CONSEGUIDO') statusBg = 'bg-green-500 text-white';
            if (row.status === 'FALLADO') statusBg = 'bg-red-500 text-white';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="p-3 font-bold bg-gray-50 border-r border-gray-300 uppercase text-xs">${row.type}</td>
                <td class="p-3 border-r border-gray-300">${row.text || 'Sin definir'}</td>
                <td class="p-3 text-center font-bold text-xs ${statusBg}">${row.status || 'PENDIENTE'}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Error inesperado en loadTeamObjectives:', err);
        tbody.innerHTML = `<tr><td colspan="3" class="p-6 text-center text-red-500">Error al conectar con la base de datos.</td></tr>`;
    }
}
