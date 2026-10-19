// Configuración de Supabase con las credenciales públicas (anon)
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-clave-anonima-publica';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cargarGoleadores() {
    // Consultamos los datos en Supabase uniendo la tabla de estadísticas con la de jugadores
    const { data, error } = await supabase
        .from('player_season_stats')
        .select(`
            gls, 
            ass, 
            players ( name, nationality )
        `)
        .order('gls', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error al cargar los datos:', error);
        return;
    }

    const tbody = document.querySelector('#goleadores-table tbody');
    tbody.innerHTML = ''; // Limpiar tabla antes de rellenar

    data.forEach(item => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${item.players?.name || 'Desconocido'}</strong></td>
            <td>${item.players?.nationality || '-'}</td>
            <td style="color: #2e7d32; font-weight: bold;">${item.gls}</td>
            <td>${item.ass}</td>
        `;
        tbody.appendChild(fila);
    });
}

// Ejecutar la función al cargar la página
cargarGoleadores();
