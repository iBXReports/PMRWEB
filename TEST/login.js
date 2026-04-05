/**
 * LOGICA DE ACCESO - WEB PMR SUPABASE (NUEVO PROYECTO)
 */

const SUPABASE_URL = "https://tgyltxcabrbegwlmcbmv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRneWx0eGNhYnJiZWd3bG1jYm12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMzE2NjcsImV4cCI6MjA5MDkwNzY2N30.wguY1f1HKaP4b8pCdO355Yf1pdcD9GJAalp4xQyCHuU";

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log("🚀 INTENTO DE INICIO DE SESIÓN...");
    const rutInput = document.getElementById('rut-input');
    const btn = document.getElementById('btn-login');
    const rawInput = rutInput.value.trim();
    // Extraemos solo lo alfanumérico (números y K)
    const rut = rawInput.toUpperCase().replace(/[^0-9K]/g, '');

    if (!rawInput) return;

    btn.textContent = "VERIFICANDO...";
    btn.disabled = true;

    // Inicializar cliente
    if (typeof supabase === 'undefined') {
        alert("⚠️ Error: SDK de Supabase falló en cargar. ¿Tienes internet?");
        btn.textContent = "INGRESAR AL PANEL";
        btn.disabled = false;
        return;
    }

    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        console.log("🔍 BUSCANDO RUT EN NUBE:", rut);
        
        // --- MASTER BYPASS PARA CUENTA "123" ---
        if (rawInput === '123' || rut === '123') {
            console.log("🔓 BYPASS MASTER DETECTADO: 123");
            const sessionUser = {
                id: 'SUP-MASTER',
                nombre: 'SUPERVISOR MASTER',
                rut: '123',
                rol: 'supervisor',
                equipo: 'TODOS'
            };
            localStorage.setItem('webPmr_user', JSON.stringify(sessionUser));
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 300);
            return;
        }

        // Formateos automáticos del RUT para asegurar que coincida con cualquier formato en la DB
        const body = rut.slice(0, -1);
        const dv = rut.slice(-1);
        const rutDotsDash = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv;
        const rutDash = body + "-" + dv;
        const rutClean = rut;

        const { data, error } = await supabaseClient
            .from('agentes')
            .select('*')
            .or(`rut.eq.${rutClean},rut.eq.${rutDash},rut.eq.${rutDotsDash}`);

        if (error) {
            console.error("🔍 ERROR RETORNADO:", error);
            alert("⚠️ Error en Supabase: " + error.message);
        } else if (data && data.length > 0) {
            const userDoc = data[0]; // Usamos el primer hallazgo
            console.log("✅ IDENTIDAD IDENTIFICADA:", userDoc.nombre);
            
            const idValue = (userDoc.id || '').toUpperCase();
            let finalRole = userDoc.rol || 'agente'; 
            finalRole = finalRole.toLowerCase();

            // Override por prefijo MIENTRAS el rol no sea uno administrativo explícito
            if (!['supervisor', 'cdo', 'jefatura', 'administrador'].includes(finalRole)) {
                if (idValue.startsWith('C-')) finalRole = 'cdo';
                else if (idValue.startsWith('S-') || idValue.startsWith('SUP-')) finalRole = 'supervisor';
                else if (idValue.startsWith('J-')) finalRole = 'jefatura';
                else if (idValue.startsWith('AG-')) finalRole = 'agente';
            }

            const sessionUser = { ...userDoc, rol: finalRole };
            localStorage.setItem('webPmr_user', JSON.stringify(sessionUser));
            
            setTimeout(() => {
                if (finalRole === 'agente') window.location.href = 'AgentePMR.html';
                else window.location.href = 'index.html';
            }, 300);
        } else {
            alert("⚠️ No se encontró ningún usuario con el RUT '" + rawInput + "'.");
        }
    } catch (err) {
        console.error("🔥 ERROR CRÍTICO:", err);
        alert("🔥 Error inesperado: " + err.message);
    } finally {
        setTimeout(() => {
            btn.textContent = "INGRESAR AL PANEL";
            btn.disabled = false;
        }, 1000);
    }
});
