const fs = require('fs');

const sbUrl = 'https://plpnypzesupfczxrzgwb.supabase.co';
const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBscG55cHplc3VwZmN6eHJ6Z3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NjAwNDksImV4cCI6MjA4NTAzNjA0OX0.d_sGStyMDts6wUEPOeZQZw8vIpfZMxx78kieGOrzxR8';

const supabaseScript = `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
    const SUPABASE_URL = '${sbUrl}';
    const SUPABASE_KEY = '${sbKey}';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // DB Service
    window.db = {
        async getVuelosHoy(fecha) {
            const { data, error } = await supabase.from('vuelos').select('*').eq('fecha', fecha);
            if(error) console.error(error);
            return data || [];
        },
        async getAgentes() {
            const { data, error } = await supabase.from('agentes').select('*');
            if(error) console.error(error);
            return data || [];
        },
        async getAsignacionesActivas() {
            const { data, error } = await supabase.from('asignaciones_tareas').select('*').neq('estado', 'terminada');
            if(error) console.error(error);
            return data || [];
        },
        async guardarVuelo(vuelo) {
            const { data, error } = await supabase.from('vuelos').upsert([vuelo]).select();
            if(error) throw error;
            return data[0];
        },
        async eliminarVuelo(id) {
            const { error } = await supabase.from('vuelos').delete().eq('id', id);
            if(error) throw error;
        }
    };
</script>`;

function replaceInFile(filename) {
    let content = fs.readFileSync(filename, 'utf-8');
    
    // Inject Supabase SDK and JS
    if (!content.includes('@supabase/supabase-js')) {
        content = content.replace('</head>', supabaseScript + '\n</head>');
    }
    
    // Remove the mock ALL_FLIGHTS push loop in indexclaude
    let regexMockFlights = /let fCounter = 1000;[\s\S]*?for \(let i = -120; i <= 360; i \+= 20\) \{[\s\S]*?\}\s*}/;
    content = content.replace(regexMockFlights, `// Mocks removidos - Integrado con Supabase`);
    
    // Similar strategy to clear the MOCK data in the files...
    // But since the code is huge, we'll try a regex to clear big chunks of mock data if they exist.
    let regexMockAssignments = /for \(let i = 0; i < 35; i\+\+\) \{[\s\S]*?ALL_ASSIGNMENTS\.push\([\s\S]*?\}\s*\)/;
    content = content.replace(regexMockAssignments, `// Mocks de asignaciones removidos`);

    fs.writeFileSync(filename, content, 'utf-8');
    console.log("Updated: " + filename);
}
replaceInFile('indexclaude.html');
replaceInFile('AgentePMR.html');
