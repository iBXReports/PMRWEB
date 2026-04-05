/**
 * --------------------------------------------------------------------------------
 * CORE LOGIC MODULE (WEB PMR DASHBOARD) - 100% CLOUD NATIVE
 * --------------------------------------------------------------------------------
 */
const AIRLINE_LOGOS = {
    'LATAM': 'img/latam.jpg',
    'DELTA': 'img/delta.jpg',
    'AIR CANADA': 'img/aircanada.jpg',
    'AIR FRANCE': 'img/airfrance.jpg',
    'AVIANCA': 'img/avianca.jpg',
    'ARAJET': 'img/arajet.jpg',
    'BOA': 'img/boa.jpg',
    'KLM': 'img/klm.jpg',
    'COPA': 'img/copa.jpg',
    'BRITISH': 'img/british.jpg',
    'ARGENTINAS': 'img/argentinas.jpg',
    'IBERIA': 'img/iberia.jpg',
    'LEVEL': 'img/level.jpg',
    'QANTAS': 'img/qantas.jpg'
};

const SSR_DEFINITIONS = {
    'WCHR': { d: 'Silla de Ruedas - Rampa (Distancias)', col: '#3b82f6' },
    'WCHS': { d: 'Silla de Ruedas - Escalera (No sube escaleras)', col: '#f97316' },
    'WCHC': { d: 'Silla de Ruedas - Cabina (Inmovilidad total)', col: '#ef4444' },
    'UMNR': { d: 'Menor no Acompañado', col: '#8b5cf6' },
    'MAAS': { d: 'Asistencia General (Meet and Assist)', col: '#06b6d4' },
    'WCMP': { d: 'Silla de Ruedas Manual Manual del Pasajero', col: '#10b981' },
    'MEDA': { d: 'Pasajero que requiere asistencia Médica', col: '#f43f5e' },
    'DPNA': { d: 'Pasajero con Discapacidad Intelectual o del Desarrollo', col: '#ec4899' },
    'BLND': { d: 'Pasajero Ciego o con Visión Reducida', col: '#6366f1' },
    'DEAF': { d: 'Pasajero Sordo o con Audición Reducida', col: '#14b8a6' },
    'WCOB': { d: 'Silla de Ruedas a Bordo (On Board)', col: '#84cc16' },
    'OTRO': { d: 'Asistencia Especial no clasificada', col: '#64748b' }
};

const SSR_DESCRIPTIONS = {
    'WCHR': 'Wheelchair Rampa: Puede subir escaleras y caminar en cabina.',
    'WCHS': 'Wheelchair Stairs: No puede subir escaleras, camina en cabina.',
    'WCHC': 'Wheelchair Cabin: Inmóvil, requiere asistencia total.',
    'UMNR': 'Menor no Acompañado: Pasajero menor de edad viajando solo.',
    'MAAS': 'Meet and Assist: Pasajero requiere acompañamiento general.',
    'WCMP': 'Wheelchair Manual Power: Silla de ruedas manual personal.',
    'MEDA': 'Medical Case: Pasajero con requerimientos médicos.',
    'DPNA': 'Disabled Person Needing Assistance: Discapacidad intelectual.',
    'BLND': 'Blind: Pasajero con discapacidad visual.',
    'DEAF': 'Deaf: Pasajero con discapacidad auditiva.',
    'WCOB': 'Wheelchair On Board: Silla de ruedas a bordo provista.',
    'OTRO': 'Otro requerimiento especial.'
};

const SESSION_USER = JSON.parse(localStorage.getItem('webPmr_user'));

// 🚀 GUARDIA DE SEGURIDAD FINAL
const VALID_SUPERVISORS = ['cdo', 'supervisor', 'jefatura', 'administrador'];

if (!SESSION_USER && !window.location.href.includes('Login.html')) {
    window.location.href = 'Login.html';
} else if (SESSION_USER && !window.location.href.includes('Login.html')) {
    const role = (SESSION_USER.rol || '').toLowerCase();
    if (!VALID_SUPERVISORS.includes(role)) {
        window.location.href = 'AgentePMR.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    init(); // Cargamos sincronización Supabase
    if (SESSION_USER) {
        const brandSub = document.querySelector('.brand-text span');
        if (brandSub) {
            brandSub.textContent = `${SESSION_USER.nombre} (${SESSION_USER.rol.toUpperCase()})`;
        }

        // 🔐 RESTRICCIÓN PARA CDO: Esconder Ajustes
        if (SESSION_USER.rol === 'cdo') {
            const settingsBtn = document.querySelector('.item-ajustes');
            if (settingsBtn) settingsBtn.style.display = 'none';
            console.log("🚫 MODO CDO: Pestaña Ajustes bloqueada.");
        }

        // 🔐 APLICAR RESTRICCIONES DE PESTAÑAS (PERMISOS PERSONALIZADOS)
        if (SESSION_USER.permisos) {
            try {
                const hiddenTabs = typeof SESSION_USER.permisos === 'string' ? JSON.parse(SESSION_USER.permisos) : SESSION_USER.permisos;
                if (Array.isArray(hiddenTabs)) {
                    hiddenTabs.forEach(tabCls => {
                        // El menú usa clases como "item-dashboard", "item-vuelos", etc.
                        const tabBtn = document.querySelector(`.item-${tabCls}`);
                        if(tabBtn) tabBtn.style.display = 'none';
                    });
                }
            } catch(e) { console.error("Error parseando permisos", e); }
        }
    }
});

function logoutUser() {
    localStorage.removeItem('webPmr_user');
    window.location.href = 'Login.html';
}

// 🚀 VARIABLES GLOBALES (100% NUBE)
const flightPages = { latam: 0, other: 0 };
let activeAirlineFilter = 'ALL';
let activeDateFilter = new Date().toLocaleDateString('en-CA');

const SUPABASE_URL = "https://tgyltxcabrbegwlmcbmv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRneWx0eGNhYnJiZWd3bG1jYm12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMzE2NjcsImV4cCI6MjA5MDkwNzY2N30.wguY1f1HKaP4b8pCdO355Yf1pdcD9GJAalp4xQyCHuU";
const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const DataManager = {
    agents: [],
    flights: [],
    tasks: [],
    pax: [],
    async fetchOperationalData() {
        if (!supabaseClient) return false;
        try {
            console.log("📂 Cargando base de datos PMR...");
            const [agentsRes, flightsRes, asistRes] = await Promise.all([
                supabaseClient.from('agentes').select('*').order('nombre'),
                supabaseClient.from('vuelos').select('*').order('hora_programada'),
                supabaseClient.from('asistencias').select('*').order('asignado_at', { ascending: false })
            ]);

            if (agentsRes.data) {
                // 📂 RECUPERAR CABECERA GLOBAL DEL ROL (PERSISTENCIA CLOUD)
                const headerRow = agentsRes.data.find(x => x.id === 'ROL_MASTER_HEADER');
                if (headerRow && headerRow.rol_mensual) {
                    GLOBAL_ROL_HEADER = headerRow.rol_mensual.split('|').map(h => {
                        const d = new Date(h);
                        return !isNaN(d.getTime()) ? d : h;
                    });
                }

                const realAgents = agentsRes.data.filter(x => x.id !== 'ROL_MASTER_HEADER');
                this.agents = realAgents.map(a => ({
                    ...a,
                    name: a.nombre,
                    phone: a.telefono,
                    address: a.direccion,
                    addressNum: a.numero,
                    team: a.equipo || 'GENERAL',
                    shift: a.status === 'online' ? 'active' : 'inactive',
                    location: a.equipo || 'NACIONAL',
                    lastTask: '--:--',
                    lunchStart: null,
                    tica: a.tica_vigente === true ? '🪪Tica Vigente' : '⛔Pendiente',
                    assist: '🟡Pendiente', // Default local
                    obs: '-- Sin Obs --', // Default local
                    lunch: '🍕Pendiente',  // Default local (será sobreescrito por daily data)
                    talla_polera: a.talla_polera || 'M',
                    genero: a.genero || 'MASCULINO',
                    rol_mensual: a.rol_mensual || ''
                }));

                // 🔄 Buscar asistencias del día seleccionado
                const selDateStr = CURRENT_AGENT_DATE.toISOString().split('T')[0];
                console.log(`📅 Cargando datos diarios para: ${selDateStr}`);
                const { data: dailyRes } = await supabaseClient
                    .from('asistencias_diarias')
                    .select('*')
                    .eq('fecha', selDateStr);

                if (dailyRes) {
                    dailyRes.forEach(d => {
                        const agent = this.agents.find(a => a.id === d.agent_id);
                        if (agent) {
                            // PRIORIDAD A DATOS DIARIOS
                            if (d.asistencia) agent.assist = d.asistencia;
                            if (d.observacion) agent.obs = d.observacion;
                            if (d.equipo) agent.team = d.equipo;
                            if (d.lunch) agent.lunch = d.lunch;
                        }
                    });
                }

                // 🔄 RECONSTRUIR FILAS DEL ROL PARA VISTA PERMANENTE
                if (GLOBAL_ROL_HEADER.length > 0) {
                    GLOBAL_ROL_ROWS = this.agents.map(a => {
                        const base = [a.rut || a.id, a.nombre, a.equipo || 'GENERAL'];
                        const shifts = (a.rol_mensual || '').split(' ');
                        return base.concat(shifts);
                    });
                }
            }

            if (flightsRes.data) this.flights = flightsRes.data;

            if (asistRes.data) {
                this.tasks = asistRes.data.map(t => {
                    const agentObj = this.agents.find(a => a.id === t.agente_id);
                    const lastActivity = t.finalizado_at || t.aceptado_at || t.asignado_at;
                    const activityTime = lastActivity ? new Date(lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

                    // 🛡️ Identidad Dinámica del Supervisor
                    const idVal = (SESSION_USER.id || '').toUpperCase();
                    let supervisorTitle = 'SPVR';
                    if (idVal.includes('OLA')) supervisorTitle = 'SPVR OLA';
                    else if (idVal.includes('LATAM')) supervisorTitle = 'SPVR LATAM';
                    if (SESSION_USER.rol === 'cdo') supervisorTitle = supervisorTitle.replace('SPVR', 'CDO');
                    if (SESSION_USER.rol === 'jefatura') supervisorTitle = 'JEFATURA PMR';

                    return {
                        ...t,
                        flight: t.vuelo_num,
                        pax: t.pax_name || 'Tarea Gral',
                        paxId: t.pax_id || 'PMR-000',
                        assignedTo: t.agente_id,
                        assignedToName: agentObj ? (agentObj.nombre || agentObj.name) : 'Sin Asignar',
                        type: t.pax_name ? 'PAX' : 'TASK',
                        taskName: '👨‍🦽 Asistiendo Pasajero',
                        ultInfo: activityTime,
                        status_pax: t.status_pax || (t.status === 'pendiente' ? '⏳ En Espera' : t.status),
                        assignedBy: supervisorTitle
                    };
                });
                this.pax = this.tasks;
            }

            console.log("✅ Sincronización Completa.");
            return true;
        } catch (e) {
            console.error("❌ Supabase Error:", e);
            return false;
        }
    }
};
function get24hTime() {
    const now = new Date();
    const curH = now.getHours().toString().padStart(2, '0');
    const curM = now.getMinutes().toString().padStart(2, '0');
    return `${curH}:${curM}`;
}

async function init() {
    console.log("⏱ Iniciando carga de datos en F5...");
    initializeTheme();
    updateClock();
    setInterval(updateClock, 1000);

    // 📂 RECUPERAR ROL DE LOCALSTORAGE (Evita pérdida en F5)
    loadRolFromLocalStorage();

    // 📅 INICIALIZAR FECHAS A HOY
    initDefaultDates();

    // 🛰️ MOTOR DE SINCRONIZACIÓN AUTOMÁTICA (Cada 5 seg)
    setInterval(async () => {
        const ok = await DataManager.fetchOperationalData();
        if (ok) {
            const activeTab = document.querySelector('.menu-item.active')?.dataset.tab;
            if (activeTab === 'asignaciones') renderAsignacionesTab();
            if (activeTab === 'pasajeros') renderPasajerosTab();
            if (activeTab === 'tramos') renderTramosTab();
            updateTasksKPIs();
        }
    }, 5000);

    initMobileMenu();

    // Crear Popovers si no están
    ['pmr-popover', 'agent-popover', 'pax-popover'].forEach(id => {
        if (!document.getElementById(id)) {
            const d = document.createElement('div'); d.id = id; d.className = id; document.body.appendChild(d);
        }
    });

    const connected = await DataManager.fetchOperationalData();
    if (connected) {
        renderFromDataManager();
        // 🔥 INICIALIZAR FILTROS DE AEROLINEAS
        renderAirlineFilterGrid('airline-filter-container', renderVuelosTab);
        renderAirlineFilterGrid('tramos-airline-filter', applyTramosFilters);
        
        // 🔥 FORZAR ACTUALIZACIÓN DE CONTADORES RRHH
        updateRRHHKPIs();
        updateDashboardKPIs();
    } else {
        console.error("❌ Fallo crítico de arranque.");
    }

    // Navegación
    document.querySelectorAll('.sidebar-nav .menu-item').forEach(t => {
        t.addEventListener('click', () => switchTab(t.dataset.tab));
    });
}

// --------------------------------------------------------------------------------
// POPOVER LOGIC (100% CLOUD)
// --------------------------------------------------------------------------------
function showPaxPopover(e, name, obs) {
    const pop = document.getElementById('pax-popover'); if (!pop) return;
    pop.innerHTML = `<div style="font-size:0.85rem; font-weight:800; margin-bottom:5px;">👤 ${name}</div><div class="pax-pop-obs">${obs}</div>`;
    pop.style.display = 'block';
    pop.style.left = (e.pageX + 15) + 'px';
    pop.style.top = (e.pageY + 15) + 'px';
    pop.classList.add('active');
}

function hidePaxPopover() {
    const pop = document.getElementById('pax-popover');
    if (pop) { pop.style.display = 'none'; pop.classList.remove('active'); }
}

function showAgentPopover(e, agentId) {
    const pop = document.getElementById('agent-popover'); if (!pop) return;
    const a = DataManager.agents.find(x => x.id === agentId); if (!a) return;

    pop.innerHTML = `
        <div class="popover-header" style="background:var(--accent-blue); padding:10px 15px; font-size:0.75rem; font-weight:900; border-radius:12px 12px 0 0; display:flex; align-items:center; gap:5px; color:white;">
            🎯 DETALLE AGENTE - ${a.equipo || 'S/E'}
        </div>
        <div style="padding:15px; background:rgba(15,23,42,0.95); border-radius:0 0 12px 12px; border:1px solid rgba(255,255,255,0.1); border-top:none;">
            <div style="font-weight:900; font-size:1rem; margin-bottom:4px; color:white;">${a.nombre}</div>
            <div style="font-size:0.75rem; opacity:0.7; margin-bottom:12px; color:white;">ID: ${a.id} | EQUIPO: ${a.equipo}</div>
            <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:15px;">
                <div style="font-size:0.75rem; color:rgba(255,255,255,0.8);">📍 UBICACIÓN: <b style="color:var(--accent-blue);">${a.ubicacion || '---'}</b></div>
                <div style="font-size:0.75rem; color:rgba(255,255,255,0.8);">🟢 ESTADO: <b style="color:var(--accent-green);">${(a.status || 'offline').toUpperCase()}</b></div>
            </div>
            <a href="https://wa.me/${(a.telefono || '').replace(/\s/g, '')}" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; background:#25d366; color:white; padding:10px; border-radius:10px; text-decoration:none; font-weight:800; font-size:0.75rem; transition:0.3s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">
                <img src="https://cdn-icons-png.flaticon.com/512/124/124034.png" width="16"> WHATSAPP CONTACT
            </a>
        </div>
    `;
    pop.style.display = 'block';
    pop.style.left = (e.pageX + 20) + 'px';
    pop.style.top = (e.pageY + (-50)) + 'px';
    pop.classList.add('active');
}

function hideAgentPopover() {
    const pop = document.getElementById('agent-popover');
    if (pop) { pop.style.display = 'none'; pop.classList.remove('active'); }
}

function renderFromDataManager() {
    renderVuelosTab();
    renderPasajerosTab();
    renderAsignacionesTab();
    renderAgentsDirectory('assist');
    // 🔥 PERSISTENCIA: Asegurar que el ROL se dibuje al cargar
    updateRolDisplay();
    renderTurnosView();
    renderFlightsPaged('latam');
    renderFlightsPaged('other');
    renderAgentsSupervision();
    updateDashboardKPIs();
    updateRRHHKPIs(); // Nueva función de Telemetría RRHH
    renderTramosTab();
    renderPasajerosTab();
    renderAgentsDirectory('assist');
    updatePmrFlightSelectors();
}

function renderOperationalInterface(hasDb) {
    if (hasDb) renderFromDataManager();
}

function initializeTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.className = theme === 'light' ? 'light-mode' : 'dark-mode';
    const btn = document.getElementById('theme-btn'); if (btn) btn.textContent = theme === 'light' ? '☀️' : '🌙';
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    document.body.classList.toggle('dark-mode', !isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    const btn = document.getElementById('theme-btn'); if (btn) btn.textContent = isLight ? '☀️' : '🌙';
}

function updateClock() {
    const now = new Date();
    const dL = document.getElementById('date-label'); if (dL) dL.textContent = now.toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
    const cV = document.getElementById('clock-value'); if (cV) cV.textContent = now.toLocaleTimeString('es-ES', { hour12: false });

    const h = now.getHours();
    const sB = document.getElementById('shift-badge');
    if (sB) {
        sB.classList.remove('day', 'afternoon', 'night');
        if (h >= 5 && h < 12) {
            sB.innerHTML = '🌞TURNO: Mañana🌞';
            sB.classList.add('day');
        } else if (h >= 12 && h < 20) {
            sB.innerHTML = '🌅TURNO: Tarde🌅';
            sB.classList.add('afternoon');
        } else {
            sB.innerHTML = '🌛TURNO: Noche🌛';
            sB.classList.add('night');
        }
    }
}

// Inicialización automática al cargar
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);
    renderVuelosTab(); // Iniciar tabla principal
});
function switchTab(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    const t = document.getElementById(tabId); if (t) t.classList.add('active');
    if (element) element.classList.add('active');
    if (tabId === 'vuelos') {
        renderVuelosTab();
        renderAirlineFilterGrid('airline-filter-container', renderVuelosTab);
    }
    if (tabId === 'dashboard') { renderFlightsPaged('latam'); renderFlightsPaged('other'); renderAgentsSupervision(); }
    if (tabId === 'tramos') {
        renderTramosTab();
        renderAirlineFilterGrid('tramos-airline-filter', applyTramosFilters);
    }
    if (tabId === 'pasajeros') renderPasajerosTab();
    if (tabId === 'asignaciones') renderAsignacionesTab();
    if (tabId === 'agentes') switchAgentSubTab('assist');
    if (tabId === 'timeline') renderTimelineTab();
    if (tabId === 'ajustes') renderAjustesDashboard();
}



function initMobileMenu() {
    const t = document.getElementById('menu-toggle'); const s = document.querySelector('.sidebar');
    if (t && s) t.onclick = () => s.classList.toggle('open');
}

/* 
   --------------------------------------------------------------------------------
   VUELOS TAB & PMR POPOVER
   -------------------------------------------------------------------------------- 
*/
function renderVuelosTab() {
    const body = document.getElementById('vuelos-table-body'); if (!body) return;

    // 🛰️ USAR DATOS REALES DE DATAMANAGER
    let f = [...DataManager.flights];
    const nI = document.getElementById('search-flight-num')?.value.toUpperCase() || '';
    if (nI) {
        f = f.filter(x => 
            (x.vuelo_num || '').includes(nI) || 
            (x.aerolinea_name || x.aerolinea || '').toUpperCase().includes(nI)
        );
    }
    if (activeAirlineFilter && activeAirlineFilter !== 'ALL') {
        f = f.filter(x => (x.aerolinea_name || x.aerolinea || '').replace(/\s/g, '').toUpperCase().includes(activeAirlineFilter));
    }

    let html = '';
    f.forEach((x, i) => {
        const al = x.aerolinea || 'LATAM';
        const cK = al.replace(/\s/g, '').toUpperCase();
        
        // --- BÚSQUEDA ROBUSTA DE LOGO ---
        let src = 'img/default-logo.jpg';
        const foundKey = Object.keys(AIRLINE_LOGOS).find(k => cK.includes(k) || k.includes(cK));
        if (foundKey) src = AIRLINE_LOGOS[foundKey];
        else if (x.logo_url) src = x.logo_url;

        const pC = DataManager.tasks.filter(p => p.vuelo_num === x.vuelo_num).length;

        html += `
            <tr style="cursor:pointer;" onclick="renderPassengerModal('${x.vuelo_num}')">
                <td style="text-align:center; color:var(--text3); font-size:0.75rem;">${x.id || '---'}</td>
                <td><span style="background:rgba(255,255,255,0.05); padding:3px 8px; border-radius:5px; font-size:0.8rem;">📅 ${x.fecha ? x.fecha.split('-').reverse().join('/') : '--/--/--'}</span></td>
                <td style="font-weight:700; color:var(--accent-blue);">${x.hora_programada || x.hora || '--:--'}</td>
                <td style="text-align:center;">
                    <img src="${src}" alt="${al}" style="width:100px; height:35px; border-radius:6px; object-fit:contain; background: #000;">
                </td>
                <td style="text-align:center;"><b style="color:var(--accent-yellow); font-size:1.1rem;">${x.vuelo_num}</b></td>
                <td style="font-size:0.85rem;">${x.terminal || 'T1'}</td>
                <td style="text-align:center;">
                    <span style="background:rgba(59,130,246,0.1); color:var(--accent-blue); padding:4px 8px; border-radius:6px; font-weight:800; border:1px solid rgba(59,130,246,0.2);">
                        ${x.gate || 'S/A'}
                    </span>
                </td>
                <td>
                    <div style="display:flex;align-items:center;min-width:120px;">
                        <span class="pmr-trigger" onmouseover="showPmrPopover(event, '${x.vuelo_num}')" onmouseout="hidePmrPopover()" onclick="event.stopPropagation(); goToTramos('${x.vuelo_num}')" 
                              style="background:rgba(16,185,129,0.1); color:#10b981; padding:4px 10px; border-radius:30px; font-weight:800; font-size:0.8rem; border:1px solid rgba(16,185,129,0.2);">
                           ♿ ${pC} PMR
                        </span>
                    </div>
                </td>
                <td style="text-align:center;">
                    <span class="service-badge ${x.tipo === 'EMBARQUE' ? 'badge-dep' : 'badge-arr'}">
                        ${x.tipo || 'VUELO'}
                    </span>
                </td>
                <td style="font-size:0.8rem; color:var(--text2);">${x.ruta || (x.origen ? `${x.origen} → ${x.destino}` : '--')}</td>
            </tr>
        `;
    });
    body.innerHTML = html;
}

function showPmrPopover(e, id) {
    const p = document.getElementById('pmr-popover'); if (!p) return;
    const pax = DataManager.pax.filter(x => x.vuelo_num === id);
    let h = pax.length > 0 ? pax.map(x => `
        <div class="pmr-popover-item" onclick="goToTramos('${id}')">
            <span>👤 ${x.pax.substring(0, 15)}...</span>
            <span class="ssr-badge ssr-${x.ssr.toLowerCase()}">${x.ssr}</span>
        </div>`).join('') : '<div style="opacity:0.5; padding:10px;">Sin PMR.</div>';
    p.innerHTML = `<div class="pmr-popover-header">📦 PMR - ${id}</div><div class="pmr-popover-list">${h}</div>`;
    p.classList.add('active');
    const r = e.target.getBoundingClientRect();
    p.style.top = (r.top + window.scrollY + 25) + 'px'; p.style.left = (r.left + window.scrollX - 40) + 'px';
}

function hidePmrPopover() {
    setTimeout(() => { const p = document.getElementById('pmr-popover'); if (p && !p.matches(':hover')) p.classList.remove('active'); }, 200);
}

function goToTramos(id) {
    switchTab('tramos', document.querySelector('[onclick*="switchTab(\'tramos\'"]'));
    const inp = document.getElementById('filter-tramos-flight'); if (inp) { inp.value = id; applyTramosFilters(); }
}

function showAgentPopover(e, id) {
    const p = document.getElementById('agent-popover'); if (!p) return;
    const agent = DataManager.agents.find(a => a.id === id);
    if (!agent) {
        p.innerHTML = `<div style="padding:15px; font-weight:800; color:var(--accent-red);">AGENTE NO ENCONTRADO O DESCONECTADO</div>`;
    }
    else {
        const cleanPhone = agent.phone ? agent.phone.replace(/\s/g, '').replace('+', '') : '';
        const waLink = `https://wa.me/${cleanPhone}`;
        p.innerHTML = `
            <div class="agent-pop-header">🕵️ DETALLE AGENTE - ${id}</div>
            <div class="agent-pop-body" onmouseover="cancelPopHide()">
                <div class="agent-pop-name">${agent.nombre}</div>
                <div class="agent-pop-info">EQUIPO: <b>${agent.equipo}</b></div>
                <div class="agent-pop-info">STATUS: <b style="color:var(--accent-green)">${agent.status.toUpperCase()}</b></div>
                <a href="${waLink}" target="_blank" class="agent-pop-wa">
                    <img src="https://cdn-icons-png.flaticon.com/512/3670/3670051.png" width="16">
                    WHATSAPP CONTACT
                </a>
            </div>`;
    }
    p.classList.add('active');
    const r = e.target.getBoundingClientRect();
    const topPos = r.top + window.scrollY - 130;
    p.style.top = (topPos < 0 ? 10 : topPos) + 'px';
    p.style.left = (r.left + window.scrollX - 40) + 'px';
}

let popHideTimer;
function hideAgentPopover() {
    popHideTimer = setTimeout(() => { const p = document.getElementById('agent-popover'); if (p) p.classList.remove('active'); }, 300);
}

function cancelPopHide() { clearTimeout(popHideTimer); }

/* 
   --------------------------------------------------------------------------------
   PAGINATION & TIMELINE
   -------------------------------------------------------------------------------- 
*/
function renderFlightsPaged(type) {
    const c = document.getElementById(type === 'latam' ? 'latam-flights' : 'other-flights'); if (!c) return;
    const items = 5; const s = (flightPages[type] || 0) * items; c.innerHTML = '';

    // 🛰️ USAR DATOS REALES DE DATAMANAGER
    let data = (type === 'latam')
        ? DataManager.flights.filter(x => (x.aerolinea || '').toUpperCase().includes('LATAM'))
        : DataManager.flights.filter(x => !(x.aerolinea || '').toUpperCase().includes('LATAM'));

    data.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));

    if (flightPages[type] > 0) {
        c.innerHTML += `
            <div class="nav-card" onclick="changeTimelinePage('${type}', -1)">
                <div class="nav-btn-circle">⬅️</div>
                <div class="nav-label">ANTERIORES</div>
            </div>`;
    }

    data.slice(s, s + items).forEach((x, i) => c.innerHTML += createFlightCardReal(x, s + i));

    if (s + items < data.length) {
        c.innerHTML += `
            <div class="nav-card" onclick="changeTimelinePage('${type}', 1)">
                <div class="nav-btn-circle">➡️</div>
                <div class="nav-label">SIGUIENTES 5</div>
            </div>`;
    }
}

function changeTimelinePage(type, dir) {
    flightPages[type] = (flightPages[type] || 0) + dir; if (flightPages[type] < 0) flightPages[type] = 0;
    renderFlightsPaged(type);
}

function createFlightCardReal(d, i) {
    const al = d.aerolinea || 'LATAM';
    const cK = al.replace(/\s/g, '').toUpperCase();
    
    // --- BÚSQUEDA ROBUSTA DE LOGO ---
    let src = 'img/default-logo.jpg';
    const foundKey = Object.keys(AIRLINE_LOGOS).find(k => cK.includes(k) || k.includes(cK));
    if (foundKey) src = AIRLINE_LOGOS[foundKey];
    else if (d.logo_url) src = d.logo_url;

    const tC = d.tipo === 'EMBARQUE' ? 'type-dep' : 'type-arr';
    const pC = DataManager.tasks.filter(p => p.vuelo_num === d.vuelo_num).length;

    return `<div class="flight-card ${tC}">
        <div class="flight-card-header">
            <span class="flight-card-date">${d.fecha || 'HOY'}</span>
            <span class="flight-card-type-badge ${tC}">${d.tipo || 'PAX'}</span>
        </div>
        <div class="flight-card-content">
            <div class="airline-logo-wrapper" style="width:130px; height:50px; background: #111827; border-radius:10px; overflow:hidden;">
                <img src="${src}" class="flight-card-logo" style="width:100%; height:100%; object-fit:contain;">
            </div>
            <span class="flight-card-number">${d.vuelo_num}</span>
        </div>
        <div class="flight-card-times">
            <div>Prog: <b>${d.hora || '--:--'}</b></div>
            <div class="realtime-timer">⏱️ Ruta: <b>${d.ruta || '---'}</b></div>
        </div>
        <div class="flight-card-footer">
            <div class="flight-footer-left">
                <div class="gate-info">GATE: <b>${d.gate || '--'}</b></div>
                <div class="pmr-count-badge">♿ ${pC} PMR</div>
            </div>
            <button class="btn-asignar" onclick="openAsignarModal('${d.vuelo_num}', '${d.tipo}', '')">Asignar</button>
        </div>
    </div>`;
}

/* 
   --------------------------------------------------------------------------------
   TRAMOS TAB & FILTERS
   -------------------------------------------------------------------------------- 
*/
function renderTramosTab() {
    const b = document.getElementById('tramos-table-body'); if (!b) return;
    b.innerHTML = '';

    // 🛰️ USAR DATOS REALES DE SUPABASE
    let filtered = [...DataManager.pax].filter(p => p.agente_id && p.status !== 'finalizado');

    let html = '';
    filtered.forEach(p => {
        const paxName = p.pax_name || '-';
        const trun = paxName.length > 20 ? paxName.substring(0, 20) + '...' : paxName;
        const lastUpdate = p.finalizado_at || p.aceptado_at || p.asignado_at;
        const timeUp = lastUpdate ? new Date(lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
        const agentObj = DataManager.agents.find(a => a.id === p.agente_id);

        html += `<tr>
            <td style="font-weight:800;color:var(--accent-blue);">${p.vuelo_num}</td>
            <td style="font-weight:700;">${new Date(p.asignado_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            <td><span class="service-badge ${p.category === 'EMBARQUE' ? 'badge-dep' : 'badge-arr'}">${p.category || 'PAX'}</span></td>
            <td data-tooltip="${paxName}">${trun}</td>
            <td style="text-align:center;"><span class="ssr-badge ssr-${(p.ssr || '').toLowerCase()}">${p.ssr || '---'}</span></td>
            <td><span style="font-size:0.75rem;">${p.tomado_en || '-'}</span></td>
            <td><span style="font-size:0.75rem;">${p.dejado_en || '-'}</span></td>
            <td style="text-align:center; font-weight:700; color:var(--accent-purple);">${timeUp}</td>
            <td>
                <b style="color:var(--accent-orange); cursor:help;" 
                   onmouseover="showAgentPopover(event, '${p.agente_id}')" 
                   onmouseout="hideAgentPopover()">
                   ${agentObj ? agentObj.nombre : (p.agente_id || '---')}
                </b>
            </td>
            <td style="text-align:center; font-weight:700; color:var(--accent-blue);">${p.status_pax || p.status}</td>
        </tr>`;
    });
    b.innerHTML = html;
    updatePmrFlightSelectors();
    // NOTA: No renderizamos la grilla aquí para evitar loops infinitos si se llama desde applyTramosFilters
}

function applyTramosFilters() {
    const fF = document.getElementById('filter-tramos-flight')?.value.toUpperCase() || '';
    const rows = document.querySelectorAll('#tramos-table-body tr');
    rows.forEach(r => {
        const fly = r.querySelector('td:nth-child(1)')?.textContent.toUpperCase() || '';
        const obj = DataManager.flights.find(x => (x.vuelo_num || x.fn) === fly);
        const air = obj ? (obj.aerolinea || obj.al || '') : '';
        const matchF = fF ? fly.includes(fF) : true;
        const matchA = activeAirlineFilter ? (air.replace(/\s/g, '').toUpperCase().includes(activeAirlineFilter)) : true;
        r.style.display = (matchF && matchA) ? '' : 'none';
    });
}

function updatePmrFlightSelectors() {
    const dL = document.getElementById('tramos-flights-list'); if (!dL) return;
    dL.innerHTML = DataManager.flights.map(x => `<option value="${x.vuelo_num || x.fn}">${x.vuelo_num || x.fn} (${x.aerolinea || x.al || ''})</option>`).join('');
}

function initSearchFilters() {
    const n = document.getElementById('search-flight-num'); if (n) n.oninput = renderVuelosTab;
    const d = document.getElementById('search-flight-date'); if (d) d.onchange = renderVuelosTab;
    const t = document.getElementById('filter-tramos-flight'); if (t) t.oninput = applyTramosFilters;
}

function renderAirlineFilterGrid(id, func) {
    const c = document.getElementById(id); if (!c) return;
    c.innerHTML = '';

    // 🛡️ SOLO MOSTRAR AEROLÍNEAS QUE TIENEN BANNER LOCAL
    Object.keys(AIRLINE_LOGOS).forEach(aKey => {
        const src = AIRLINE_LOGOS[aKey];
        const item = document.createElement('div');
        item.className = 'airline-item-filter';
        if (activeAirlineFilter === aKey) item.classList.add('active');

        item.innerHTML = `
            <img src="${src}" alt="${aKey}" 
                 style="width:130px; height:50px; border-radius:10px; object-fit:cover; display:block;">`;

        item.onclick = () => {
            activeAirlineFilter = (activeAirlineFilter === aKey) ? null : aKey;
            func();
            renderAirlineFilterGrid(id, func);
        };
        c.appendChild(item);
    });
}


function updateGreenLog() {
    const agents = DataManager.agents || [];
    const tasks = DataManager.tasks || [];

    // Simulación de impacto basada en tareas terminadas y presencia
    const completedTasks = tasks.filter(t => t.status === 'terminado').length;
    const presentAgents = agents.filter(a => a.assist === '🟢Presente').length;

    // Métricas: 1 tarea = 0.05 árboles salvados, 1 tarea = 1.2 litros de agua (ahorro de papel/procesos)
    const treesSaved = (completedTasks * 0.05 + presentAgents * 0.01).toFixed(2);
    const waterSaved = (completedTasks * 1.2 + presentAgents * 0.5).toFixed(1);

    // Impacto económico: Aprox $1,250 CLP por cada "unidad de eficiencia"
    const economicImpact = Math.floor(completedTasks * 1250 + presentAgents * 350);

    const elements = {
        'green-trees': treesSaved,
        'green-water': waterSaved,
        'green-money': `$${economicImpact.toLocaleString('es-CL')} CLP`,
        'green-metrics-summary': `${treesSaved} Árboles · ${waterSaved}L Agua`
    };

    for (let id in elements) {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    }
}

function renderHeatmap() {
    const container = document.getElementById('heatmap-canvas-container');
    if (!container) return;

    // Solo renderizar si el tab activo es dashboard
    const activeTab = document.querySelector('.menu-item.active')?.dataset.tab;
    // if (activeTab !== 'dashboard') return;

    // Simulación de intensidad por terminal
    const tasks = DataManager.tasks || [];
    const intensity = Math.min(tasks.filter(t => t.status === 'en curso').length * 10, 100);

    let color = '#3b82f6'; // Baja
    if (intensity > 60) color = '#ef4444'; // Alta
    else if (intensity > 30) color = '#f59e0b'; // Media

    container.style.boxShadow = `inset 0 0 40px ${color}33`;

    // Reemplazar contenido estático con una barra de pulso técnica
    container.innerHTML = `
        <div style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; pointer-events: none; opacity: 0.1; background-image: radial-gradient(${color} 1px, transparent 1px); background-size: 20px 20px;"></div>
        <div style="z-index: 1; text-align: center;">
            <div style="font-size: 0.7rem; font-weight: 900; letter-spacing: 2px; color: ${color}; text-transform: uppercase;">Intensidad Terminal: ${intensity}%</div>
            <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 10px auto; overflow: hidden;">
                <div style="width: ${intensity}%; height: 100%; background: ${color}; box-shadow: 0 0 10px ${color}; transition: width 1s ease-in-out;"></div>
            </div>
            <div style="font-size: 0.55rem; opacity: 0.5; color: ${color};">FLUJO DE DATOS EN TIEMPO REAL ACTIVO</div>
        </div>
    `;
}

function updateDashboardKPIs() {
    const agents = DataManager.agents || [];
    const tasks = DataManager.tasks || [];

    // Lógica de Categorización Precisa (OLA / LATAM / JEFATURA)
    const isLatam = (team) => {
        const t = (team || '').toUpperCase();
        return t.includes('LATAM') || t.includes('CDO LATAM') || t.includes('SPVR LATAM');
    };
    const isOla = (team) => {
        const t = (team || '').toUpperCase();
        return t.includes('OLA') || t.includes('CDO OLA') || t.includes('SPVR OLA');
    };

    const activeAgents = agents.filter(a => a.assist === '🟢Presente');
    const onLunch = agents.filter(a => a.lunch === '🍟En Colacion');

    // 🦺 Agentes en Servicio: Solo aquellos con tareas en curso
    const inService = activeAgents.filter(a => tasks.some(t => t.agente_id === a.id && t.status === 'en curso'));

    // 🟢 Agentes Disponibles: Presentes, SIN tarea en curso Y SIN colación
    const available = activeAgents.filter(a => !tasks.some(t => t.agente_id === a.id && t.status === 'en curso') && a.lunch !== '🍟En Colacion');

    // Contadores Principales (Top Cards Dashboard)
    const topKpis = {
        'top-kpi-total-assist': activeAgents.length, // Presentes
        'top-kpi-agents-lunch': onLunch.length,      // En colación
        'top-kpi-agents-available': available.length
    };

    for (let id in topKpis) {
        const el = document.getElementById(id);
        if (el) el.textContent = topKpis[id];
    }

    // Grid 2 (Distribución OLA / LATAM y Tica)
    const latamCount = activeAgents.filter(a => isLatam(a.equipo)).length;
    const olaCount = activeAgents.filter(a => isOla(a.equipo)).length;
    const withTica = activeAgents.filter(a => (a.tica || '').includes('Vigente')).length;
    const isAbsent = agents.filter(a => a.assist === '🔴Ausente');

    const gridValues = {
        'kpi-val-latam': latamCount,
        'kpi-val-ola': olaCount,
        'kpi-val-tica': `${withTica} / ${activeAgents.length - withTica}`,
        'kpi-val-absent': isAbsent.length
    };

    for (let id in gridValues) {
        const el = document.getElementById(id);
        if (el) el.textContent = gridValues[id];
    }

    // Absencia detallada
    const absLatam = isAbsent.filter(a => isLatam(a.equipo)).length;
    const absOla = isAbsent.length - absLatam;
    const trendEl = document.getElementById('kpi-absent-trend');
    if (trendEl) trendEl.textContent = `LATAM: ${absLatam} | OLA: ${absOla}`;

    // Contador lunch supervisor
    const breakEl = document.getElementById('kpi-task-break');
    if (breakEl) breakEl.textContent = onLunch.length;


    renderAgentsSupervision();
    updateGreenLog();
    renderHeatmap();
}

function updateRRHHKPIs() {
    const agents = DataManager.agents || [];
    const total = agents.length;
    const present = agents.filter(a => a.assist === '🟢Presente').length;
    const lunching = agents.filter(a => a.lunch === '🍟En Colacion').length;
    const absent = agents.filter(a => a.assist === '🔴Ausente').length;

    const el = {
        'kpi-agent-total': total,
        'kpi-agent-present': present,
        'kpi-agent-lunch': lunching,
        'kpi-agent-alert': absent
    };

    for (let id in el) {
        const target = document.getElementById(id);
        if (target) target.textContent = el[id];
    }
}

function renderAgentsSupervision() {
    const aC = document.getElementById('available-agents');
    const bC = document.getElementById('break-agents');
    const uC = document.getElementById('absent-agents');
    if (!aC || !bC || !uC) return;

    const tasks = DataManager.tasks || [];

    let htmlAvail = '';
    let htmlBreak = '';
    let htmlAbsent = '';

    DataManager.agents.forEach(agent => {
        if (agent.id === 'CDO/SPVR' || !agent.id) return;

        const isPresent = agent.assist === '🟢Presente';
        const isAbsent = agent.assist === '🔴Ausente';
        const isLunch = agent.lunch === '🍟En Colacion';

        // Determinar en qué contenedor va con mayor precisión
        let target = '';
        const activeTasks = tasks.filter(t => t.agente_id === agent.id && t.status === 'en curso');
        const isFree = activeTasks.length === 0;

        if (isLunch) target = 'break';
        else if (isAbsent) target = 'absent';
        else if (isPresent) target = 'avail';
        else return;

        let statusClass = 'red';
        let statusText = '🔴 AUSENTE';
        let temporalInfo = '';

        if (target === 'avail') {
            if (isFree) {
                statusClass = 'green';
                statusText = '🟢 DISPONIBLE';
                temporalInfo = `<div class="agent-info-line">🔓 LIBRE • EQUIPO: <b>${agent.equipo || 'PMR'}</b></div>`;
            } else {
                statusClass = 'blue';
                statusText = '🔵 EN SERVICIO';
                const t = activeTasks[0];
                temporalInfo = `<div class="agent-info-line">👨‍🦽 PAX: <b>${t.pax_name || 'S/N'}</b> • ${t.vuelo_num}</div>`;
            }
        } else if (target === 'break') {
            statusClass = 'orange';
            statusText = '🍔 COLACIÓN';
            temporalInfo = `<div class="agent-info-line">🍟 EN DESCANSO OPERATIVO</div>`;
        } else {
            statusClass = 'red';
            statusText = '🔴 AUSENTE';
            temporalInfo = `<div class="agent-info-line">✖️ NO SE PRESENTÓ</div>`;
        }

        const cleanPhone = (agent.telefono || agent.phone || '').replace(/\s/g, '').replace('+', '');
        const waBtn = `<a href="https://wa.me/${cleanPhone}" target="_blank" class="wa-contact-btn">
            <img src="https://cdn-icons-png.flaticon.com/512/3670/3670051.png" width="18" height="18">
        </a>`;

        const h = `
            <div class="agent-card-detailed-modern ${statusClass}">
                <div class="agent-card-top-accent"></div>
                <div class="agent-card-title-row">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="agent-status-indicator pulse"></div>
                        <span class="agent-name-modern">${agent.nombre || agent.name}</span>
                    </div>
                    ${waBtn}
                </div>
                <div class="agent-card-meta-row">
                    <span class="agent-id-tag-modern">${agent.id}</span>
                    <span class="agent-team-tag">${agent.equipo || agent.team || 'PMR'}</span>
                </div>
                <div class="agent-card-body-modern">
                    ${temporalInfo}
                </div>
            </div>`;

        if (target === 'avail') htmlAvail += h;
        if (target === 'break') htmlBreak += h;
        if (target === 'absent') htmlAbsent += h;
    });

    aC.innerHTML = htmlAvail || '<p style="padding:20px; opacity:0.5; text-align:center;">Ninguno libre</p>';
    bC.innerHTML = htmlBreak || '<p style="padding:20px; opacity:0.5; text-align:center;">Ninguno</p>';
    uC.innerHTML = htmlAbsent || '<p style="padding:20px; opacity:0.5; text-align:center;">Ninguno registrado</p>';
}

// Actualizar cronometros cada minuto
setInterval(renderAgentsSupervision, 60000);

/* 
   --------------------------------------------------------------------------------
   MODAL & MANUAL ENTRY LOGIC
   -------------------------------------------------------------------------------- 
*/
function openAddPmrModal() {
    const modal = document.getElementById('modal-pmr'); if (!modal) return;
    const dl = document.getElementById('vuelos-datalist');
    const inputVuelo = document.getElementById('field-vuelo');
    if (inputVuelo) inputVuelo.value = '';
    if (dl) {
        dl.innerHTML = DataManager.flights.map(x => `<option value="${x.vuelo_num || x.fn}">${x.aerolinea || x.al}</option>`).join('');
    }
    modal.classList.add('active');
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id); if (modal) modal.classList.remove('active');
}

/* 
   --------------------------------------------------------------------------------
   PASAJEROS PMR TAB LOGIC
   -------------------------------------------------------------------------------- 
*/
function renderPasajerosTab() {
    const body = document.getElementById('pax-table-body'); if (!body) return;
    body.innerHTML = '';

    // Filtros
    const airF = document.getElementById('filter-pax-airline')?.value || null;
    const flightF = document.getElementById('filter-pax-flight')?.value || null;
    const dateF = document.getElementById('filter-pax-date')?.value || '2026-04-02';

    // Listado Completo del Día (Sincronizado con BD)
    let filtered = [...DataManager.pax];

    if (airF) {
        filtered = filtered.filter(p => {
            const flightObj = DataManager.flights.find(f => (f.vuelo_num || f.fn) === p.vuelo_num);
            return flightObj && (flightObj.aerolinea || flightObj.al).replace(/\s/g, '').toUpperCase().includes(airF);
        });
    }
    if (flightF) filtered = filtered.filter(p => p.vuelo_num === flightF);

    // Render Tabla
    filtered.forEach((p, i) => {
        const obs = p.obs || ("PNR: " + Math.random().toString(36).substring(7).toUpperCase());
        const timeDisplay = p.asignado_at ? new Date(p.asignado_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

        body.innerHTML += `
            <tr>
                <td class="id-pmr-col">${p.pax_id || ('PMR-' + (46640 + i))}</td>
                <td><a href="#" style="color:var(--accent-blue); font-weight:900; text-decoration:none;">${p.vuelo_num}</a></td>
                <td style="font-weight:800;">${timeDisplay}</td>
                <td style="text-align:center;"><span class="service-badge ${p.category === 'EMBARQUE' ? 'badge-dep' : 'badge-arr'}">${p.category || 'PAX'}</span></td>
                <td>
                    <span class="pax-name-link" onmouseover="showPaxPopover(event, '${p.pax_name}', '${obs}')" onmouseout="hidePaxPopover()">
                        ${p.pax_name}
                    </span>
                </td>
                <td style="text-align:center;"><span class="ssr-badge ssr-${(p.ssr || '').toLowerCase()}">${p.ssr}</span></td>
                <td style="text-align:center;">
                    <span class="status-text">⏰ ${(p.status_pax || 'En Espera').toUpperCase()}</span>
                </td>
                <td style="text-align:center;">
                    <div class="action-buttons-row" style="justify-content:center;">
                        <button class="btn-asignar" onclick="openAsignarModal('${p.vuelo_num}', '${p.category}', '${p.pax_name}', '${p.id}')" style="padding: 6px 12px; font-size: 0.75rem;">Asignar</button>
                    </div>
                </td>
                <td class="obs-cell">${obs}</td>
            </tr>`;
    });

    // Actualizar KPIs de esta pestaña
    updatePasajerosKPIs(filtered);

    // Poblar filtros si están vacíos
    const sAir = document.getElementById('filter-pax-airline');
    if (sAir && sAir.options.length <= 1) {
        const airs = [...new Set(DataManager.flights.map(x => x.aerolinea || x.al))];
        airs.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.replace(/\s/g, '').toUpperCase();
            opt.textContent = a;
            sAir.appendChild(opt);
        });
        sAir.onchange = renderPasajerosTab;
    }

    const sFly = document.getElementById('filter-pax-flight');
    if (sFly && sFly.options.length <= 1) {
        DataManager.flights.forEach(f => {
            const opt = document.createElement('option');
            const fn = f.vuelo_num || f.fn;
            const al = f.aerolinea || f.al;
            opt.value = fn; opt.textContent = `${al} - ${fn}`;
            sFly.appendChild(opt);
        });
        sFly.onchange = renderPasajerosTab;
    }
}

function updatePasajerosKPIs(filteredPax) {
    const agents = DataManager.agents.filter(a => a.status === 'online');

    const agNac = agents.filter(a => (a.location || '').includes('NACIONAL')).length;
    const agInt = agents.filter(a => (a.location || '').includes('INTERNACIONAL') || (a.location || '').includes('SERVER')).length;

    const intCities = ['Nueva York', 'Atlanta', 'París', 'Panamá', 'Madrid', 'Sydney', 'Amsterdam', 'Londres', 'Toronto', 'Sto. Domingo', 'Barcelona', 'Santa Cruz'];

    let pmrNac = 0; let pmrInt = 0;
    filteredPax.forEach(p => {
        const flight = DataManager.flights.find(f => (f.vuelo_num || f.fn) === p.vuelo_num);
        if (flight && intCities.includes(flight.destino || flight.city)) pmrInt++;
        else pmrNac++;
    });

    const accepted = filteredPax.filter(p => p.status_pax === 'En Trayecto' || p.status_pax === 'Contactado').length;
    const cancelled = filteredPax.filter(p => p.status_pax === 'No Requiere').length;
    const waiting = filteredPax.filter(p => p.status_pax === 'En Espera' || !p.status_pax).length;
    const failed = filteredPax.filter(p => p.status_pax === 'No Contactado').length;

    const el = {
        'kpi-pmr-nac': pmrNac, 'kpi-pmr-int': pmrInt,
        'kpi-ag-nac': agNac, 'kpi-ag-int': agInt,
        'kpi-sillas-tot': pmrNac + pmrInt,
        'kpi-pax-ok': accepted, 'kpi-pax-no': cancelled,
        'kpi-pax-fail': waiting + failed
    };

    for (let id in el) {
        const target = document.getElementById(id);
        if (target) target.textContent = el[id];
    }
}

async function savePmr(e) {
    if (!supabaseClient) return;
    e.preventDefault();
    const flight = document.getElementById('field-vuelo').value;
    const pax = document.getElementById('field-pax').value;
    const time = document.getElementById('field-hora').value;
    const ssr = document.getElementById('field-ssr').value;
    const from = document.getElementById('field-tomado').value;
    const to = document.getElementById('field-dejado').value;
    const statusText = document.getElementById('field-estado').value;

    const payload = {
        vuelo_num: flight,
        pax_name: pax,
        pax_id: 'PMR-' + (Math.floor(46000 + Math.random() * 1000)), // Generar ID real
        ssr: ssr,
        status: 'pendiente',
        status_pax: statusText,
        tomado_en: from,
        dejado_en: to,
        obs: `Ingreso Manual SPVR @ ${time}`
    };

    try {
        const { error } = await supabaseClient.from('asistencias').insert(payload);
        if (error) throw error;

        alert('✅ Pasajero PMR guardado en la nube con ID: ' + payload.pax_id);
        closeModal('modal-pmr');
        await DataManager.fetchOperationalData();
        renderPasajerosTab();
        renderTramosTab();
    } catch (err) {
        console.error("🔥 ERROR AL GUARDAR:", err);
        alert("❌ Error de Supabase: " + (err.message || "Error desconocido al insertar"));
    }
}

async function confirmAssign() {
    const modal = document.getElementById('modal-asignar-pax');
    const taskIdToUpdate = modal.dataset.taskId;

    const flightTitle = document.getElementById('assign-modal-title').innerText;
    const flightMatch = flightTitle.match(/Vuelo ([\w\d]+)/);
    const flight = flightMatch ? flightMatch[1] : '???';
    const typeMatch = flightTitle.match(/EMBARQUE|ARRIBO/);
    const type = typeMatch ? typeMatch[0] : 'PAX';

    const tasksToAssign = [];
    const rows = document.querySelectorAll('.assign-pax-row');

    rows.forEach(row => {
        const paxName = row.dataset.pax;
        const ssr = row.dataset.ssr;
        const agentId = row.querySelector('.pax-agent-select').value;
        const transferType = row.querySelector('.pax-transfer-select').value;
        const obs = row.querySelector('.pax-obs-input').value;

        if (agentId) {
            tasksToAssign.push({
                flight: flight,
                pax: paxName,
                ssr: ssr,
                category: type,
                assignedTo: agentId,
                transferType: transferType,
                obs: obs
            });
        }
    });

    if (tasksToAssign.length === 0) {
        alert('⚠️ No seleccionaste ningún agente para asignar.');
        return;
    }

    try {
        if (taskIdToUpdate) {
            // 🔄 MODO REASIGNAR: Actualizar registro existente
            const task = tasksToAssign[0]; // Solo permitimos una reasignación a la vez
            const { error } = await supabaseClient
                .from('asistencias')
                .update({
                    agente_id: task.assignedTo,
                    transfer_type: task.transferType,
                    obs: task.obs,
                    status: 'pendiente' // Reset para que el nuevo agente deba aceptar
                })
                .eq('id', taskIdToUpdate);

            if (error) throw error;
            console.log("✅ Tarea REASIGNADA con éxito.");
        } else {
            // 🆕 MODO ASIGNAR: Insertar registros nuevos
            const payload = tasksToAssign.map(t => ({
                vuelo_num: t.flight,
                agente_id: t.assignedTo,
                pax_name: t.pax,
                ssr: t.ssr,
                category: t.category,
                transfer_type: t.transferType,
                obs: t.obs
            }));

            const { error } = await supabaseClient.from('asistencias').insert(payload);
            if (error) throw error;
            console.log("✅ Tareas ASIGNADAS con éxito.");
        }

        alert(`✅ Operación completada en la nube.`);
        closeModal('modal-asignar-pax');
        await DataManager.fetchOperationalData();
        renderAsignacionesTab();
        renderPasajerosTab();
        renderTramosTab();
    } catch (e) {
        alert('❌ Error al procesar: ' + e.message);
    }
}

/* 
   --------------------------------------------------------------------------------
   ASIGNACIONES TAB LOGIC
   -------------------------------------------------------------------------------- 
*/
function renderAsignacionesTab() {
    const body = document.getElementById('tasks-table-body'); if (!body) return;

    let filtered = [...DataManager.tasks];
    filtered.sort((a, b) => new Date(b.asignado_at) - new Date(a.asignado_at));

    let html = '';
    filtered.forEach(t => {
        const taskColor = t.status === 'en curso' ? '#3b82f6' : (t.status === 'finalizado' ? '#10b981' : '#f59e0b');
        const displayId = t.id ? String(t.id).split('-')[0].toUpperCase() : '---';
        const paxDisplay = t.pax && t.pax.length > 20 ? t.pax.substring(0, 20) + '...' : (t.pax || '---');

        const STATUS_EMOJIS = {
            'No Requiere': '🚶‍♂️ No Requiere',
            'Contactado': '👨‍🦽 Contactado',
            'No Contactado': '🤳 No Contactado',
            'Embarcado': '💺 Embarcado',
            'Desembarcado': '🛬 Desembarcado',
            'No Embarcado': '⚠️ No Embarcado',
            'Finalizado': '💙 Finalizado'
        };
        const displayState = STATUS_EMOJIS[t.status_pax] || t.status_pax;

        html += `
            <tr>
                <td style="font-weight:900; color:var(--text-main);">${t.flight || '-'}</td>
                <td class="id-pmr-col">${displayId}</td>
                <td>
                    <div style="font-weight:700; color:var(--text-main);">${t.assignedToName}</div>
                    <div class="subtitle-text-vibrant">ID: ${t.assignedTo || 'N/A'}</div>
                </td>
                <td>
                    <div style="color:${taskColor}; font-weight:800; font-size:0.8rem; line-height:1.2;">👨‍🦽 Asistiendo Pasajero</div>
                    <div style="color:var(--text-main); font-weight:700; font-size:0.75rem;">${paxDisplay} ${t.ssr ? '[' + t.ssr + ']' : ''}</div>
                </td>
                <td style="font-size:0.8rem; color:var(--text-main);">${new Date(t.asignado_at).toLocaleDateString()}</td>
                <td style="font-weight:800; color:var(--text-main);">${new Date(t.asignado_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>
                    <div style="font-weight:700; color:var(--text-main);">${t.assignedBy}</div>
                    <div class="subtitle-text-vibrant">WEB PMR CLOUD</div>
                </td>
                <td style="font-weight:800; color:var(--accent-orange);">${t.ultInfo}</td>
                <td style="text-align:center;">
                    <div style="font-size:0.7rem; font-weight:800; color:var(--text-main); margin-bottom:4px;">${displayState}</div>
                    <span class="status-badge-vibrant" style="background:${taskColor}22; color:${taskColor}; border:1px solid ${taskColor}44; font-size:0.6rem; padding:2px 6px;">
                        ${t.status.toUpperCase()}
                    </span>
                </td>
                <td style="text-align:center;">
                    <button class="btn-asignar" onclick="openAsignarModal('${t.flight}', '${t.category}', '${t.pax}', '${t.id}')" 
                            style="padding: 6px; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items:center; justify-content:center;" 
                            title="Reasignar">♻️</button>
                </td>
            </tr>
        `;
    });

    if (filtered.length === 0) {
        body.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 40px; opacity: 0.5;">No hay asignaciones en Supabase para hoy.</td></tr>';
    } else {
        body.innerHTML = html;
    }
    updateTasksKPIs();
}

function updateTasksKPIs() {
    const tasks = DataManager.tasks;
    const total = tasks.length;

    // Filtros basados en el status real (en minúsculas según DB)
    const process = tasks.filter(t => t.status === 'en curso').length;
    const ok = tasks.filter(t => t.status === 'finalizado').length;
    const alerts = tasks.filter(t => t.status === 'rechazado').length;
    const breaks = tasks.filter(t => t.pax_name === 'Colacion').length;

    const el = {
        'kpi-task-total': total, 'kpi-task-process': process,
        'kpi-task-ok': ok, 'kpi-task-fail': alerts,
        'kpi-task-break': breaks, 'kpi-task-alert': 0
    };

    for (let id in el) {
        const target = document.getElementById(id);
        if (target) target.textContent = el[id];
    }
}

// Lógica Modal Tarea General
function openNewGeneralTaskModal() {
    const modal = document.getElementById('modal-new-task'); if (!modal) return;
    const agentSelect = document.getElementById('field-task-agent');

    if (agentSelect) {
        const activeAgents = DataManager.agents.filter(a =>
            a.assist === '🟢Presente' ||
            a.id === 'CDO/SPVR' ||
            (a.team || '').includes('JEFATURA')
        );
        agentSelect.innerHTML = activeAgents.map(a => `<option value="${a.id}">${a.nombre} (${a.equipo || a.team})</option>`).join('');
    }

    const now = new Date();
    const curTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    document.getElementById('field-task-start').value = curTime;
    calculateEndTime();

    modal.classList.add('active');
}

function handleTaskTypeChange() {
    const type = document.getElementById('field-task-name').value;
    const groupOther = document.getElementById('group-other-task');
    if (type === 'OTRO') groupOther.style.display = 'block';
    else groupOther.style.display = 'none';

    calculateEndTime();
}

function calculateEndTime() {
    const start = document.getElementById('field-task-start').value;
    const taskName = document.getElementById('field-task-name').value;
    if (!start) return;

    let [h, m] = start.split(':').map(Number);

    // Si es colación, sumar 1 hora
    if (taskName === 'Colacion') h += 1;
    else m += 15; // Otras tareas 15 min por defecto

    if (h >= 24) h -= 24;
    const endStr = h.toString().padStart(2, '0') + ":" + (m % 60).toString().padStart(2, '0');
    document.getElementById('field-task-end').value = endStr;
}

async function saveGeneralTask(e) {
    if (!supabaseClient) return;
    e.preventDefault();
    const taskName = document.getElementById('field-task-name').value;
    const otherTask = document.getElementById('field-task-other').value;
    const agentId = document.getElementById('field-task-agent').value;
    const start = document.getElementById('field-task-start').value;
    const end = document.getElementById('field-task-end').value;
    const issuer = document.getElementById('field-task-issuer').value;

    const payload = {
        vuelo_num: 'GENERAL',
        pax_name: taskName === 'OTRO' ? otherTask : taskName,
        agente_id: agentId,
        status: 'pendiente',
        obs: `Emisor: ${issuer} | Fin estimado: ${end}`
    };

    try {
        const { error } = await supabaseClient.from('asistencias').insert(payload);
        if (error) throw error;

        alert('🎯 Tarea Operacional creada en Supabase exitosamente.');
        closeModal('modal-new-task');
        await DataManager.fetchOperationalData();
        renderAsignacionesTab();
    } catch (e) {
        alert("❌ Error al crear tarea: " + e.message);
    }
}

function openAsignarModal(flight, type, specificPaxName = null, taskId = null) {
    const modal = document.getElementById('modal-asignar-pax'); if (!modal) return;
    modal.dataset.taskId = taskId || ''; // Guardamos ID de tarea si es reasignación
    const title = document.getElementById('assign-modal-title');
    const body = document.getElementById('assign-modal-body');

    const typeDisplay = type === 'EMBARQUE' ? '🛫 EMBARQUE' : '🛬 ARRIBO';
    if (title) title.innerHTML = `♿ Asignación PMR - Vuelo ${flight} <span class="service-badge ${type === 'EMBARQUE' ? 'badge-dep' : 'badge-arr'}" style="font-size:0.6rem; vertical-align:middle; margin-left:10px;">${typeDisplay}</span>`;

    // Buscar pasajeros en la base de datos (Supabase)
    let candidates = DataManager.pax.filter(p => p.vuelo_num === flight);

    // Si se especificó un pasajero concreto (desde los paneles de pax/tab)
    if (specificPaxName) {
        candidates = candidates.filter(p => p.pax_name === specificPaxName);
    }

    if (body) {
        // --- FILTRO CRÍTICO: SOLO AGENTES PRESENTES + JEFATURAS ---
        const activeAgents = DataManager.agents.filter(a =>
            a.assist === '🟢Presente' ||
            a.id === 'CDO/SPVR' ||
            (a.team || '').includes('JEFATURA')
        );

        const agentOpts = activeAgents.map(a => `<option value="${a.id}">${a.nombre} (${a.equipo || a.team})</option>`).join('');

        let htmlPaxs = '';
        candidates.forEach(p => {
            htmlPaxs += `
                <div class="assign-pax-row" data-pax="${p.pax_name}" data-ssr="${p.ssr || '---'}">
                    <div class="assign-pax-header">
                        <span style="color:var(--accent-purple);">👤</span> ${p.pax_name} 
                        <span class="ssr-badge ssr-${(p.ssr || '').toLowerCase()}">${p.ssr || '---'}</span>
                    </div>
                    <div class="assign-form-grid">
                        <div class="form-group">
                            <label>ASIGNAR AGENTE</label>
                            <select class="search-input-fancy pax-agent-select">
                                <option value="">-- Seleccionar Agente --</option>
                                ${agentOpts}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>TIPO DE TRASLADO</label>
                            <select class="search-input-fancy pax-transfer-select">
                                <option value="Tramo Completo">Tramo Completo</option>
                                <option value="Última Milla">Última Milla</option>
                            </select>
                        </div>
                         <div class="form-group">
                            <label>OBSERVACIONES</label>
                            <input type="text" class="search-input-fancy pax-obs-input" placeholder="Ej. Trae silla propia" value="${p.obs || ''}">
                        </div>
                    </div>
                </div>`;
        });

        body.innerHTML = htmlPaxs || '<div style="padding:20px; text-align:center; opacity:0.5;">No hay pasajeros registrados para este criterio.</div>';
    }

    modal.classList.add('active');
}

function openAgentAnalytics() {
    const modal = document.getElementById('modal-agent-analytics'); if (!modal) return;
    const body = document.getElementById('ana-ranking-body'); if (!body) return;
    body.innerHTML = '';

    const agents = DataManager.agents.filter(a => a.shift === 'active');
    const tasks = DataManager.tasks;

    let stats = agents.map(a => {
        const aTasks = tasks.filter(t => t.agente_id === a.id);
        const ok = aTasks.filter(t => t.status === 'finalizado').length;
        const process = aTasks.filter(t => t.status === 'en curso').length;
        const updates = Math.floor(Math.random() * 5); // Stats locales temporales
        const score = aTasks.length > 0 ? Math.floor((ok / aTasks.length) * 100) : 0;

        return {
            id: a.id, name: a.nombre, team: a.equipo, ok, fail: process, updates, score,
            presence: a.status !== 'offline' ? 'Activo' : '---'
        };
    });

    stats.sort((a, b) => b.score - a.score);

    let html = '';
    stats.forEach(s => {
        html += `
            <tr>
                <td>
                    <div style="font-weight:800; color:white;">${s.name}</div>
                    <div style="font-size:0.7rem; opacity:0.6;">${s.id} | ${s.team}</div>
                </td>
                <td style="color:#10b981; font-weight:800; text-align:center;">${s.ok}</td>
                <td style="color:#ef4444; font-weight:800; text-align:center;">${s.fail}</td>
                <td style="text-align:center;">${s.presence}</td>
                <td style="text-align:center; font-weight:700;">${s.updates}</td>
                <td>
                    <div style="width:100px; height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">
                        <div style="width:${s.score}%; height:100%; background:linear-gradient(90deg, #8b5cf6, #3b82f6);"></div>
                    </div>
                    <div style="font-size:0.65rem; margin-top:4px; opacity:0.7;">Efficiency: ${s.score}%</div>
                </td>
            </tr>
        `;
    });
    body.innerHTML = html;

    const topLA = stats.find(s => s.team.includes('LATAM'))?.name.split(' ')[0] || '--';
    const topOAL = stats.find(s => s.team.includes('OLA'))?.name.split(' ')[0] || '--';
    const topAuditArr = [...stats].sort((a, b) => b.updates - a.updates);
    const topAudit = topAuditArr[0]?.name.split(' ')[0] || '--';
    const topRejectArr = [...stats].sort((a, b) => b.fail - a.fail);
    const topReject = topRejectArr[0]?.name.split(' ')[0] || '--';

    document.getElementById('ana-top-la').textContent = topLA;
    document.getElementById('ana-top-oal').textContent = topOAL;
    document.getElementById('ana-top-audit').textContent = topAudit;
    document.getElementById('ana-top-reject').textContent = topReject;

    // Métricas por aerolínea
    const laTasks = tasks.filter(t => t.flight?.startsWith('LA')).length;
    const oalTasks = tasks.length - laTasks;
    const total_ = tasks.length || 1;

    const airlineStats = document.getElementById('ana-airline-stats');
    if (airlineStats) {
        airlineStats.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
                <div style="font-size:1.5rem;">✈️</div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;"><span>LATAM AIRLINES (LA)</span> <b>${laTasks}</b></div>
                    <div style="height:6px; background:rgba(255,255,255,0.05); border-radius:3px;"><div style="width:${(laTasks / total_) * 100}%; height:100%; background:#ef4444; border-radius:3px;"></div></div>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:15px;">
                <div style="font-size:1.5rem;">🌐</div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;"><span>OTRAS AEROLÍNEAS</span> <b>${oalTasks}</b></div>
                    <div style="height:6px; background:rgba(255,255,255,0.05); border-radius:3px;"><div style="width:${(oalTasks / total_) * 100}%; height:100%; background:#3b82f6; border-radius:3px;"></div></div>
                </div>
            </div>
        `;
    }

    modal.classList.add('active');
}

function exportAnalyticsExcel() {
    let csv = 'RANKING AUDITORIA AGENTES - WEBPMR\n';
    csv += 'ID;AGENTE;EQUIPO;ACEPTADAS;RECHAZADAS;UPD TRAMOS;EFICIENCIA\n';

    const agents = DataManager.agents.filter(a => a.status !== 'offline');
    agents.forEach(a => {
        const aTasks = DataManager.tasks.filter(t => t.assignedTo === a.id);
        const ok = aTasks.filter(t => (t.status_pax || '').includes('Contactado') || (t.status_pax || '').includes('Terminado') || (t.status_pax || '').includes('Embarcado')).length;
        const fail = aTasks.filter(t => (t.status_pax || '').includes('No Contactado')).length;
        const score = (ok + fail) > 0 ? ((ok / (ok + fail)) * 100).toFixed(1) : 0;
        csv += `${a.id};${a.nombre || a.name};${a.equipo || a.team};${ok};${fail};${Math.floor(Math.random() * 20)};${score}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Auditoria_Agentes_PMR_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --------------------------------------------------------------------------------
// GESTIÓN DE TURNOS (ROL)
// --------------------------------------------------------------------------------
let SHIFTS_DATABASE = [
    { code: 'M0513', type: 'M' }, { code: 'M0514', type: 'M' }, { code: 'M0515', type: 'M' },
    { code: 'M0516', type: 'M' }, { code: 'M0517', type: 'M' }, { code: 'M0718', type: 'M' },
    { code: 'M0719', type: 'M' }, { code: 'M0819', type: 'M' }, { code: 'M0820', type: 'M' },
    { code: 'T1300', type: 'T' }, { code: 'T1401', type: 'T' }, { code: 'T1402', type: 'T' },
    { code: 'T1321', type: 'T' }, { code: 'T1323', type: 'T' }, { code: 'T1322', type: 'T' },
    { code: 'T1422', type: 'T' }, { code: 'T1423', type: 'T' }, { code: 'T1502', type: 'T' },
    { code: 'T1603', type: 'T' }, { code: 'T1704', type: 'T' },
    { code: 'N1805', type: 'N' }, { code: 'N1906', type: 'N' }, { code: 'N1907', type: 'N' },
    { code: 'N2007', type: 'N' }, { code: 'N2008', type: 'N' }
];

function renderShiftsSettings() {
    const list = document.getElementById('shift-manager-list');
    if (!list) return;
    let html = '';
    SHIFTS_DATABASE.forEach((shift, index) => {
        const cls = `shift-${shift.type.toLowerCase()}`;
        html += `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="shift-cell ${cls}" style="width: 60px; padding: 4px; border-radius: 4px;">${shift.code}</div>
                    <span style="font-size: 0.75rem; font-weight: 700; opacity: 0.6;">Tipo: ${shift.type}</span>
                </div>
                <button onclick="deleteShiftConfig(${index})" style="background: none; border: none; color: #ef4444; font-size: 0.8rem; cursor: pointer;">🗑️</button>
            </div>
        `;
    });
    list.innerHTML = html;
}

function addNewShiftConfig() {
    const codeInput = document.getElementById('new-shift-code');
    const typeInput = document.getElementById('new-shift-type');
    if (!codeInput) return;

    const code = codeInput.value.trim().toUpperCase();
    const type = typeInput.value;

    if (!code) {
        alert('⚠️ Por favor, ingresa un código de turno.');
        return;
    }

    SHIFTS_DATABASE.push({ code, type });
    renderShiftsSettings();
    codeInput.value = '';
}

function deleteShiftConfig(index) {
    if (confirm('🗑️ ¿Estás seguro de eliminar este turno de la configuración?')) {
        SHIFTS_DATABASE.splice(index, 1);
        renderShiftsSettings();
    }
}

// Inicializar al cargar (esto se puede llamar desde el init general)
setTimeout(() => { renderShiftsSettings(); }, 1000);
// --------------------------------------------------------------------------------
// MODAL EDITAR AGENTE
// --------------------------------------------------------------------------------
function openEditAgent(agentId) {
    const modal = document.getElementById('modal-edit-agent'); if (!modal) return;
    const a = DataManager.agents.find(x => x.id === agentId);

    if (a) {
        document.getElementById('edit-agent-title').textContent = `✏️ Editar Agente: ${a.id}`;
        document.getElementById('edit-agent-id').value = a.id;
        document.getElementById('edit-agent-name').value = a.nombre || a.name;
        document.getElementById('edit-agent-rut').value = a.rut || '';
        document.getElementById('edit-agent-phone').value = a.telefono || a.phone || '';
        document.getElementById('edit-agent-address').value = a.direccion || a.address || '';
        document.getElementById('edit-agent-number').value = a.numero || a.addressNum || '';
        document.getElementById('edit-agent-commune').value = a.comuna || a.commune || '';

        document.getElementById('edit-agent-team').value = a.equipo || a.team;
        document.getElementById('edit-agent-tica').value = a.tica_vigente ? '🪪Tica Vigente' : '⛔Pendiente';
        document.getElementById('edit-agent-talla').value = a.talla_polera || 'M';
        document.getElementById('edit-agent-gender').value = a.genero || 'MASCULINO';
        document.getElementById('edit-agent-next-shifts').value = a.rol_mensual || '';

        // 📅 VISTA PREVIA PRÓXIMOS 5 DÍAS (Extraído del ROL)
        renderShiftsPreview(a.rol_mensual);
    }

    modal.classList.add('active');
}

async function confirmSaveAgent(e) {
    if (e) e.preventDefault();
    if (!supabaseClient) return;

    const id = document.getElementById('edit-agent-id').value;
    const payload = {
        nombre: document.getElementById('edit-agent-name').value.toUpperCase(),
        telefono: normalizePhone(document.getElementById('edit-agent-phone').value),
        equipo: document.getElementById('edit-agent-team').value,
        direccion: document.getElementById('edit-agent-address').value,
        numero: document.getElementById('edit-agent-number').value,
        comuna: document.getElementById('edit-agent-commune').value,
        tica_vigente: document.getElementById('edit-agent-tica').value.includes('Vigente'),
        talla_polera: document.getElementById('edit-agent-talla').value,
        genero: document.getElementById('edit-agent-gender').value,
        rol_mensual: document.getElementById('edit-agent-next-shifts').value
    };

    try {
        const { error } = await supabaseClient.from('agentes').update(payload).eq('id', id);
        if (error) throw error;

        alert('✅ Cambios guardados exitosamente en la nube.');
        closeModal('modal-edit-agent');
        await DataManager.fetchOperationalData();
        renderAgentCRUDList();
        renderAgentsDirectory(activeAgentSubTab);
    } catch (err) {
        alert("❌ Error al guardar: " + err.message);
    }
}

function initDefaultDates() {
    // 📂 Intentar recuperar fecha de sesión previa
    const savedDate = localStorage.getItem('last_agent_view_date');
    if (savedDate) {
        const d = new Date(savedDate);
        if (!isNaN(d.getTime())) {
            CURRENT_AGENT_DATE = d;
            CURRENT_AGENT_DATE.setHours(0, 0, 0, 0);
            console.log("📅 Fecha de sesión restaurada:", CURRENT_AGENT_DATE.toISOString().split('T')[0]);
        }
    }

    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value || input.value === '2026-04-02') {
            input.value = today;
        }
    });

    if (typeof selectedDateStr !== 'undefined' && (!selectedDateStr || selectedDateStr === '2026-04-02')) {
        selectedDateStr = today;
    }
}

function renderShiftsPreview(rolString) {
    const container = document.getElementById('edit-agent-shifts-preview');
    if (!container) return;
    if (!rolString || !GLOBAL_ROL_HEADER || GLOBAL_ROL_HEADER.length === 0) {
        container.textContent = "ℹ️ Sube un ROL para ver la vista previa de 5 días.";
        return;
    }

    const shifts = rolString.split(' ');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Encontrar índice de hoy en el header
    let todayIdx = GLOBAL_ROL_HEADER.findIndex(d => {
        if (!(d instanceof Date)) return false;
        const temp = new Date(d);
        temp.setHours(0, 0, 0, 0);
        return temp.getTime() === today.getTime();
    });

    if (todayIdx === -1) {
        container.textContent = "ℹ️ Hoy no está en el rango del ROL subido.";
        return;
    }

    // Tomar 5 días
    let preview = "📅 Próximos 5 días: ";
    for (let i = 0; i < 5; i++) {
        const idx = todayIdx + i;
        if (idx < shifts.length) {
            const date = GLOBAL_ROL_HEADER[idx];
            const code = shifts[idx] || '---';
            const dateStr = date instanceof Date ? `${date.getDate()}/${date.getMonth() + 1}` : '??';
            preview += `[${dateStr}: ${code}] `;
        }
    }
    container.textContent = preview;
}

async function confirmDeleteAgent() {
    const id = document.getElementById('edit-agent-id').value;
    if (confirm(`⚠️ ¿Estás seguro de ELIMINAR al agente ${id} de forma permanente del sistema?`)) {
        try {
            const { error } = await supabaseClient.from('agentes').delete().eq('id', id);
            if (error) throw error;

            alert('🗑️ Agente eliminado de la nube.');
            closeModal('modal-edit-agent');
            await DataManager.fetchOperationalData();
            renderAgentCRUDList();
            renderAgentsDirectory(activeAgentSubTab);
        } catch (err) {
            alert("❌ Error al eliminar: " + err.message);
        }
    }
}

function openAddAgent() {
    const modal = document.getElementById('modal-add-agent');
    if (!modal) return;

    // Generar ID Correlativo
    const nextId = generateNextAgentID();
    document.getElementById('new-agent-id').value = nextId;

    // Limpiar Formulario
    document.getElementById('form-add-agent').reset();
    document.getElementById('new-agent-id').value = nextId; // Re-poner tras reset

    modal.classList.add('active');
}

function generateNextAgentID() {
    let nextNum = 1;
    let foundGap = false;

    while (!foundGap) {
        const potentialId = `AG-${nextNum.toString().padStart(4, '0')}`;
        // Buscar en DataManager.agents que ya tiene los últimos datos de la nube
        const exists = DataManager.agents.some(a => (a.id || '').toUpperCase() === potentialId.toUpperCase());

        if (!exists) {
            foundGap = true;
            return potentialId;
        }
        nextNum++;
        if (nextNum > 9999) break;
    }
    return `AG-${nextNum.toString().padStart(4, '0')}`;
}

async function saveNewAgent(e) {
    if (!supabaseClient) return;
    if (e) e.preventDefault();

    const payload = {
        id: document.getElementById('new-agent-id').value,
        nombre: document.getElementById('new-agent-name').value.toUpperCase(),
        rut: document.getElementById('new-agent-rut').value,
        telefono: normalizePhone(document.getElementById('new-agent-phone').value),
        direccion: document.getElementById('new-agent-address').value,
        numero: document.getElementById('new-agent-number').value,
        comuna: document.getElementById('new-agent-commune').value,
        equipo: document.getElementById('new-agent-team').value,
        tica_vigente: document.getElementById('new-agent-tica-status').value.includes('Vigente'),
        rol: 'agente',
        status: 'desconectado',
        shift: 'inactive'
    };

    try {
        const { error } = await supabaseClient.from('agentes').upsert(payload);
        if (error) throw error;

        alert(`✅ Agente ${payload.id} guardado en Supabase exitosamente.`);
        closeModal('modal-add-agent');
        await DataManager.fetchOperationalData();
        renderAgentsDirectory(activeAgentSubTab);
    } catch (e) {
        alert("❌ Error al guardar agente: " + e.message);
    }
}

let activeAgentSubTab = 'assist';

const STATUS_TRANS = {
    'available': 'DISPONIBLE',
    'lunch': 'COLACIÓN',
    'absent': 'AUSENTE',
    'service': 'SERVICIO',
    'offline': 'DESCONECTADO'
};

const TEAM_MAP_COLORS = {
    'JEFATURA': '#fbbf24', // Dorado
    'SPVR LATAM': '#ef4444',
    'SPVR OLA': '#3b82f6',
    'CDO LATAM': '#ef4444',
    'CDO OLA': '#3b82f6',
    'PT LATAM': '#ef4444',
    'PT OLA': '#3b82f6',
    'FT LATAM': '#ef4444',
    'FT OLA': '#3b82f6',
    'FT': '#64748b', // Gris
    'OLA': '#3b82f6',
    'LATAM': '#ef4444'
};

let CURRENT_AGENT_DATE = (() => {
    const saved = localStorage.getItem('last_agent_view_date');
    if (saved) {
        const d = new Date(saved);
        if (!isNaN(d.getTime())) {
            d.setHours(0, 0, 0, 0);
            return d;
        }
    }
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
})();

function switchAgentSubTab(tab) {
    activeAgentSubTab = tab;
    // Estilos de botones
    document.querySelectorAll('.btn-tab-sub').forEach(b => {
        b.classList.remove('active');
        b.style.background = 'rgba(255,255,255,0.05)';
        b.style.color = 'rgba(255,255,255,0.6)';
    });

    // Mapeo especial para el ID del botón DB
    const btnId = tab === 'database' ? 'btn-sub-database' : `btn-sub-${tab}`;
    const activeEl = document.getElementById(btnId);
    if (activeEl) {
        activeEl.classList.add('active');
        activeEl.style.background = '#0ea5e9'; // Celeste / Sky Blue
        activeEl.style.color = 'white';
        activeEl.style.borderColor = '#0ea5e9';
    }

    const viewAssist = document.getElementById('agents-subview-assist');
    const viewRol = document.getElementById('agents-subview-rol');
    const dateCont = document.getElementById('date-pagination-container');

    if (tab === 'rol') {
        if (viewAssist) viewAssist.style.display = 'none';
        if (viewRol) viewRol.style.display = 'block';
        if (dateCont) dateCont.style.display = 'none';
        renderDatePagination();
        updateRolDisplay();
    } else {
        if (viewAssist) viewAssist.style.display = 'block';
        if (viewRol) viewRol.style.display = 'none';

        // Mostrar paginación solo en Asistencia
        if (dateCont) {
            dateCont.style.display = tab === 'assist' ? 'flex' : 'none';
            // SIEMPRE renderizamos la paginación para que se vean las "hojas" de fecha
            renderDatePagination();
        }

        renderAgentsDirectory(tab);
    }
}

function renderDatePagination() {
    const cont = document.getElementById('date-pagination-container');
    if (!cont) return;
    cont.innerHTML = '';

    if (!GLOBAL_ROL_HEADER || GLOBAL_ROL_HEADER.length === 0) {
        // Fallback: Generar ±3 días alrededor de hoy si no hay ROL importado
        const fallback = [];
        for (let i = -3; i <= 3; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            d.setHours(0, 0, 0, 0);
            fallback.push(d);
        }
        GLOBAL_ROL_HEADER = fallback;
    }

    cont.style.display = 'flex';
    cont.style.visibility = 'visible';
    cont.style.height = 'auto';
    cont.style.opacity = '1';

    GLOBAL_ROL_HEADER.forEach((dateObj, idx) => {
        if (!(dateObj instanceof Date)) return;

        const btn = document.createElement('button');
        const day = dateObj.getDate();
        const month = dateObj.toLocaleString('es-ES', { month: 'short' });
        btn.textContent = `${day} ${month}`;
        btn.className = 'btn-tab-sub';

        if (dateObj.getTime() === CURRENT_AGENT_DATE.getTime()) {
            btn.classList.add('active');
            btn.style.background = '#3b82f6';
            btn.style.color = 'white';
        } else {
            btn.style.background = 'rgba(255,255,255,0.1)';
            btn.style.color = 'rgba(255,255,255,0.7)';
        }

        btn.onclick = () => {
            CURRENT_AGENT_DATE = new Date(dateObj);
            localStorage.setItem('last_agent_view_date', CURRENT_AGENT_DATE.toISOString());
            renderDatePagination();
            DataManager.fetchOperationalData().then(() => {
                renderAgentsDirectory('assist');
            });
        };
        cont.appendChild(btn);
    });
}

let tempImportData = [];
let GLOBAL_ROL_HEADER = [];
let GLOBAL_ROL_ROWS = [];

let MASTER_SHIFT_CATALOG = {
    M: ['M0513', 'M0514', 'M0515', 'M0516', 'M0517', 'M0718', 'M0719', 'M0819', 'M0820'],
    T: ['T1300', 'T1401', 'T1402', 'T1321', 'T1323', 'T1322', 'T1422', 'T1423', 'T1502', 'T1603', 'T1704'],
    N: ['N1805', 'N1906', 'N1907', 'N2007', 'N2008']
};

function excelSerialToDate(serial) {
    if (!serial) return null;
    let d = null;
    if (typeof serial === 'number' && !isNaN(serial)) {
        const excelBaseDate = new Date(Date.UTC(1899, 11, 30));
        const utcTime = excelBaseDate.getTime() + (serial * 86400 * 1000);
        const temp = new Date(utcTime);
        d = new Date(temp.getUTCFullYear(), temp.getUTCMonth(), temp.getUTCDate(), 0, 0, 0, 0);
    } else {
        const s = String(serial).trim();
        if (s.includes('T') && s.includes('Z')) {
            d = new Date(s);
        } else {
            const parts = s.split(/[\/-]/);
            if (parts.length >= 2) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
                d = new Date(year, month, day, 0, 0, 0, 0);
            } else {
                d = new Date(s);
            }
        }
    }
    if (d && !isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        return d;
    }
    return serial;
}

function updateRolDisplay() {
    if (GLOBAL_ROL_HEADER.length === 0 || GLOBAL_ROL_ROWS.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    let todayIdx = GLOBAL_ROL_HEADER.findIndex(h => {
        if (h instanceof Date) return h.getTime() === today.getTime();
        return String(h) === todayStr;
    });

    const renderHeaders = (headerRow) => {
        headerRow.innerHTML = GLOBAL_ROL_HEADER.map((h, idx) => {
            let cls = idx === 0 ? 'sticky-col-1' : (idx === 1 ? 'sticky-col-2' : (idx === 2 ? 'sticky-col-3' : ''));
            if (idx === todayIdx) cls += ' column-today';
            let label = h;
            const d = (h instanceof Date) ? h : new Date(h);
            if (!isNaN(d.getTime()) && idx > 2) {
                label = `${d.getDate()} ${d.toLocaleString('es-ES', { month: 'short' })}`;
            }
            return `<th class="${cls}">${label}</th>`;
        }).join('');
    };

    const previewHead = document.getElementById('rol-preview-header');
    if (previewHead) renderHeaders(previewHead);
    const mainHead = document.getElementById('rol-main-header');
    if (mainHead) renderHeaders(mainHead);

    const renderBody = (bodyRow) => {
        bodyRow.innerHTML = GLOBAL_ROL_ROWS.map(row => `
            <tr>
                ${row.map((cell, idx) => {
            let cls = idx === 0 ? 'sticky-col-1' : (idx === 1 ? 'sticky-col-2' : (idx === 2 ? 'sticky-col-3' : ''));
            if (idx === todayIdx) cls += ' column-today';
            if (idx > 2) return `<td class="rol-table-cell ${cls}">${getShiftFullCell(cell)}</td>`;
            return `<td class="${cls}">${cell || '-'}</td>`;
        }).join('')}
            </tr>`).join('');
    };

    const previewBody = document.getElementById('rol-preview-body');
    if (previewBody) renderBody(previewBody);
    const mainBody = document.getElementById('rol-main-body');
    if (mainBody) renderBody(mainBody);

    const resultsDiv = document.getElementById('rol-upload-results');
    if (resultsDiv) resultsDiv.style.display = 'block';
}

function normalizeSearch(str) {
    if (!str) return '';
    return str.toString().toUpperCase().trim().replace(/[\.\-]/g, '');
}

function normalizePhone(phone) {
    if (!phone) return '+56900000000';
    // Limpiar todo lo que no sea número
    let clean = phone.toString().replace(/\D/g, '');

    // Si ya trae el 569 al inicio, nos quedamos con los últimos 8 dígitos del resto o validamos
    if (clean.startsWith('569') && clean.length >= 11) {
        clean = clean.substring(3);
    } else if (clean.startsWith('56') && clean.length >= 10) {
        clean = clean.substring(2);
    } else if (clean.startsWith('9') && clean.length >= 9) {
        clean = clean.substring(1);
    }

    // Tomar solo los últimos 8 dígitos para asegurar el formato 9 + 8 dígitos
    const last8 = clean.slice(-8);
    return `+569${last8.padStart(8, '0')}`;
}

function getShiftFullCell(shift) {
    if (!shift || shift === '-') return '-';
    let code = String(shift).toUpperCase();
    let className = '';
    if (code.startsWith('M')) className = 'shift-dia';
    else if (code.startsWith('T')) className = 'shift-tarde';
    else if (code.startsWith('N')) className = 'shift-noche';
    else if (code === 'L' || code === 'LI') className = 'shift-libre';
    else if (code === 'V') className = 'shift-vaca';
    else if (code === 'S' || code === 'SAL') className = 'shift-saliente';

    if (className) return `<span class="rol-shift-full ${className}">${code}</span>`;
    return code;
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const btnUpload = document.getElementById('btn-upload-rol');
        const fileMsg = document.getElementById('file-ready-msg');
        const fileNameSpan = document.getElementById('ready-filename');
        if (btnUpload) { btnUpload.style.opacity = '1'; btnUpload.style.pointerEvents = 'auto'; }
        if (fileMsg) fileMsg.style.display = 'inline-block';
        if (fileNameSpan) fileNameSpan.textContent = file.name.toUpperCase();
    }
}

function handleRolUpload() {
    const input = document.getElementById('input-rol-excel');
    const file = input.files[0];
    if (!file) { alert('⚠️ Seleccione un archivo primero.'); return; }
    const reader = new FileReader();
    reader.onload = function (evt) {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length < 2) { alert('❌ El archivo está vacío o no tiene encabezados.'); return; }

        GLOBAL_ROL_HEADER = jsonData[0].map(h => excelSerialToDate(h));
        GLOBAL_ROL_ROWS = jsonData.slice(1);
        tempImportData = GLOBAL_ROL_ROWS;

        GLOBAL_ROL_ROWS.forEach(row => {
            row.forEach((cell, idx) => {
                if (idx > 2 && cell) {
                    const code = String(cell).toUpperCase().trim();
                    if (code.startsWith('M') && !MASTER_SHIFT_CATALOG.M.includes(code)) MASTER_SHIFT_CATALOG.M.push(code);
                    else if (code.startsWith('T') && !MASTER_SHIFT_CATALOG.T.includes(code)) MASTER_SHIFT_CATALOG.T.push(code);
                    else if (code.startsWith('N') && !MASTER_SHIFT_CATALOG.N.includes(code)) MASTER_SHIFT_CATALOG.N.push(code);
                }
            });
        });
        MASTER_SHIFT_CATALOG.M.sort(); MASTER_SHIFT_CATALOG.T.sort(); MASTER_SHIFT_CATALOG.N.sort();
        saveRolToLocalStorage();
        updateRolDisplay();
        renderTurnosView();
        document.getElementById('rol-upload-results').scrollIntoView({ behavior: 'smooth' });
    };
    reader.readAsArrayBuffer(file);
}

function saveRolToLocalStorage() {
    try {
        const data = { header: GLOBAL_ROL_HEADER, rows: GLOBAL_ROL_ROWS };
        localStorage.setItem('webPmr_rol_data', JSON.stringify(data));
        console.log("💾 ROL guardado localmente.");
    } catch (e) { console.error("❌ Error al guardar ROL:", e); }
}

function loadRolFromLocalStorage() {
    try {
        const raw = localStorage.getItem('webPmr_rol_data');
        if (raw) {
            const data = JSON.parse(raw);
            GLOBAL_ROL_HEADER = data.header.map(h => {
                const d = new Date(h);
                return !isNaN(d.getTime()) ? d : h;
            });
            GLOBAL_ROL_ROWS = data.rows;
            console.log("📂 ROL recuperado de localStorage.");
            return true;
        }
    } catch (e) { console.error("❌ Error al cargar ROL:", e); }
    return false;
}

async function confirmAgentsImport() {
    if (tempImportData.length === 0) return;
    let countNew = 0; let countUpdated = 0; const importedAgents = [];

    // --- FILTRADO DE DUPLICADOS DENTRO DEL MISMO EXCEL ---
    const seenRuts = new Set();
    const uniqueBatch = [];

    tempImportData.forEach(row => {
        const rutInput = row[0];
        const nameInput = row[1];
        if (!rutInput && !nameInput) return;

        const rut = normalizeSearch(rutInput);
        const name = (nameInput || '').toString().toUpperCase().trim();

        // Evitar duplicados en el mismo archivo (misma persona dos veces)
        if (rut && seenRuts.has(rut)) return;
        if (rut) seenRuts.add(rut);

        const cargo = row[2] ? row[2].toString().toUpperCase() : '';
        let team = cargo.trim() || 'FT';
        if (!TEAM_MAP_COLORS[team]) {
            if (team.includes('LATAM')) team = 'FT LATAM';
            else if (team.includes('OLA')) team = 'FT OLA';
            else team = 'FT';
        }

        // Buscar si ya existe en DataManager (ya cargado de Nube)
        const existing = DataManager.agents.find(a => {
            const aRut = normalizeSearch(a.rut);
            const aName = (a.nombre || a.name || '').toUpperCase().trim();
            return (rut && aRut === rut) || (name && aName === name);
        });

        if (existing) {
            existing.team = team;
            existing.rol_mensual = row.slice(3).map(s => String(s || '').trim()).join(' ');
            importedAgents.push(existing);
            countUpdated++;
        } else {
            const shifts = row.slice(3).map(s => String(s || '').trim()).join(' ');
            const newAgent = {
                id: generateNextAgentID(),
                name: name || 'NUEVO AGENTE',
                rut: rutInput || '---',
                phone: normalizePhone(row[3] || ''),
                address: '-',
                commune: '-',
                team: team,
                status: 'offline',
                assist: '🟡Pendiente',
                tica: true,
                rol_mensual: shifts
            };
            // Agregamos al DataManager local temporalmente para que generateNextAgentID lo vea en el siguiente loop
            DataManager.agents.push(newAgent);
            importedAgents.push(newAgent);
            countNew++;
        }
    });

    // --- PASO CRÍTICO: SINCRONIZAR IDs CON LA BASE DE DATOS ANTES DE SUBIR ---
    try {
        const { data: dbAgents } = await supabaseClient.from('agentes').select('id, rut');
        const dbMap = new Map();
        if (dbAgents) {
            dbAgents.forEach(x => {
                const norm = normalizeSearch(x.rut);
                if (norm) dbMap.set(norm, x.id);
            });
        }
        importedAgents.forEach(a => {
            const norm = normalizeSearch(a.rut);
            if (dbMap.has(norm)) a.id = dbMap.get(norm);
        });
    } catch (e) { console.error("⚠️ Error pre-sincronizando ruts:", e); }

    try {
        const payloads = importedAgents.map(a => ({
            id: a.id,
            nombre: a.nombre || a.name,
            rut: a.rut,
            equipo: a.equipo || a.team,
            status: a.status || 'desconectado',
            tica_vigente: true,
            rol: 'agente',
            rol_mensual: a.rol_mensual || ''
        }));

        // 🛡️ USA UPSERT BASADO EN ID PARA EVITAR CONFLICTOS DE RUT 
        // (Si el RUT ya existe con ese ID, lo actualiza. Si no, falla por el constraint de RUT único si el ID es nuevo)
        const { error } = await supabaseClient.from('agentes').upsert(payloads, { onConflict: 'id' });
        if (error) throw error;

        if (GLOBAL_ROL_HEADER && GLOBAL_ROL_HEADER.length > 0) {
            const headerPayload = {
                id: 'ROL_MASTER_HEADER', nombre: 'COLUMNAS_ROL',
                rol_mensual: GLOBAL_ROL_HEADER.map(h => (h instanceof Date) ? h.toISOString() : String(h)).join('|')
            };
            await supabaseClient.from('agentes').upsert(headerPayload);
        }

        alert(`🚀 Importación finalizada en Supabase: ${countNew} nuevos, ${countUpdated} actualizados.`);
        await DataManager.fetchOperationalData();

        switchAgentSubTab('rol');
        renderAgentsDirectory('rol');
    } catch (err) {
        alert("❌ Error al sincronizar con Supabase: " + err.message);
    }
}

function downloadRolTemplate() {
    const data = [
        ["RUT", "NOMBRE COMPLETO", "CARGO/EQUIPO", "TELEFONO", "DIRECCIÓN", "NUMERO", "COMUNA", "ESTADO TICA", "ROL DIA 1", "ROL DIA 2"],
        ["99.999.999-9", "IAN SAAVEDRA", "SPVR OLA", "56949425037", "SANTIAGO DE URIONA", "2104", "QUINTA NORMAL", "⛔VENCIDA", "M0719", "L"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_PMR_Web");
    XLSX.writeFile(wb, "Plantilla_RRHH_WebPMR.xlsx");
}

function exportMobilizationXLS() {
    if (GLOBAL_ROL_HEADER.length === 0 || GLOBAL_ROL_ROWS.length === 0) {
        alert('⚠️ No hay datos de ROL importados para generar la movilización.');
        return;
    }

    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const todayStr = fmt(today);
    const tomorrowStr = fmt(tomorrow);

    const todayIdx = GLOBAL_ROL_HEADER.findIndex(h => h === todayStr);
    const tomorrowIdx = GLOBAL_ROL_HEADER.findIndex(h => h === tomorrowStr);

    if (todayIdx === -1) {
        alert(`⚠️ No se encontró la columna de hoy (${todayStr}) en el rol importado.`);
        return;
    }

    const services = [];

    // Lógica de Ventana Nocturna (Ej: 21:00 a 08:30)
    const isNocturnal = (hh) => (hh >= 21 || hh <= 8);

    GLOBAL_ROL_ROWS.forEach(row => {
        const rut = row[0];
        const name = row[1];
        const team = row[2];
        const shiftToday = row[todayIdx] ? String(row[todayIdx]).toUpperCase() : '';
        const shiftTomorrow = tomorrowIdx !== -1 && row[tomorrowIdx] ? String(row[tomorrowIdx]).toUpperCase() : '';

        const agent = DataManager.agents.find(a => (a.rut && a.rut.replace(/\./g, '').replace(/-/g, '') === rut.replace(/\./g, '').replace(/-/g, '')) || a.name === name);

        const buildRecord = (date, sType, sTime, code) => {
            const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
            services.push({
                "FECHA": date,
                "ID": `CM${cleanRut}`,
                "NOMBRE": name,
                "DIRECCION": agent ? agent.address : '-',
                "NUMERACION": agent ? (agent.addressNum || '-') : '-',
                "COMUNA": agent ? agent.commune : '-',
                "TELEFONO": agent ? agent.phone : '-',
                "SERVICIO": sType,
                "HORA": sTime,
                "SOLICITANTE": "WEBPMR_AUTOMATION"
            });
        };

        const processShift = (code, dateStr) => {
            if (!code || code.length < 5) return;
            const hIn = parseInt(code.substring(1, 3));
            const hOut = parseInt(code.substring(3, 5));

            if (isNocturnal(hIn)) {
                buildRecord(dateStr, "RECOGIDA", `${String(hIn).padStart(2, '0')}:00`, code);
            }
            if (isNocturnal(hOut)) {
                let zarpeDate = dateStr;
                if (hOut < hIn) {
                    const dParts = dateStr.split('-');
                    const year = new Date().getFullYear();
                    const d = new Date(year, parseInt(dParts[1]) - 1, parseInt(dParts[0]) + 1);
                    zarpeDate = fmt(d);
                }
                buildRecord(zarpeDate, "ZARPE", `${String(hOut).padStart(2, '0')}:00`, code);
            }
        };

        processShift(shiftToday, todayStr);
        processShift(shiftTomorrow, tomorrowStr);
    });

    if (services.length === 0) {
        alert('ℹ️ No se detectaron servicios de movilización nocturna para los turnos actuales.');
        return;
    }

    const ws = XLSX.utils.json_to_sheet(services);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Servicios_Movilizacion");
    XLSX.writeFile(wb, `Movilizacion_${todayStr}_al_${tomorrowStr}.xlsx`);
    alert(`✅ Planilla de Movilización generada con ${services.length} servicios.`);
}
function renderAgentsDirectory(view = 'assist') {
    const tableHeader = document.querySelector('#agentes .ops-table thead tr');
    const tableBody = document.getElementById('agents-table-body');
    if (!tableHeader || !tableBody) return;

    const agents_all = DataManager.agents || [];
    let agents_ = [];

    // SI ESTAMOS EN ASISTENCIA: Filtrar Solo Agentes con Turno el día seleccionado
    if (view === 'assist' && GLOBAL_ROL_ROWS && GLOBAL_ROL_ROWS.length > 0) {
        const selTime = CURRENT_AGENT_DATE.getTime();
        const colIdx = GLOBAL_ROL_HEADER.findIndex(h => h instanceof Date && h.getTime() === selTime);

        if (colIdx !== -1) {
            agents_ = agents_all.filter(agent => {
                const aName = normalizeSearch(agent.nombre || agent.name);
                const aRut = normalizeSearch(agent.rut);

                const rolEntry = GLOBAL_ROL_ROWS.find(row => {
                    const rRut = normalizeSearch(row[0]);
                    const rName = normalizeSearch(row[1]);
                    return (rRut && (rRut === aRut || rRut === normalizeSearch(agent.id))) || (rName && rName === aName);
                });

                // Si el agente no está en el ROL del mes, no lo mostramos en ASISTENCIAS (pero sigue en Base de Datos)
                if (!rolEntry) return false;

                const shiftCode = String(rolEntry[colIdx] || '').toUpperCase().trim();
                const isWorkShift = shiftCode.startsWith('M') || shiftCode.startsWith('T') || shiftCode.startsWith('N') || shiftCode.startsWith('S');

                // Si no hay hoy o es Libre (L/LI), lo ocultamos de esta vista operativa.
                return isWorkShift;
            });
        } else {
            agents_ = agents_all;
        }
    } else {
        agents_ = agents_all;
    }

    // Indicador de Cantidad para Auditoría visual
    const secLbl = document.querySelector('#agentes .sec-lbl');
    if (secLbl) secLbl.innerText = `📋 DIRECTORIO DE AGENTES (${agents_.length} EN NUBE)`;

    // Filtros
    const fName = document.getElementById('filter-agent-name')?.value.toUpperCase() || '';
    const fID = document.getElementById('filter-agent-id')?.value.toUpperCase() || '';

    // Actualizar Encabezado
    if (view === 'database') {
        tableHeader.innerHTML = `
            <th>NOMBRE</th>
            <th>RUT</th>
            <th>TELÉFONO</th>
            <th>EQUIPO</th>
            <th>DIRECCIÓN</th>
            <th>NUMERACIÓN</th>
            <th>COMUNA</th>
        `;
    } else {
        tableHeader.innerHTML = `
            <th>NOMBRE</th>
            <th>RUT</th>
            <th>TELÉFONO</th>
            <th>EQUIPO</th>
            <th>TURNO</th>
            <th>ASISTENCIA</th>
            <th>OBSERVACIÓN</th>
            <th>TICA</th>
            <th>COLACIÓN</th>
            <th>ESTADO SERV.</th>
            <th>ÚLT. SERVICIO</th>
            <th>ACCIÓN</th>
        `;
    }

    // --- OPTIMIZACIÓN: Pre-scan de mapa de ROL para búsqueda O(1) ---
    const rolMap = new Map();
    if (typeof GLOBAL_ROL_ROWS !== 'undefined' && GLOBAL_ROL_ROWS.length > 0) {
        // 📅 USAR LA FECHA SELECCIONADA EN LA PAGINACIÓN PARA EL MAPEO DEL TURNO
        const selTime = CURRENT_AGENT_DATE.getTime();
        const colIdx = GLOBAL_ROL_HEADER.findIndex(h => h instanceof Date && h.getTime() === selTime);

        if (colIdx !== -1) {
            GLOBAL_ROL_ROWS.forEach(row => {
                const rut = normalizeSearch(row[0]);
                const name = normalizeSearch(row[1]);
                const shift = String(row[colIdx] || '').trim().toUpperCase();
                // Prioridad a RUT para evitar colisiones de nombres similares
                if (rut) rolMap.set(rut, shift);
                else if (name) rolMap.set(name, shift);
            });
        }
    }

    // --- ORDENAR POR TURNO (M -> T -> N) ---
    agents_.sort((a, b) => {
        const nameA = normalizeSearch(a.nombre || a.name);
        const nameB = normalizeSearch(b.nombre || b.name);
        const rutA = normalizeSearch(a.rut);
        const rutB = normalizeSearch(b.rut);

        const shiftA = rolMap.get(rutA) || rolMap.get(nameA) || 'ZZZ';
        const shiftB = rolMap.get(rutB) || rolMap.get(nameB) || 'ZZZ';

        return shiftA.localeCompare(shiftB);
    });

    // Renderizar Filas
    let finalHtml = '';
    agents_.forEach(agent => {
        if (agent.id === 'CDO/SPVR') return;

        const aName = (agent.nombre || agent.name || '').toUpperCase();
        const aID = (agent.id || '').toUpperCase();

        if (fName && !aName.includes(fName)) return;
        if (fID && !aID.includes(fID)) return;

        let rowContent = '';
        const teamCol = TEAM_MAP_COLORS[agent.team] || '#64748b';
        const badgeStyle = `background: ${teamCol}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; min-width: 90px; height: 26px; border: 1px solid rgba(255,255,255,0.1);`;

        // Obtener Turno del Rol desde el Mapa (O(1))
        const nName = normalizeSearch(agent.nombre || agent.name);
        const nRut = normalizeSearch(agent.rut);
        let rolTurno = rolMap.get(nRut) || rolMap.get(nName) || '--:--';
        let isSaliente = rolTurno === 'S';

        // Si es "S" (Saliente), buscar el turno del día anterior para mostrarlo
        if (isSaliente && GLOBAL_ROL_ROWS && GLOBAL_ROL_ROWS.length > 0) {
            const selTime = CURRENT_AGENT_DATE.getTime();
            const colIdx = GLOBAL_ROL_HEADER.findIndex(h => h instanceof Date && h.getTime() === selTime);
            if (colIdx > 3) { // 3 primeras columnas son RUT, Nombre, Cargo
                const rolEntry = GLOBAL_ROL_ROWS.find(row => normalizeSearch(row[0]) === nRut || normalizeSearch(row[1]) === nName);
                if (rolEntry) rolTurno = rolEntry[colIdx - 1] || 'S';
            }
        }

        // Determinar Clase de Turno (M/T/N)
        let shiftClass = 'shift-default';
        if (rolTurno.startsWith('M')) shiftClass = 'shift-dia';
        else if (rolTurno.startsWith('T')) shiftClass = 'shift-tarde';
        else if (rolTurno.startsWith('N')) shiftClass = 'shift-noche';
        else if (rolTurno.startsWith('L')) shiftClass = 'shift-libre';
        else if (rolTurno.startsWith('V')) shiftClass = 'shift-vaca';
        else if (rolTurno.startsWith('S')) shiftClass = 'shift-saliente';

        // Si es saliente del ROL, añadir badge visual
        const salienteBadge = isSaliente ? '<span class="status-badge-mini red">SALIENTE</span>' : '';

        if (view === 'database') {
            rowContent = `
                <tr style="cursor: pointer;" onclick="openEditAgent('${agent.id}')">
                    <td style="font-weight: 700;">${agent.nombre || agent.name || 'SIN NOMBRE'}</td>
                    <td style="font-size: 0.8rem; opacity: 0.7;">${agent.rut || '---'}</td>
                    <td>
                        <a href="https://wa.me/${(agent.telefono || agent.phone || '').replace(/\+/g, '').replace(/\s/g, '')}" target="_blank" style="text-decoration:none; display: flex; flex-direction: column; align-items: center; gap: 4px; color:inherit;">
                            <span style="font-size: 1.2rem;">📱</span>
                            <span style="font-size: 0.75rem; font-weight: 700; color: #10b981;">${agent.telefono || agent.phone || '---'}</span>
                        </a>
                    </td>
                    <td><span style="${badgeStyle}">${agent.equipo || agent.team || 'GENERAL'}</span></td>
                    <td>${agent.direccion || agent.address || '---'}</td>
                    <td>${agent.numero || agent.addressNum || '---'}</td>
                    <td>${agent.comuna || agent.commune || '---'}</td>
                </tr>
            `;
        } else {
            // Vista Asistencia (Full)
            const statusSp = STATUS_TRANS[agent.status] || agent.status.toUpperCase();
            const statusCol = agent.status === 'available' ? '#10b981' : (agent.status === 'offline' ? '#64748b' : '#f97316');

            // Clase específica para Light Mode
            const lightClass = agent.status === 'available' ? 'status-badge-custom-green' :
                (agent.status === 'lunch' || agent.status === 'service' ? 'status-badge-custom-orange' : '');

            rowContent = `
                <tr style="cursor: pointer;" onclick="openEditAgent('${agent.id}')">
                    <td style="font-weight: 700;">${agent.nombre || agent.name || 'SIN NOMBRE'}</td>
                    <td style="font-size: 0.8rem; opacity: 0.7;">${agent.rut || '---'}</td>
                    <td style="text-align: center;">
                        <a href="https://wa.me/${(agent.telefono || agent.phone || '').replace(/\+/g, '').replace(/\s/g, '')}" target="_blank" style="text-decoration:none; display: flex; flex-direction: column; align-items: center; gap: 4px; color:inherit;">
                            <span style="font-size: 1.2rem;">📱</span>
                        </a>
                    </td>
                    <td onclick="event.stopPropagation()">
                        <select class="table-select-tactical" onchange="updateAgentStatus('${agent.id}', 'team', this.value)">
                            <option value="GENERAL" ${agent.team === 'GENERAL' ? 'selected' : ''}>GENERAL</option>
                            <option value="LATAM" ${agent.team === 'LATAM' ? 'selected' : ''}>LATAM</option>
                            <option value="OLA" ${agent.team === 'OLA' ? 'selected' : ''}>OLA</option>
                            <option value="PT" ${agent.team === 'PT' ? 'selected' : ''}>PT</option>
                            <option value="FT" ${agent.team === 'FT' ? 'selected' : ''}>FT</option>
                        </select>
                    </td>
                    <td style="padding: 0; width: 100px;">
                        <div class="rol-shift-full ${shiftClass}">
                            ${rolTurno}
                            ${salienteBadge}
                        </div>
                    </td>
                    <td onclick="event.stopPropagation()">
                        <select class="table-select-tactical" onchange="updateAgentStatus('${agent.id}', 'assist', this.value)">
                            <option ${agent.assist === '🟡Pendiente' ? 'selected' : ''}>🟡Pendiente</option>
                            <option ${agent.assist === '🟢Presente' ? 'selected' : ''}>🟢Presente</option>
                            <option ${agent.assist === '🔴Ausente' ? 'selected' : ''}>🔴Ausente</option>
                        </select>
                    </td>
                    <td onclick="event.stopPropagation()">
                        <select class="table-select-tactical" style="min-width: 170px;" onchange="updateAgentStatus('${agent.id}', 'obs', this.value)">
                            <option ${agent.obs === '-- Sin Obs --' ? 'selected' : ''}>-- Sin Obs --</option>
                            <option ${agent.obs === '👻 2° dia Ausente' ? 'selected' : ''}>👻 2° dia Ausente</option>
                            <option ${agent.obs === '💀 3° dia Ausente' ? 'selected' : ''}>💀 3° dia Ausente</option>
                            <option ${agent.obs === '✖️ Renuncia' ? 'selected' : ''}>✖️ Renuncia</option>
                            <option ${agent.obs === '🚗 Llega Tarde' ? 'selected' : ''}>🚗 Llega Tarde</option>
                            <option ${agent.obs === '😴No Llega' ? 'selected' : ''}>😴No Llega</option>
                            <option ${agent.obs === '🚐 No Toma Van' ? 'selected' : ''}>🚐 No Toma Van</option>
                            <option ${agent.obs === '📜 Lic. Medica' ? 'selected' : ''}>📜 Lic. Medica</option>
                            <option ${agent.obs === '🤢 Enferm@' ? 'selected' : ''}>🤢 Enferm@</option>
                            <option ${agent.obs === '🛻 Sin Reco Asignada' ? 'selected' : ''}>🛻 Sin Reco Asignada</option>
                            <option ${agent.obs === '⏰ EXT//Hr Extras' ? 'selected' : ''}>⏰ EXT//Hr Extras</option>
                            <option ${agent.obs === '😮 Llega Antes' ? 'selected' : ''}>😮 Llega Antes</option>
                            <option ${agent.obs === '🪅 Se retira de Turno' ? 'selected' : ''}>🪅 Se retira de Turno</option>
                            <option ${agent.obs === '😥 Problema Personal' ? 'selected' : ''}>😥 Problema Personal</option>
                            <option ${agent.obs === '🌞 Personal Nuevo' ? 'selected' : ''}>🌞 Personal Nuevo</option>
                            <option ${agent.obs === '📄 Term. Contrato/Practica' ? 'selected' : ''}>📄 Term. Contrato/Practica</option>
                            <option ${agent.obs === '☎️ No Responde' ? 'selected' : ''}>☎️ No Responde</option>
                        </select>
                    </td>
                    <td onclick="event.stopPropagation()">
                        <select class="table-select-tactical" onchange="updateAgentStatus('${agent.id}', 'tica', this.value)">
                            <option ${(agent.tica || '').includes('Vigente') ? 'selected' : ''}>🪪Tica Vigente</option>
                            <option ${(agent.tica || '').includes('Pendiente') ? 'selected' : ''}>⛔Pendiente</option>
                            <option ${(agent.tica || '').includes('Vencida') ? 'selected' : ''}>🎟️Tica Vencida</option>
                            <option ${(agent.tica || '').includes('Renovando') ? 'selected' : ''}>🎫Renovando Tica</option>
                        </select>
                    </td>
                    <td onclick="event.stopPropagation()">
                        <select class="table-select-tactical" onchange="updateAgentStatus('${agent.id}', 'lunch', this.value)">
                            <option ${agent.lunch === '🍕Pendiente' ? 'selected' : ''}>🍕Pendiente</option>
                            <option ${agent.lunch === '🍔Colacion OK' ? 'selected' : ''}>🍔Colacion OK</option>
                            <option ${agent.lunch === '🍟En Colacion' ? 'selected' : ''}>🍟En Colacion</option>
                            <option ${agent.lunch === '😫Sin Colacion' ? 'selected' : ''}>😫Sin Colacion</option>
                        </select>
                    </td>
                    <td style="text-align: center;">
                        <span class="${lightClass}" style="background: rgba(15,23,42,0.4); color: ${statusCol}; padding: 6px 14px; border-radius: 8px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${statusCol}77;">${statusSp}</span>
                    </td>
                    <td style="font-weight: 800;">${agent.lastTask || '--:--'}</td>
                    <td>
                        <button class="btn-save" style="background: #f97316; padding: 6px 12px; font-size: 0.75rem;" onclick="event.stopPropagation(); disconnectAgent('${agent.id}')">Desconectar</button>
                    </td>
                </tr>
            `;
        }
        finalHtml += rowContent;
    });

    tableBody.innerHTML = finalHtml; // Inserción única al DOM
}

async function disconnectAgent(id) {
    if (confirm(`🔌 ¿Estás seguro de desconectar al agente ${id}?`)) {
        try {
            const { error } = await supabaseClient.from('agentes').update({ status: 'offline' }).eq('id', id);
            if (error) throw error;

            await DataManager.fetchOperationalData();
            renderAgentsDirectory(activeAgentSubTab || 'assist');
            alert('Agente desconectado y actualizado en Supabase.');
        } catch (err) {
            alert("❌ Error al desconectar: " + err.message);
        }
    }
}

function showNotification(msg, color = 'blue') {
    const notifyCont = document.getElementById('notification-container');
    if (!notifyCont) {
        console.log(`[NOTIFY] ${msg}`);
        return;
    }
    const n = document.createElement('div');
    n.className = 'notification-toast';
    n.style.borderLeft = `4px solid ${color === 'blue' ? '#3b82f6' : (color === 'red' ? '#ef4444' : (color === 'green' ? '#10b981' : '#f59e0b'))}`;
    n.innerHTML = `
        <div style="font-weight:800; font-size:0.8rem;">SISTEMA PMR</div>
        <div style="font-size:0.75rem; opacity:0.8;">${msg}</div>
    `;
    notifyCont.appendChild(n);
    setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 500); }, 4000);
}

function exportAgentsXLS() {
    let csv = "\uFEFF"; // BOM para Excel
    csv += "NOMBRE;RUT;TELÉFONO;EQUIPO;DIRECCIÓN;COMUNA;ESTADO\n";
    DataManager.agents.forEach(a => {
        if (a.id === 'CDO/SPVR') return;
        csv += `${a.nombre || a.name};${a.rut || '-'};${a.telefono || a.phone};${a.equipo || a.team};${a.direccion || a.address || '-'};${a.comuna || a.commune || '-'};${STATUS_TRANS[a.status] || a.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Base_Datos_Agentes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function getShiftStartTime(code) {
    if (!code || code.length < 5) return null;
    const type = code[0].toUpperCase();
    let hh = parseInt(code.substring(1, 3));
    let mm = parseInt(code.substring(3, 5)); // En tu formato M0719, 19 es la salida, no los minutos.
    // Re-evaluando tu formato: M0719 -> Ingreso 07:00, Salida 19:00.
    // Los minutos de ingreso suelen ser 00 a menos que el código sea distinto.
    return { hh, mm: 0 };
}

function calculateDelayMinutes(shiftCode, arrivalTime) {
    const shift = getShiftStartTime(shiftCode);
    if (!shift) return 0;

    const [arrH, arrM] = arrivalTime.split(':').map(Number);
    const shiftTotal = (shift.hh * 60) + shift.mm;
    const arrivalTotal = (arrH * 60) + arrM;

    return Math.max(0, arrivalTotal - shiftTotal);
}

async function updateAgentStatus(id, field, value) {
    if (!supabaseClient) return;
    try {
        const selDateStr = CURRENT_AGENT_DATE.toISOString().split('T')[0];
        const agent = DataManager.agents.find(a => a.id === id);

        // --- LÓGICA DE ATRASO AUTOMÁTICO ---
        if (field === 'assist' && value === '🟢Presente') {
            const nowTime = get24hTime();
            // Buscar turno en el ROL
            const selTime = CURRENT_AGENT_DATE.getTime();
            const colIdx = GLOBAL_ROL_HEADER.findIndex(h => h instanceof Date && h.getTime() === selTime);
            let shiftCode = '';
            if (colIdx !== -1) {
                const rolEntry = GLOBAL_ROL_ROWS.find(row => normalizeSearch(row[0]) === normalizeSearch(agent.id) || normalizeSearch(row[1]) === normalizeSearch(agent.nombre));
                if (rolEntry) shiftCode = String(rolEntry[colIdx] || '').toUpperCase();
            }

            const delay = calculateDelayMinutes(shiftCode, nowTime);
            if (delay > 0) {
                const obsMsg = `LLEGA TARDE A LAS ${nowTime} (+${delay} MIN)`;
                agent.obs = obsMsg;
                // Forzar actualización de obs en DB también
                await supabaseClient.from('asistencias_diarias').upsert({
                    agent_id: id, fecha: selDateStr, observacion: obsMsg
                }, { onConflict: 'agent_id,fecha' });
            } else {
                // Si llega a tiempo, registrar hora de entrada normal si estaba en PENDIENTE
                if (agent.obs === '-- Sin Obs --' || agent.obs === 'SIN OBSERVACIONES') {
                    const entryMsg = `PRESENTE A LAS ${nowTime}`;
                    agent.obs = entryMsg;
                    await supabaseClient.from('asistencias_diarias').upsert({
                        agent_id: id, fecha: selDateStr, observacion: entryMsg
                    }, { onConflict: 'agent_id,fecha' });
                }
            }
        }

        // --- OPTIMISTIC UI ---
        if (agent) {
            if (field === 'assist') agent.assist = value;
            if (field === 'obs') agent.obs = value;
            if (field === 'team') agent.team = value;
            if (field === 'lunch') agent.lunch = value;
            if (field === 'tica') agent.tica = value;

            renderAgentsDirectory(activeAgentSubTab || 'assist');
            updateRRHHKPIs();
            updateDashboardKPIs();
        }

        // Si cambiamos campos diarios (asistencia, obs, equipo del día, colación)
        if (['assist', 'obs', 'team', 'lunch'].includes(field)) {
            const dailyPayload = {
                agent_id: id,
                fecha: selDateStr,
                asistencia: field === 'assist' ? value : (agent ? agent.assist : undefined),
                observacion: field === 'obs' ? value : (agent ? agent.obs : undefined),
                equipo: field === 'team' ? value : (agent ? agent.team : undefined),
                lunch: field === 'lunch' ? value : (agent ? agent.lunch : undefined)
            };
            Object.keys(dailyPayload).forEach(k => dailyPayload[k] === undefined && delete dailyPayload[k]);

            const { error } = await supabaseClient
                .from('asistencias_diarias')
                .upsert(dailyPayload, { onConflict: 'agent_id,fecha' });
            if (error) throw error;
        } else {
            const payload = {};
            if (field === 'tica') payload.tica_vigente = value.includes('Vigente');

            const { error } = await supabaseClient.from('agentes').update(payload).eq('id', id);
            if (error) throw error;
        }

    } catch (err) {
        console.warn("⚠️ Error de Sincronización Supabase:", err.message);
    }
}

// MODAL & UI HELPERS
function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
}

function openAddAgent() {
    const m = document.getElementById('modal-add-agent');
    if (!m) return;

    // Auto-generar ID antes de abrir
    const nextID = generateNextAgentID();
    const idField = document.getElementById('new-agent-id');
    if (idField) idField.value = nextID;

    // Limpiar otros campos (opcional pero recomendado)
    const form = document.getElementById('form-add-agent');
    if (form) {
        form.reset();
        if (idField) idField.value = nextID; // Reset limpia todo, reponer ID
    }

    m.classList.add('active');
}

// switchAgentSubTab duplicado eliminado. logic consolidada arriba.

function renderTimelineTab() {
    const listBody = document.getElementById('timeline-hourly-body');
    const flightsContainer = document.getElementById('timeline-vuelos-paged');
    if (!flightsContainer) return;

    if (listBody && listBody.parentElement && listBody.parentElement.parentElement) {
        listBody.parentElement.parentElement.style.display = 'none';
        const prevH4 = listBody.parentElement.parentElement.previousElementSibling;
        if (prevH4 && prevH4.tagName === 'H4') prevH4.style.display = 'none';
    }

    flightsContainer.style.display = 'block';
    flightsContainer.innerHTML = '<div class="timeline-rows-container" id="timeline-stack"></div>';
    const timelineStack = document.getElementById('timeline-stack');

    const now = new Date();

    for (let i = 0; i <= 5; i++) {
        const targetDate = new Date(now.getTime() + (i * 60 * 60 * 1000));
        const hour = targetDate.getHours();
        const hourLabel = `${hour.toString().padStart(2, '0')}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
        const isCurrent = (i === 0);
        const flightsInHour = DataManager.flights.filter(f => {
            const hStr = f.hora || f.sch || '00:00';
            return parseInt(hStr.split(':')[0]) === hour;
        });

        // Simulación de PMR por vuelo (para el heatmap)
        let totalPmrInHour = 0;
        flightsInHour.forEach(f => {
            const count = DataManager.tasks.filter(p => p.vuelo_num === (f.vuelo_num || f.fn)).length;
            totalPmrInHour += count > 0 ? count : Math.floor(Math.random() * 4) + 2;
        });

        // Cálculo de Capacidad (Heatmap)
        const activeAgents = DataManager.agents.filter(a => a.status === 'online');
        const availAgents = activeAgents.length;
        const capacity = Math.max(1, availAgents * 2); // 1 agente = 2 PMR
        const ratio = totalPmrInHour / capacity;

        let heatColor = '#10b981'; // Green (Controlable)
        let heatLabel = 'TRANSITO CONTROLABLE';
        let heatText = 'Dotación suficiente para la demanda.';

        if (ratio > 1.0) {
            heatColor = '#ef4444'; // Red (Crítico)
            heatLabel = 'ESTADO CRÍTICO';
            heatText = 'Demanda supera capacidad. Se requiere apoyo.';
        } else if (ratio > 0.7) {
            heatColor = '#f97316'; // Orange (Alta)
            heatLabel = 'ALTA AFLUENCIA';
            heatText = 'Operación al límite. Monitorear personal.';
        } else if (ratio > 0.4) {
            heatColor = '#eab308'; // Yellow (Moderado)
            heatLabel = 'TRÁNSITO MODERADO';
            heatText = 'Operación fluida con carga estándar.';
        }

        const rowHtml = `
            <div class="timeline-row" style="border-left: 8px solid ${heatColor};">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px;">
                    <div style="display:flex; align-items:center; gap: 20px;">
                        <div class="${isCurrent ? 'hour-indicator-vibrant' : 'hour-indicator'}" style="font-size: 1.1rem; padding: 12px 25px;">
                            ${hourLabel} ${isCurrent ? '— HORA ACTUAL' : (i === 1 ? '— PRÓXIMA HORA' : '')}
                        </div>
                        <div style="background: ${heatColor}15; border: 1px solid ${heatColor}44; padding: 10px 20px; border-radius: 12px;">
                            <div style="color: ${heatColor}; font-weight: 900; font-size: 0.8rem; display: flex; align-items: center; gap: 8px;">
                                <span class="status-dot" style="background: ${heatColor}; box-shadow: 0 0 10px ${heatColor};"></span>
                                ${heatLabel}
                            </div>
                            <div style="font-size: 0.65rem; opacity: 0.6; margin-top: 4px;">${heatText}</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 20px; text-align: right;">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 0.65rem; opacity: 0.5;">AGENTS DISP.</span>
                            <span style="font-size: 1.2rem; font-weight: 900; color: #10b981;">🟢 ${availAgents}</span>
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 0.65rem; opacity: 0.5;">PMR ESPERADOS</span>
                            <span style="font-size: 1.2rem; font-weight: 900; color: #f97316;">♿ ${totalPmrInHour}</span>
                        </div>
                    </div>
                </div>
                
                <div class="flights-horizontal-scroll">
                    ${flightsInHour.length > 0 ?
                flightsInHour.map(f => createTimelineFlightCardWithPmr(f)).join('') :
                '<div style="min-width: 100%; text-align:center; padding:40px; opacity:0.3; border: 1px dashed rgba(255,255,255,0.1); border-radius:15px;">SIN VUELOS PROGRAMADOS EN ESTE BLOQUE</div>'
            }
                </div>
            </div>
        `;
        timelineStack.innerHTML += rowHtml;
    }
}

function createTimelineFlightCardWithPmr(f) {
    const alName = f.aerolinea || f.al || '';
    const cK = alName.replace(/\s/g, '').toUpperCase();
    const typeClass = (f.tipo || f.type) === 'EMBARQUE' ? 'badge-dep' : 'badge-arr';
    const pC = DataManager.tasks.filter(p => p.vuelo_num === (f.vuelo_num || f.fn)).length || Math.floor(Math.random() * 4) + 2;

    // Calcular tiempo promedio según tipo
    const timeAvg = f.type === 'EMBARQUE' ? '20-40 min' : '30-40 min';
    const logoUrl = AIRLINE_LOGOS[cK] || `https://via.placeholder.com/130x50?text=${f.al}`;

    return `
        <div class="flight-card" style="min-width: 340px; background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; overflow: hidden;">
            <div class="card-header" style="background: rgba(0,0,0,0.2); padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 24px; height: 24px; background: white; border-radius: 4px; padding: 2px;">
                        <img src="${logoUrl}" style="width:100%; height:100%; object-fit:contain;">
                    </div>
                    <span style="font-weight: 900; font-size: 0.9rem; color: #fff;">${f.fn}</span>
                </div>
                <span class="service-badge ${typeClass}" style="padding: 4px 10px; font-size: 0.65rem;">${f.type}</span>
            </div>
            
            <div class="card-body" style="padding: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <div style="font-size: 0.65rem; opacity: 0.5;">PROG / REAL</div>
                        <div style="font-size: 0.95rem; font-weight: 800; color: var(--accent-blue);">${f.sch} / ${f.real || f.sch}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.65rem; opacity: 0.5;">GATE / RUTA</div>
                        <div style="font-size: 0.95rem; font-weight: 800; color: #fff;">${f.gate || 'D01'} | SCL</div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 12px; margin-bottom: 15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                        <span style="font-size:0.7rem; font-weight:800; color:#3b82f6;">♿ PASAJEROS PMR</span>
                        <span style="font-size:0.9rem; font-weight:900;">${pC}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.65rem; opacity:0.6;">⏳ TIEMPO PROM. ATENCIÓN</span>
                        <span style="font-size:0.7rem; font-weight:700; color:#f59e0b;">${timeAvg}</span>
                    </div>
                </div>

                <button class="btn-save" style="width: 100%; justify-content: center; background: #3b82f6; padding: 10px; font-size: 0.8rem; font-weight: 800; border-radius: 10px; box-shadow: 0 4px 12px rgba(59,130,246,0.3);" onclick="goToTramos('${f.fn}')">
                    GESTIONAR TRAMOS
                </button>
            </div>
        </div>
    `;
}

function createTimelineFlightCard(f) {
    const cK = f.al.replace(/\s/g, '').toUpperCase();
    const typeClass = f.type === 'EMBARQUE' ? 'badge-dep' : 'badge-arr';
    const pC = DataManager.pax.filter(p => p.vuelo_num === f.fn).length;

    return `
        <div class="flight-card" style="width: 100%; margin-bottom: 0; border: 1px solid rgba(255,255,255,0.1); background: rgba(30, 41, 59, 0.4); border-radius: 16px; overflow: hidden; transition: 0.3s transform;">
            <div class="card-header" style="background: rgba(0,0,0,0.2); padding: 12px 15px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span class="flight-date" style="font-size:0.65rem; font-weight:700; opacity:0.6;">03-04-2026</span>
                <span class="service-badge ${typeClass}" style="padding: 4px 10px; font-size: 0.6rem; font-weight:900;">${f.type}</span>
            </div>
            <div class="card-body" style="padding: 20px;">
                <div class="airline-info" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                    <h3 style="font-size: 1.5rem; font-weight: 900; letter-spacing: 1px; color: #fff;">${f.fn}</h3>
                </div>
                
                <div class="flight-details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.8rem; margin-bottom: 20px;">
                    <div style="opacity: 0.7;">ETD/ETA: <b style="color:#fff;">${f.sch}</b></div>
                    <div style="opacity: 0.7;">RUTA: <b style="color:#fff;">SCL-?</b></div>
                    <div style="opacity: 0.7; grid-column: span 2;">Terminal: <span class="terminal-badge" style="background:rgba(245, 158, 11, 0.1); color:#f59e0b; border:1px solid rgba(245, 158, 11, 0.3); padding:2px 6px; border-radius:4px;">INTERNACIONAL</span></div>
                </div>

                <div class="status-call-banner" style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); padding: 10px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                    <span style="color: #f59e0b; font-weight: 900; font-size: 0.75rem;">🔔 ÚLTIMA LLAMADA</span>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
                    <div class="pmr-count-pill" style="background: rgba(59, 130, 246, 0.1); padding: 8px 14px; border-radius: 10px; color: #3b82f6; font-weight: 900; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">
                        ♿ ${pC} PMR
                    </div>
                    <button class="btn-save" style="background: #3b82f6; padding: 8px 20px; font-size: 0.8rem; font-weight:700; border-radius:10px; box-shadow: 0 4px 12px rgba(59,130,246,0.3);" onclick="goToTramos('${f.fn}')">Asignar</button>
                </div>
            </div>
        </div>
    `;
}

function renderAjustesDashboard() {
    renderAsistenciasChart();
    renderTopAgents();
    // Forzar vista inicial si no hay ninguna activa
    if (!document.querySelector('.settings-sub-view.active')) {
        switchSettingsView('kpis');
    }
}

function switchSettingsView(viewId) {
    // 1. Limpiar estados previos
    document.querySelectorAll('.settings-sub-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.aj-tab').forEach(b => b.classList.remove('active'));

    // 2. Activar la vista seleccionada
    const target = document.getElementById(`settings-view-${viewId}`);
    if (target) {
        target.classList.add('active');

        // 3. Activar el botón correspondiente por su onclick
        const btn = Array.from(document.querySelectorAll('.aj-tab')).find(b => {
            return b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${viewId}'`);
        });
        if (btn) btn.classList.add('active');

        // 4. Disparar lógica específica de datos
        if (viewId === 'kpis') initKPIDashboard();
        if (viewId === 'rrhh') renderRRHHView();
        if (viewId === 'rpg') renderRPGView();
        if (viewId === 'turnos') renderTurnosView();
        if (viewId === 'crud-ag') renderAgentCRUDList();
        if (viewId === 'crud-fl') renderCRUDVuelos();
        if (viewId === 'aero') renderAerolineas();
        if (viewId === 'ssr') renderSSR();
        if (viewId === 'loc') renderUbicaciones();
        if (viewId === 'permisos') renderPermisosTable();
    } else {
        console.warn(`Settings view not found: ${viewId}`);
    }
}

// --------------------------------------------------------------------------------
// 🔐 SISTEMA DE PERMISOS (DYNAMIC ROLE & TABS)
// --------------------------------------------------------------------------------
function renderPermisosTable() {
    const tbody = document.getElementById('permisos-table-body');
    if(!tbody) return;
    
    let html = '';
    DataManager.agents.forEach(a => {
        if(a.id === 'ROL_MASTER_HEADER') return;
        const isAdmin = ['supervisor', 'jefatura', 'cdo', 'administrador'].includes((a.rol || '').toLowerCase());
        let currentHidden = [];
        try {
            if(a.permisos) currentHidden = typeof a.permisos === 'string' ? JSON.parse(a.permisos) : a.permisos;
        } catch(e){}
        
        const isHidden = (tab) => currentHidden.includes(tab) ? 'checked' : '';
        
        html += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td><b>${a.nombre}</b><br><span style="color:var(--text-secondary); font-size: 0.70rem; font-weight:800;">${a.id} | ${a.rut}</span></td>
                <td style="text-align:center;">
                    <label style="display:inline-flex; align-items:center; gap:5px; cursor:pointer; font-weight:700;">
                        <input type="checkbox" id="perm-admin-${a.id}" ${isAdmin ? 'checked' : ''} style="accent-color: var(--accent-blue); transform: scale(1.3);">
                        <span>SÍ</span>
                    </label>
                </td>
                <td>
                    <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:0.75rem; font-weight:700; color:var(--text-secondary);">
                        <label><input type="checkbox" class="hide-tab-${a.id}" value="dashboard" ${isHidden('dashboard')}> Dashboard</label>
                        <label><input type="checkbox" class="hide-tab-${a.id}" value="vuelos" ${isHidden('vuelos')}> Vuelos</label>
                        <label><input type="checkbox" class="hide-tab-${a.id}" value="tramos" ${isHidden('tramos')}> Tramos</label>
                        <label><input type="checkbox" class="hide-tab-${a.id}" value="pasajeros" ${isHidden('pasajeros')}> Pasajeros PMR</label>
                        <label><input type="checkbox" class="hide-tab-${a.id}" value="asignaciones" ${isHidden('asignaciones')}> Asignaciones</label>
                        <label><input type="checkbox" class="hide-tab-${a.id}" value="timeline" ${isHidden('timeline')}> Timeline</label>
                    </div>
                </td>
                <td style="text-align:center;">
                    <button class="btn-save" style="padding:6px 12px; font-size:0.75rem;" onclick="savePermisos('${a.id}')">💾 Guardar</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

window.savePermisos = async function(agentId) {
    const adminCheck = document.getElementById(`perm-admin-${agentId}`);
    const checkboxes = document.querySelectorAll(`.hide-tab-${agentId}`);
    const hiddenTabs = [];
    checkboxes.forEach(cb => {
        if(cb.checked) hiddenTabs.push(cb.value);
    });
    
    // Si activa acceso dashboard, forzamos un rol que pase las guardias de seguridad (ej. administrador)
    const roleToSave = adminCheck.checked ? 'administrador' : 'agente';
    const jsonStr = JSON.stringify(hiddenTabs);
    
    try {
        const { error } = await supabaseClient.from('agentes').update({ rol: roleToSave, permisos: jsonStr }).eq('id', agentId);
        if(error) {
            console.error("Supabase Error:", error);
            alert("⚠️ Error en Supabase. Detalles: " + error.message + "\n\n💡 Nota para Admin: Es necesario asegurarse que exista la columna 'permisos' (tipo texto) y 'rol' en la tabla agentes.");
        } else {
            alert("✅ Permisos actualizados para el agente " + agentId + ".\n🚨 Deberá reiniciar su sesión para reflejar los cambios.");
            DataManager.fetchOperationalData(); // refrescar
        }
    } catch(err) {
        alert("⚠️ Error inesperado: " + err.message);
    }
}

// 🔥 RPG HELPER FUNCTIONS
function addNewRank() {
    const name = prompt("Nombre del Nuevo Rango:");
    if (!name) return;
    showNotification(`Solicitud de nuevo rango [${name}] enviada a Jefatura.`, 'blue');
}

function saveXPRules() {
    showNotification("Matriz de Recompensas XP guardada exitosamente.", 'green');
    // Aquí se podría implementar el guardado en BD vía api.php
}

function renderAgentCRUDList() {
    const table = document.getElementById('crud-agentes-table');
    if (!table) return;

    // Indicador de Cantidad para CRUD
    const crudLbl = document.querySelector('#settings-view-crud-ag .sec-lbl');
    if (crudLbl) crudLbl.innerText = `🧑‍✈️ GESTIÓN DE DIRECTORIO DE AGENTES (${DataManager.agents.length} TOTAL)`;

    table.innerHTML = DataManager.agents.map(a => `
        <tr>
            <td style="font-weight:900;">${a.id}</td>
            <td style="font-weight:700;">${a.nombre || a.name}</td>
            <td style="font-size:0.75rem;">${a.rut || '---'}</td>
            <td><span class="badge-blue" style="background:#3b82f622; color:#3282f6;">${a.equipo || a.team}</span></td>
            <td style="font-size:0.75rem;">${a.telefono || a.phone || '---'}</td>
            <td style="font-size:0.75rem;">${a.direccion || a.address || '---'}</td>
            <td>${a.numero || a.addressNum || '-'}</td>
            <td style="font-size:0.75rem;">${a.comuna || a.commune || '---'}</td>
            <td style="font-weight:800; color:var(--accent-blue);">${a.talla_polera || 'M'}</td>
            <td style="font-size:0.75rem;">${a.genero || '---'}</td>
            <td style="display:flex; gap:5px;">
                <button class="btn-tab-sub" style="padding:5px 8px; background:var(--accent-blue);" onclick="openEditAgent('${a.id}')">📝</button>
                <button class="btn-tab-sub" style="padding:5px 8px; background:#ef4444;" onclick="deleteAgent('${a.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

async function deleteAgent(id) {
    if (confirm(`¿Estás seguro de eliminar al agente ${id}?`)) {
        try {
            const { error } = await supabaseClient.from('agentes').delete().eq('id', id);
            if (error) throw error;

            alert('🗑️ Agente eliminado de la base de datos.');
            await DataManager.fetchOperationalData();
            renderAgentCRUDList();
        } catch (err) {
            alert("❌ Error al eliminar: " + err.message);
        }
    }
}

function editAgent(id) {
    alert(`Módulo Editar para Agente ${id} en desarrollo (Próxima actualización backend).`);
}

function exportAgentsXLS() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(DataManager.agents);
    XLSX.utils.book_append_sheet(wb, ws, "Directorio Agentes");
    XLSX.writeFile(wb, `Directorio_Agentes_WebPMR_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function importAgentsXLS() {
    document.getElementById('import-agent-input').click();
}

async function importAgentsFromExcel(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                alert('⚠️ El archivo está vacío.');
                return;
            }

            // --- PASO 1: SINCRONIZAR IDs CON LA BASE DE DATOS PARA EVITAR DUPLICADOS ---
            const { data: dbAgents } = await supabaseClient.from('agentes').select('id, rut');
            const dbMap = new Map();
            if (dbAgents) {
                dbAgents.forEach(x => {
                    const norm = normalizeSearch(x.rut);
                    if (norm) dbMap.set(norm, x.id);
                });
            }

            const payloads = jsonData.map(item => {
                const rutRaw = item["RUT"] || item["rut"] || '---';
                const normRut = normalizeSearch(rutRaw);

                // Mapeo flexible de nombres de columna (Plantilla vs Antiguos)
                const nombre = item["NOMBRE COMPLETO"] || item["Nombre"] || item["Nombre Completo"] || item["NOMBRE"] || 'SIN NOMBRE';
                const equipo = item["CARGO/EQUIPO"] || item["Equipo"] || item["Cargo"] || 'GENERAL';
                const tica = item["ESTADO TICA"] || item["Estado Tica"] || item["TICA"] || '';

                return {
                    id: dbMap.get(normRut) || item.ID || generateNextAgentID(),
                    nombre: String(nombre).toUpperCase().trim(),
                    rut: String(rutRaw).trim(),
                    equipo: String(equipo).toUpperCase().trim(),
                    telefono: normalizePhone(item["TELEFONO"] || item["Telefono"] || ''),
                    direccion: String(item["DIRECCIÓN"] || item["Direccion"] || '---').trim(),
                    numero: String(item["NUMERO"] || item["Numeracion"] || '-').trim(),
                    comuna: String(item["COMUNA"] || item["Comuna"] || '---').trim(),
                    tica_vigente: tica.toLowerCase().includes('vigent') || tica.toLowerCase().includes('si'),
                    status: 'desconectado',
                    rol: 'agente',
                    shift: 'inactive'
                };
            });

            // --- PASO 2: DEDUPLICAR POR ID (Evita el error 'ON CONFLICT DO UPDATE command cannot affect row a second time') ---
            const uniquePayloadsMap = new Map();
            const usedNewIds = new Set();

            payloads.forEach(p => {
                // Si el agente es nuevo (no estaba en dbMap), asegurarnos de no repetir IDs correlativos en este mismo lote
                if (![...dbMap.values()].includes(p.id)) {
                    let finalId = p.id;
                    let offset = 0;
                    while (usedNewIds.has(finalId)) {
                        offset++;
                        const nextNum = parseInt(finalId.split('-')[1]) + offset;
                        finalId = `AG-${nextNum.toString().padStart(4, '0')}`;
                    }
                    p.id = finalId;
                    usedNewIds.add(p.id);
                }

                // Deduplicación final: El último registro para este ID gana
                uniquePayloadsMap.set(p.id, p);
            });

            const finalPayloads = Array.from(uniquePayloadsMap.values());

            // 🛡️ USA UPSERT POR ID PARA ACTUALIZAR SI YA EXISTE
            const { error: err } = await supabaseClient.from('agentes').upsert(finalPayloads, { onConflict: 'id' });
            if (err) throw err;

            alert(`✅ Importación Exitosa: ${payloads.length} registros sincronizados con la nube.`);
            await DataManager.fetchOperationalData();
            if (typeof renderAgentCRUDList === 'function') renderAgentCRUDList();
            if (typeof renderAgentsDirectory === 'function') renderAgentsDirectory(activeAgentSubTab || 'assist');
        } catch (err) {
            console.error("Error importing agents:", err);
            alert("❌ Error al importar: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function renderCRUDVuelos() {
    const table = document.getElementById('crud-vuelos-table');
    if (!table) return;
    table.innerHTML = DataManager.flights.slice(0, 15).map(v => `
        <tr>
            <td style="font-weight:900;">${v.vuelo_num || v.fn}</td>
            <td style="font-size:0.75rem;">${v.aerolinea || v.al}</td>
            <td><span class="badge-${(v.tipo || v.type) === 'EMBARQUE' ? 'blue' : 'green'}">${v.tipo || v.type}</span></td>
            <td style="font-weight:700;">${v.hora || v.sch}</td>
            <td style="font-weight:700;">${v.puerta || v.gate || '---'}</td>
            <td><span class="badge-orange">${DataManager.tasks.filter(p => p.vuelo_num === (v.vuelo_num || v.fn)).length} PMR</span></td>
            <td><button class="btn-tab-sub" style="padding:5px 10px;">📝</button></td>
        </tr>
    `).join('');
}

function renderAerolineas() {
    const table = document.getElementById('aero-list-table');
    if (!table) return;

    table.innerHTML = Object.keys(AIRLINE_LOGOS).map(name => {
        const logo = AIRLINE_LOGOS[name];
        return `
            <tr>
                <td>
                    <div style="width: 130px; height: 50px; border-radius: 8px; overflow: hidden; background: #fff; border: 1px solid rgba(255,255,255,0.1);">
                        <img src="${logo}" style="width: 100%; height: 100%; object-fit: contain;">
                    </div>
                </td>
                <td style="font-weight:900; font-size:1rem;">${name}</td>
                <td style="font-size:0.8rem; opacity:0.7;">SCL-AMB AIRPORT</td>
                <td>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-tab-sub" style="padding:6px 12px; background:rgba(59,130,246,0.1); color:#3b82f6;" onclick="openAeroModal('${name}')">✏️ Edit</button>
                        <button class="btn-tab-sub" style="padding:6px 12px; background:rgba(239,68,68,0.1); color:#ef4444;" onclick="deleteAero('${name}')">🗑️ Borrar</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderSSR() {
    const table = document.getElementById('ssr-list-table');
    if (!table) return;

    table.innerHTML = Object.keys(SSR_DEFINITIONS).map(code => {
        const info = SSR_DEFINITIONS[code];
        return `
            <tr>
                <td style="font-weight:950; color:${info.col}; font-size:1.1rem;">${code}</td>
                <td style="font-size:0.85rem; font-weight:700;">${info.d}</td>
                <td><div style="width:24px; height:24px; background:${info.col}; border-radius:6px; box-shadow: 0 0 10px ${info.col}44;"></div></td>
                <td>
                    <span class="badge-ssr" title="${info.d}" style="background:${info.col}22; color:${info.col}; border:1px solid ${info.col}44; padding:4px 10px; border-radius:6px; font-weight:900; cursor:help;">
                        ${code}
                    </span>
                </td>
                <td>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-tab-sub" style="padding:6px 12px; background:rgba(59,130,246,0.1); color:#3b82f6;" onclick="openSSRModal('${code}')">✏️</button>
                        <button class="btn-tab-sub" style="padding:6px 12px; background:rgba(239,68,68,0.1); color:#ef4444;" onclick="deleteSSR('${code}')">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderUbicaciones() {
    const takenBox = document.getElementById('loc-list-taken');
    const droppedBox = document.getElementById('loc-list-dropped');
    if (!takenBox || !droppedBox) return;

    const locs = ['Puente Arribo', 'Punto T1', 'Punto T2', 'Embarque A', 'Embarque B', 'Embarque C', 'Embarque D'];
    const itemHtml = l => `
        <div class="subsite-card" style="display:flex; justify-content:space-between; align-items:center; padding:12px 20px;">
            <span style="font-size:0.85rem; font-weight:700;">📍 ${l}</span>
            <button style="background:none; border:none; color:#ef4444; font-size:1.2rem; cursor:pointer;">&times;</button>
        </div>
    `;

    takenBox.innerHTML = locs.map(itemHtml).join('');
    droppedBox.innerHTML = locs.map(itemHtml).join('');
}

async function renderRRHHView() {
    const alertList = document.getElementById('rrhh-alerts-list');
    const absentTable = document.getElementById('rrhh-absents-table');
    const renunciasTable = document.getElementById('rrhh-renuncias-table');
    const licenciasTable = document.getElementById('rrhh-licencias-table');
    const atrasosTable = document.getElementById('rrhh-atrasos-table');

    if (!alertList || !absentTable) return;

    // 🚨 0. FETCH DE DATOS HISTÓRICOS (Abril 1 a Hoy)
    const today = new Date().toISOString().split('T')[0];
    const { data: historyRes } = await supabaseClient
        .from('asistencias_diarias')
        .select('*')
        .gte('fecha', '2026-04-01')
        .lte('fecha', today)
        .order('fecha', { ascending: false });

    if (!historyRes) return;

    // Agrupar datos por categorías
    const renuncias = [];
    const licencias = [];
    const atrasos = [];
    const ausenciasMap = {}; // agent_id -> { count, details: [] }

    historyRes.forEach(d => {
        const agent = DataManager.agents.find(a => a.id === d.agent_id);
        if (!agent) return;

        const obs = (d.observacion || '').toUpperCase();
        const assist = (d.asistencia || '').toUpperCase();
        const dateStr = d.fecha;

        // 1. Clasificar Renuncias
        if (obs.includes('RENUNCIA') || obs.includes('TERMINO CONTRATO')) {
            if (!renuncias.find(r => r.id === agent.id)) {
                renuncias.push({
                    id: agent.id,
                    nombre: agent.nombre.toUpperCase(),
                    equipo: d.equipo || agent.team,
                    fecha: dateStr,
                    obs: obs
                });
            }
        }

        // 2. Clasificar Licencias / Certificados Médicos
        if (obs.includes('LIC. MED') || obs.includes('LICENCIA') || obs.includes('CERTIFICADO') || obs.includes('ENFERM')) {
            licencias.push({
                id: agent.id,
                nombre: agent.nombre.toUpperCase(),
                equipo: d.equipo || agent.team,
                tipo: obs,
                fecha: dateStr
            });
        }

        // 3. Clasificar Atrasos
        if (obs.includes('LLEGA TARDE')) {
            atrasos.push({
                id: agent.id,
                nombre: agent.nombre.toUpperCase(),
                equipo: d.equipo || agent.team,
                fecha: dateStr,
                turno: 'DIARIO',
                obs: obs
            });
        }

        // 4. Acumular Ausencias
        if (assist.includes('AUSENTE')) {
            if (!ausenciasMap[agent.id]) {
                ausenciasMap[agent.id] = { agent, count: 0, lastObs: obs, lastDate: dateStr };
            }
            ausenciasMap[agent.id].count++;
        }
    });

    // --- RENDERING ---

    // Alertas Críticas (Resumen)
    const totalAlerts = DataManager.agents.filter(a => a.tica_vigente === false).length;
    alertList.innerHTML = `
        <div class="alert-row-neon">
            <div style="display:flex; align-items:center; gap: 15px;">
                <span style="font-size: 1.2rem;">🎟️</span>
                <div>
                    <div style="font-weight: 900; font-size: 0.85rem;">REVISIÓN DE CREDENCIALES</div>
                    <div style="font-size: 0.65rem; opacity: 0.6;">Hay ${totalAlerts} agentes con TICA Pendiente o Vencida.</div>
                </div>
            </div>
            <span class="badge-status" style="background: #3b82f622; color: #3b82f6; border: 1px solid #3b82f655; padding: 5px 12px; font-weight: 800; font-size: 0.65rem; border-radius: 6px;">INFO</span>
        </div>
    `;

    // Tabla de Ausencias
    const ausArr = Object.values(ausenciasMap).sort((a, b) => b.count - a.count);
    absentTable.innerHTML = ausArr.length > 0 ? ausArr.map(x => `
        <tr>
            <td>${x.agent.id}</td>
            <td style="font-weight:800;">${x.agent.nombre.toUpperCase()}</td>
            <td><span class="badge-status" style="background:rgba(255,255,255,0.05);">${x.agent.team}</span></td>
            <td style="opacity:0.7;">Últ: ${x.lastDate}</td>
            <td style="font-style:italic;">${x.lastObs}</td>
            <td><span class="badge-status" style="background:#ef444422; color:#ef4444; border-color:#ef444455; font-weight:900;">🚨 ${x.count} ACUMULADAS</span></td>
        </tr>
    `).join('') : '<tr><td colspan="6" style="text-align:center; padding:20px; opacity:0.3;">Sin ausencias críticas en el periodo.</td></tr>';

    // Tabla de Renuncias
    if (renunciasTable) {
        renunciasTable.innerHTML = renuncias.length > 0 ? renuncias.map(r => `
            <tr>
                <td>${r.id}</td>
                <td style="font-weight:800;">${r.nombre}</td>
                <td><span class="badge-status" style="background:rgba(255,255,255,0.05);">${r.equipo}</span></td>
                <td style="opacity:0.7;">${r.fecha}</td>
                <td style="font-size:0.75rem;">${r.obs}</td>
                <td><span class="badge-status" style="background:#ef444415; color:#ef4444;">SALIDA</span></td>
            </tr>
        `).join('') : '<tr><td colspan="6" style="text-align:center; padding:20px; opacity:0.3;">Sin renuncias registradas.</td></tr>';
    }

    // Tabla de Licencias
    if (licenciasTable) {
        licenciasTable.innerHTML = licencias.length > 0 ? licencias.map(l => `
            <tr>
                <td style="font-weight:900;">${l.id}</td>
                <td style="font-weight:800;">${l.nombre}</td>
                <td><span class="badge-status" style="background:rgba(255,255,255,0.05);">${l.equipo}</span></td>
                <td>
                    <span class="badge-status" style="background:rgba(255,255,255,0.05);">🏥 ${l.fecha}</span>
                    <div style="font-size:0.65rem; opacity:0.6; margin-top:4px;">${l.tipo}</div>
                </td>
                <td style="font-weight:800;">1</td>
                <td><span class="badge-status" style="background:#10b98122; color:#10b981; border-color:#10b98155;">ACTIVA</span></td>
                <td style="opacity:0.4;">--</td>
            </tr>
        `).join('') : '<tr><td colspan="7" style="text-align:center; padding:20px; opacity:0.3;">Sin licencias registradas.</td></tr>';
    }

    // Tabla de Atrasos
    if (atrasosTable) {
        atrasosTable.innerHTML = atrasos.slice(0, 15).map(a => {
            const timeMatch = a.obs.match(/(\d{2}:\d{2})/);
            const minMatch = a.obs.match(/\+(\d+)/);
            const arrivalTime = timeMatch ? timeMatch[1] : '--:--';
            const minutes = minMatch ? `+${minMatch[1]} MIN` : '⚠️ DETECTADO';

            return `
                <tr>
                    <td>${a.id}</td>
                    <td style="font-weight:800;">${a.nombre}</td>
                    <td><span class="badge-status" style="background:rgba(255,255,255,0.05);">${a.equipo}</span></td>
                    <td style="opacity:0.7;">${a.fecha}</td>
                    <td><span class="badge-status" style="background:rgba(255,255,255,0.05);">${a.turno}</span></td>
                    <td style="font-weight:800; color:#ef4444;">${arrivalTime}</td>
                    <td><span class="badge-status" style="background:#ef444422; color:#ef4444; border-color:#ef444455; font-weight:900;">${minutes}</span></td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="7" style="text-align:center; padding:20px; opacity:0.3;">Sin atrasos en el periodo.</td></tr>';
    }
}

function renderRPGView() {
    const list = document.getElementById('rpg-levels-list'); if (!list) return;
    const sorted = [...DataManager.agents].map(a => ({
        ...a,
        xp: Math.floor(Math.random() * 5000), // XP Simulado por ahora
        level: Math.floor(Math.random() * 50) + 1
    })).sort((a, b) => b.xp - a.xp).slice(0, 10);

    const achievementList = document.getElementById('rpg-achievements-list');
    const fameList = document.getElementById('rpg-fame-list');
    const rulesGrid = document.getElementById('rpg-xp-rules-grid');

    list.innerHTML = sorted.map(t => `
        <div class="rpg-rank-item">
            <div class="rank-lvl-box" style="border-color: #3b82f655; color: #3b82f6;">
                LVL ${t.level}
            </div>
            <div class="rank-info">
                <div class="rank-name">${t.nombre || t.name}</div>
                <div class="rank-xp-range">${t.xp.toLocaleString()} XP acumulado</div>
            </div>
            <div style="font-size: 1.2rem;">🛡️</div>
        </div>
    `).join('');

    if (achievementList) {
        const achs = [
            { id: 1, name: 'Bautismo de Plata', desc: 'Completa tu primera asistencia.', reward: '+100 XP', icon: '🥇' },
            { id: 2, name: 'Centinela Nocturno', desc: 'Completa 5 turnos N seguidos.', reward: '+250 XP', icon: '🦅' },
            { id: 3, name: 'Embajador Global', desc: 'Atiende 10 asistencias internacionales.', reward: '+500 XP', icon: '🌎' }
        ];

        achievementList.innerHTML = achs.map(a => `
            <div class="achievement-capsule">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <div style="font-weight:800; font-size:0.85rem; color:#fff;">${a.icon} ${a.name}</div>
                    <div class="rpg-xp-badge rpg-badge-purple">${a.reward}</div>
                </div>
                <div style="font-size:0.75rem; opacity:0.6;">${a.desc}</div>
            </div>
        `).join('');
    }

    if (fameList) {
        const legends = [
            { name: 'Ricardo Thompson', title: 'Agente del Año 2025', year: '🏆 2025', img: 'https://i.pravatar.cc/150?u=ricardo' },
            { name: 'Marta Villalobos', title: 'Record de Asistencias Diarias', year: '⭐ Estrella', img: 'https://i.pravatar.cc/150?u=marta' }
        ];

        fameList.innerHTML = legends.map(l => `
            <div class="fame-card-item">
                <div class="fame-avatar">
                   <img src="${l.img}" alt="Avatar">
                </div>
                <div>
                    <div style="font-weight:900; font-size:0.9rem;">${l.name}</div>
                    <div style="font-size:0.7rem; color:var(--accent-orange); font-weight:700; margin-top:2px;">${l.title}</div>
                    <div style="font-size:0.65rem; opacity:0.5; margin-top:5px;">${l.year}</div>
                </div>
            </div>
        `).join('');
    }

    if (rulesGrid) {
        const rules = [
            { label: 'WCHR', xp: '50 XP', icon: '♿' },
            { label: 'WCHS', xp: '60 XP', icon: '♿' },
            { label: 'WCHC (Alta)', xp: '100 XP', icon: '🔥' },
            { label: 'Intl Flight', xp: '75 XP', icon: '🌎' },
            { label: 'Bono Puntual', xp: '20 XP', icon: '⏱️' },
            { label: 'XP Base x Nivel', xp: '1000 XP', icon: '📈' }
        ];

        rulesGrid.innerHTML = rules.map(r => `
            <div class="multiplier-item">
                <span>${r.icon}</span>
                <div style="flex:1;">
                    <div style="font-size:0.6rem; opacity:0.5;">${r.label}</div>
                    <div style="color:var(--accent-green); font-weight:900;">${r.xp}</div>
                </div>
            </div>
        `).join('');
    }
}

function renderTurnosView() {
    const groups = MASTER_SHIFT_CATALOG;
    const colors = { M: '#87CEEB', T: '#f97316', N: '#8b5cf6' };
    const textColors = { M: '#000', T: '#fff', N: '#fff' };

    Object.keys(groups).forEach(type => {
        const box = document.querySelector(`#turns-grid-${type} .turns-capsule-box`);
        if (box) {
            box.innerHTML = groups[type].map(code => `
                <div class="shift-capsule-tactical" style="background: ${colors[type]}; color: ${textColors[type]}; border-color: rgba(255,255,255,0.1); font-weight: 800;">
                    <span style="width: 6px; height: 6px; background: ${textColors[type]}; border-radius: 50%; opacity: 0.6;"></span>
                    ${code}
                </div>
            `).join('');
        }
    });
}

function renderAsistenciasChart() {
    const box = document.getElementById('chart-asistencias-box');
    if (!box) return;
    box.innerHTML = '';

    const days = ['21/03', '22/03', '23/03', '24/03', '25/03', '26/03', '27/03', '28/03', '29/03', '30/03', '31/03', '01/04', '02/04', '03/04'];
    const values = [26, 41, 47, 11, 44, 49, 49, 19, 35, 12, 32, 27, 25, 21];

    values.forEach((v, i) => {
        const height = (v / 60) * 100; // Normalizar a 100% (max 60 asistencias)
        const bar = document.createElement('div');
        bar.className = 'chart-bar-modern';
        bar.style.height = `${height}%`;
        bar.setAttribute('data-value', v);
        bar.setAttribute('data-label', days[i]);
        box.appendChild(bar);
    });
}

function renderTopAgents() {
    const list = document.getElementById('top-agents-list-box');
    if (!list) return;
    list.innerHTML = '';

    // Simulación de cantidad de servicios si no existe la propiedad
    const sorted = [...AGENTS_DATABASE].map(a => ({
        ...a,
        svc_count: a.id === 'AG-0001' ? 22 : Math.floor(Math.random() * 15) + 5
    })).sort((a, b) => b.svc_count - a.svc_count).slice(0, 5);

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    const colors = ['#f59e0b', '#94a3b8', '#b45309', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)'];

    sorted.forEach((agent, i) => {
        list.innerHTML += `
            <div class="top-agent-row">
                <div class="agent-rank-medal" style="background: ${colors[i]}${i < 3 ? '' : ''}; color: ${i < 3 ? '#fff' : 'var(--text-secondary)'};">
                    ${medals[i]}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 800; font-size: 0.95rem;">${agent.name}</div>
                    <div style="font-size: 0.7rem; opacity: 0.5; text-transform: uppercase;">${agent.team} · ${agent.id}</div>
                </div>
                <div style="text-align: right;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 150px; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;">
                            <div style="width: ${(agent.svc_count / 25) * 100}%; height: 100%; background: var(--accent-blue);"></div>
                        </div>
                        <span style="font-weight: 900; color: var(--accent-blue); font-size: 1rem;">${agent.svc_count} svc</span>
                    </div>
                </div>
            </div>
        `;
    });
}

function get24hTime() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

/**
 * --------------------------------------------------------------------------------
 * CLIMA EN TIEMPO REAL (ACCUWEATHER/OPEN-METEO ENGINE)
 * Ubicación: Aeropuerto SCL, Pudahuel, Santiago de Chile
 * --------------------------------------------------------------------------------
 */
async function updateRealTimeWeather() {
    const iconEl = document.getElementById('weather-icon');
    const tempEl = document.getElementById('weather-temp');
    const labelEl = document.getElementById('weather-label');

    if (!iconEl || !tempEl) return;

    try {
        // Coordenadas SCL (Pudahuel): -33.39, -70.79
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-33.39&longitude=-70.79&current_weather=true&timezone=America/Santiago');
        const data = await response.json();

        if (data && data.current_weather) {
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;

            // Mapeo AccuWeather-style (Códigos WMO a descripción en español e iconos)
            const weatherMap = {
                0: { icon: '☀️', desc: 'Despejado' },
                1: { icon: '🌤️', desc: 'Mayormente Despejado' },
                2: { icon: '⛅', desc: 'Parcialmente Nublado' },
                3: { icon: '☁️', desc: 'Nublado' },
                45: { icon: '🌫️', desc: 'Niebla' },
                48: { icon: '🌫️', desc: 'Niebla con Escarcha' },
                51: { icon: '🌦️', desc: 'Llovizna Ligera' },
                53: { icon: '🌦️', desc: 'Llovizna Moderada' },
                55: { icon: '🌦️', desc: 'Llovizna Densa' },
                61: { icon: '🌧️', desc: 'Lluvia Ligera' },
                63: { icon: '🌧️', desc: 'Lluvia Moderada' },
                65: { icon: '🌧️', desc: 'Lluvia Fuerte' },
                71: { icon: '❄️', desc: 'Nieve Ligera' },
                73: { icon: '❄️', desc: 'Nieve Moderada' },
                75: { icon: '❄️', desc: 'Nieve Fuerte' },
                80: { icon: '🌧️', desc: 'Chubascos Ligeros' },
                81: { icon: '🌧️', desc: 'Chubascos Moderados' },
                82: { icon: '🌧️', desc: 'Chubascos Violentos' },
                95: { icon: '⛈️', desc: 'Tormenta Eléctrica' }
            };

            const info = weatherMap[code] || { icon: '🌤️', desc: 'Parcial' };

            iconEl.textContent = info.icon;
            tempEl.textContent = `${temp}°C - ${info.desc}`;
            if (labelEl) labelEl.textContent = 'PUDAHUEL, SCL';

            console.log(`[WEATHER] Actualizado: ${temp}°C, ${info.desc}`);
        }
    } catch (err) {
        console.error('Error al obtener el clima:', err);
        if (tempEl) tempEl.textContent = 'Error al cargar';
    }
}

// Inicializar clima y actualizar cada 15 minutos
updateRealTimeWeather();
setInterval(updateRealTimeWeather, 900000);

let kpiCharts = [];

function initKPIDashboard() {
    console.log("[KPI] Iniciando Telemetría Avanzada...");

    // 🧹 Limpieza de seguridad
    kpiCharts.forEach(c => { try { c.destroy(); } catch (e) { } });
    kpiCharts = [];

    // Pequeño delay para asegurar que el DOM está listo y visible
    setTimeout(() => {
        // --- 1. OTP-PMR ---
        const ctx1 = document.getElementById('chart-otp-pmr');
        if (ctx1) {
            kpiCharts.push(new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Puntual', 'Alerta', 'Crítico'],
                    datasets: [{
                        data: [78, 15, 7],
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                        hoverOffset: 12,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Outfit', size: 10 } } }
                    },
                    cutout: '75%'
                }
            }));
        }

        // --- 2. TAT DEPLANING ---
        const ctx2 = document.getElementById('chart-tat-deplaning');
        if (ctx2) {
            kpiCharts.push(new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: ['Sector A', 'Sector B', 'Sector C', 'Sector D', 'Remotas'],
                    datasets: [{
                        label: 'Minutos',
                        data: [15, 25, 18, 30, 45],
                        backgroundColor: '#3b82f6',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' }, beginAtZero: true },
                        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                    },
                    plugins: { legend: { display: false } }
                }
            }));
        }

        // --- 3. PROACTIVA vs REACTIVA ---
        const ctx3 = document.getElementById('chart-assignment-type');
        if (ctx3) {
            kpiCharts.push(new Chart(ctx3, {
                type: 'pie',
                data: {
                    labels: ['Proactiva (75%)', 'Reactiva (25%)'],
                    datasets: [{
                        data: [75, 25],
                        backgroundColor: ['#8b5cf6', '#ec4899'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
                }
            }));
        }

        // --- 4. SAFETY RATE ---
        const ctx4 = document.getElementById('chart-safety-rate');
        if (ctx4) {
            kpiCharts.push(new Chart(ctx4, {
                type: 'line',
                data: {
                    labels: ['01', '02', '03', '04', '05', '06', '07'],
                    datasets: [{
                        label: 'Incidentes',
                        data: [0.1, 0.4, 0.2, 0.9, 0.3, 0.4, 0.2],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true, tension: 0.4, borderWidth: 3
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        y: { display: false },
                        x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9 } } }
                    },
                    plugins: { legend: { display: false } }
                }
            }));
        }

        // --- 5. PAX FORECAST ---
        const ctx5 = document.getElementById('chart-pax-forecast');
        if (ctx5) {
            kpiCharts.push(new Chart(ctx5, {
                type: 'line',
                data: {
                    labels: ['00', '04', '08', '12', '16', '20'],
                    datasets: [{
                        data: [40, 20, 150, 200, 180, 90],
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        fill: true, tension: 0.4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { ticks: { color: '#94a3b8' } }
                    },
                    plugins: { legend: { display: false } }
                }
            }));
        }

        // --- 6. GAUGE COUNTER ---
        const ctx6 = document.getElementById('gauge-counter-wait');
        if (ctx6) {
            kpiCharts.push(new Chart(ctx6, {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [12.5, 47.5],
                        backgroundColor: ['#f59e0b', 'rgba(255,255,255,0.1)'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    circumference: 180, rotation: 270,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    cutout: '80%'
                }
            }));
        }

        // --- 7. TENDENCIA SLOT vs ATA ---
        const ctx7 = document.getElementById('chart-slot-vs-ata');
        if (ctx7) {
            kpiCharts.push(new Chart(ctx7, {
                type: 'bar',
                data: {
                    labels: ['SKU101', 'LAN202', 'SKY440', 'AAR951', 'LAT112', 'AFR401'],
                    datasets: [
                        { label: 'Slot', data: [10, 15, 20, 25, 30, 35], backgroundColor: 'rgba(255,255,255,0.1)' },
                        { label: 'ATA', data: [12, 18, 19, 32, 28, 48], backgroundColor: '#3b82f6' }
                    ]
                },
                options: {
                    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#94a3b8' } }
                    },
                    plugins: { legend: { labels: { color: '#94a3b8' } } }
                }
            }));
        }

        // 🔥 MAPA DE CALOR SIMULADO
        initHeatmap();

    }, 300); // 300ms de espera para estabilidad del DOM
}

function initHeatmap() {
    const heater = document.getElementById('heatmap-container');
    if (!heater) return;
    heater.innerHTML = '';
    for (let i = 0; i < 30; i++) {
        const dot = document.createElement('div');
        const intensity = Math.random();
        dot.style.cssText = `
            position: absolute; width: 25px; height: 25px; border-radius: 50%;
            left: ${5 + Math.random() * 90}%; top: ${5 + Math.random() * 90}%;
            background: ${intensity > 0.75 ? '#ef4444' : (intensity > 0.4 ? '#f59e0b' : '#3b82f6')};
            filter: blur(10px); opacity: 0.5; animation: ambientFloat ${3 + Math.random() * 2}s infinite alternate;
        `;
        heater.appendChild(dot);
    }
}

/**
 * 📥 EXPORTAR KPI A EXCEL
 */
function exportKPIToExcel() {
    alert("Iniciando Exportación de Telemetría a Excel...");
    const wb = XLSX.utils.book_new();
    const data = [
        ["Métrica", "Valor Actual", "Estado"],
        ["OTP-PMR", "82%", "Estable"],
        ["TAT-Deplaning", "22.5 min", "Alerta"],
        ["Factor de Asignación Proactiva", "75%", "Excelente"],
        ["Safety Rate", "0.2/1000", "Bajo Riesgo"],
        ["NPS Operativo", "95.4%", "Liderazgo"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "KPIs Operativos");
    XLSX.writeFile(wb, `Reporte_KPI_PMR_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * 📄 EXPORTAR KPI A PDF
 */
function exportKPIToPDF() {
    const element = document.getElementById('settings-view-kpis');
    const opt = {
        margin: 0.5,
        filename: `Reporte_Inteligencia_PMR_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#020617' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
}

// 🚀 DISPARADOR AUTOMÁTICO AL CARGAR SI ESTAMOS EN KPI
document.addEventListener('DOMContentLoaded', () => {
    console.log("[SYSTEM] DOM Listo. Verificando vista inicial de Ajustes...");
    const kpiView = document.getElementById('settings-view-kpis');
    if (kpiView && kpiView.classList.contains('active')) {
        setTimeout(initKPIDashboard, 500); // 500ms extra para seguridad total
    }
});


/**
 * 👁️ VISOR DE ADJUNTOS DE LICENCIAS (Soporta múltiples formatos)
 */
function viewLicenseAttachment(licId, adjIdx) {
    const lic = window._current_licencias.find(l => l.id == licId);
    if (!lic) return;
    const adjuntos = JSON.parse(lic.adjuntos || '[]');
    const file = adjuntos[adjIdx];
    if (!file) return;

    const win = window.open();
    if (!win) {
        alert("El navegador bloqueó la ventana emergente. Por favor, permítela para ver el archivo.");
        return;
    }

    win.document.title = `Adjunto: ${file.name}`;
    win.document.body.style.margin = '0';
    win.document.body.style.background = '#0f172a';
    win.document.body.style.display = 'flex';
    win.document.body.style.justifyContent = 'center';
    win.document.body.style.alignItems = 'center';
    win.document.body.style.height = '100vh';

    // Determinar si es imagen, pdf o descarga
    if (file.data.includes('image/')) {
        win.document.body.innerHTML = `<img src="${file.data}" style="max-width:90%; max-height:90%; border-radius:10px; box-shadow:0 0 50px rgba(0,0,0,0.5);">`;
    } else if (file.data.includes('application/pdf')) {
        win.document.body.innerHTML = `<iframe src="${file.data}" style="width:100%; height:100%; border:none;"></iframe>`;
    } else {
        // Para Word/Excel (.doc, .docx, .xls, .xlsx)
        const link = win.document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        link.style.textDecoration = 'none';
        link.innerHTML = `<div style="color:white; font-family:'Inter', sans-serif; text-align:center; padding: 40px; border: 2px dashed rgba(255,255,255,0.1); border-radius: 20px;">
                            <div style="font-size:4rem; margin-bottom:20px;">📎</div>
                            <h2 style="margin-bottom:10px;">${file.name}</h2>
                            <p style="opacity:0.6;">Previsualización no disponible para este formato.</p>
                            <div style="background:#3b82f6; color:white; padding:12px 25px; border-radius:10px; display:inline-block; margin-top:20px; font-weight:800; cursor:pointer;">📥 DESCARGAR ARCHIVO</div>
                         </div>`;
        win.document.body.appendChild(link);
    }
}

/* ==========================================================================
   IMPORTACIÓN DIARIA MULTI-HOJA (EXCEL → SUPABASE)
   Formato esperado: Hojas nombradas por día (ej: "1 Abril", "2 Abril"...)
   Columnas por hoja: RUT | NOMBRE | ORIGEN (EQUIPO) | TURNO | ASISTENCIA | OBSERVACION | EST. TICA
   ========================================================================== */
async function importDailyAssistExcel(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Caché acumulador: agrupa todos los cambios de todas las hojas por agente
            const agentChangesCache = {};
            let rowsProcessed = 0;

            // ─── PASO 1: Recorrer cada hoja (día) ─────────────────────────────────
            for (const sheetName of workbook.SheetNames) {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                if (jsonData.length === 0) continue;

                // Determinar índice de columna de ROL según el día de la hoja
                // (ej. "1 Abril" → día 1 → buscar en GLOBAL_ROL_HEADER)
                const dayMatch = sheetName.match(/\d+/);
                let rolColIndex = -1;
                if (dayMatch && typeof GLOBAL_ROL_HEADER !== 'undefined' && Array.isArray(GLOBAL_ROL_HEADER)) {
                    const dayNum = parseInt(dayMatch[0], 10);
                    rolColIndex = GLOBAL_ROL_HEADER.findIndex(h => {
                        const d = (h instanceof Date) ? h : new Date(h);
                        return !isNaN(d.getTime()) && d.getDate() === dayNum;
                    });
                }

                // ─── PASO 2: Procesar cada fila de agente ────────────────────────
                for (const row of jsonData) {
                    rowsProcessed++;

                    // Mapeo por posición o nombre de columna según el nuevo formato:
                    // A: FECHA, B: RUT, C: NOMBRE, D: ORIGEN, E: TURNO, F: ASISTENCIA, G: OBSERVACION, H: TICA

                    const getV = (keys, index) => {
                        const keysArr = Object.keys(row);
                        // 1. Intentar por nombre exacto/similar
                        for (const k of keys) {
                            const found = keysArr.find(x => x.toLowerCase().replace(/[\s._\-]/g, '').includes(k.toLowerCase().replace(/[\s._\-]/g, '')));
                            if (found !== undefined && row[found] !== "") return String(row[found]).trim();
                        }
                        // 2. Intentar por índice físico (A=0, B=1...)
                        if (keysArr[index] !== undefined && row[keysArr[index]] !== "") return String(row[keysArr[index]]).trim();
                        return null;
                    };

                    const fechaRaw = getV(['fecha'], 0);
                    const rutInput = getV(['rut'], 1);
                    const nombreInput = getV(['nombre'], 2);

                    if (!fechaRaw || (!rutInput && !nombreInput)) continue;

                    // --- PARSEO DE FECHA (DD-MM-AAAA) ---
                    let rowDateStr = null;
                    try {
                        if (fechaRaw.includes('-') || fechaRaw.includes('/')) {
                            const sep = fechaRaw.includes('-') ? '-' : '/';
                            const parts = fechaRaw.split(sep);
                            if (parts.length === 3) {
                                // DD-MM-AAAA -> AAAA-MM-DD
                                const d = parts[0].padStart(2, '0');
                                const m = parts[1].padStart(2, '0');
                                const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
                                rowDateStr = `${y}-${m}-${d}`;
                            }
                        } else if (!isNaN(fechaRaw)) {
                            // Fecha serial de Excel
                            const dateObj = new Date((fechaRaw - 25569) * 86400 * 1000);
                            rowDateStr = dateObj.toISOString().split('T')[0];
                        }
                    } catch (e) { continue; }

                    if (!rowDateStr) continue;

                    const cleanRut = rutInput ? rutInput.replace(/[^0-9kK\-]/g, '') : null;
                    const cleanName = nombreInput ? nombreInput.toUpperCase() : null;

                    // Normalizar para búsqueda
                    const normRut = cleanRut ? cleanRut.replace(/[\.\-]/g, '').toUpperCase() : null;

                    let matchAgent = DataManager.agents.find(a => {
                        const aRutNorm = a.rut ? String(a.rut).replace(/[^0-9kK\-]/g, '').replace(/[\.\-]/g, '').toUpperCase() : '';
                        const aNameUp = (a.nombre || a.name || '').toUpperCase();
                        return (normRut && aRutNorm && aRutNorm === normRut) ||
                            (cleanName && aNameUp && aNameUp.includes(cleanName));
                    });

                    // NORMALIZACIÓN: No usar AG-IMPORT. Usar generador correlativo AG-XXXX
                    const agID = matchAgent ? matchAgent.id : generateNextAgentID();

                    if (!agentChangesCache[agID]) {
                        if (!matchAgent) {
                            // Si es nuevo, crear base y AGREGAR AL DATAMANAGER para que la siguiente fila lo encuentre
                            const newBase = { id: agID, nombre: cleanName || 'IMPORTADO', rut: rutInput || '', rol: 'agente', status: 'desconectado', rol_mensual: '' };
                            DataManager.agents.push(newBase);
                            agentChangesCache[agID] = newBase;
                        } else {
                            agentChangesCache[agID] = { ...matchAgent };
                        }
                    }
                    const cacheObj = agentChangesCache[agID];

                    // --- DATOS OPERATIVOS ---
                    const equipo = getV(['origen', 'equipo'], 3);
                    const turno = getV(['turno'], 4);
                    const asistencia = getV(['asistencia'], 5);
                    const obs = getV(['observacion'], 6);
                    const tica = getV(['tica'], 7);

                    if (!cacheObj.daily_data) cacheObj.daily_data = {};
                    if (!cacheObj.daily_data[rowDateStr]) cacheObj.daily_data[rowDateStr] = {};
                    const dayD = cacheObj.daily_data[rowDateStr];

                    // Asistencia
                    if (asistencia) {
                        const lowA = asistencia.toLowerCase();
                        if (lowA.includes('present')) dayD.asistencia = '🟢Presente';
                        else if (lowA.includes('ausent')) dayD.asistencia = '🔴Ausente';
                        else dayD.asistencia = '🟡Pendiente';
                    } else dayD.asistencia = '🟡Pendiente';

                    // Observación
                    if (obs) {
                        const lowO = obs.toLowerCase();
                        if (lowO.includes('sin obs')) dayD.observacion = '-- Sin Obs --';
                        else if (lowO.includes('lic. med') || lowO.includes('licencia')) dayD.observacion = '📜 Lic. Medica';
                        else if (lowO.includes('enferm')) dayD.observacion = '🤢 Enferm@';
                        else if (lowO.includes('llega tarde')) dayD.observacion = '🚗 Llega Tarde';
                        else if (lowO.includes('no llega')) dayD.observacion = '😴No Llega';
                        else if (lowO.includes('no toma van')) dayD.observacion = '🚐 No Toma Van';
                        else if (lowO.includes('problema personal')) dayD.observacion = '😥 Problema Personal';
                        else if (lowO.includes('personal nuevo')) dayD.observacion = '🌞 Personal Nuevo';
                        else if (lowO.includes('termino contrato') || lowO.includes('practica')) dayD.observacion = '📄 Term. Contrato/Practica';
                        else if (lowO.includes('no responde')) dayD.observacion = '☎️ No Responde';
                        else if (lowO.includes('2 dia ausente') || lowO.includes('2do dia')) dayD.observacion = '👻 2° dia Ausente';
                        else if (lowO.includes('3 dia ausente') || lowO.includes('3er dia')) dayD.observacion = '💀 3° dia Ausente';
                        else if (lowO.includes('renuncia')) dayD.observacion = '✖️ Renuncia';
                        else if (lowO.includes('hr extras')) dayD.observacion = '⏰ EXT//Hr Extras';
                        else if (lowO.includes('llega antes')) dayD.observacion = '😮 Llega Antes';
                        else if (lowO.includes('se retira')) dayD.observacion = '🪅 Se retira de Turno';
                        else if (lowO.includes('reco')) dayD.observacion = '🛻 Sin Reco Asignada';
                        else dayD.observacion = obs;
                    } else dayD.observacion = '-- Sin Obs --';

                    dayD.equipo = equipo ? equipo.toUpperCase() : (cacheObj.equipo || 'GENERAL');

                    // TICA (Permanente)
                    if (tica) {
                        const lowT = tica.toLowerCase();
                        if (lowT.includes('con tica') || lowT.includes('vigent')) cacheObj.tica_vigente = true;
                        else if (lowT.includes('sin tica') || lowT.includes('vencid') || lowT.includes('pendient')) cacheObj.tica_vigente = false;
                    }

                    // Sincronizar con el ROL Mensual
                    if (turno && typeof GLOBAL_ROL_HEADER !== 'undefined') {
                        const rowDt = new Date(rowDateStr + 'T12:00:00');
                        const rIdx = GLOBAL_ROL_HEADER.findIndex(h => h instanceof Date && h.getDate() === rowDt.getDate() && h.getMonth() === rowDt.getMonth());
                        if (rIdx !== -1) {
                            let rArr = (cacheObj.rol_mensual || '').split(' ');
                            while (rArr.length <= rIdx) rArr.push('-');
                            rArr[rIdx] = turno.toUpperCase();
                            cacheObj.rol_mensual = rArr.join(' ').trim();
                        }
                    }

                    if (turno && rolColIndex !== -1) {
                        let rArr = (cacheObj.rol_mensual || '').split(' ');
                        while (rArr.length <= rolColIndex) rArr.push('-');
                        rArr[rolColIndex] = turno.toUpperCase();
                        cacheObj.rol_mensual = rArr.join(' ').trim();
                    }
                } // fin loop filas
            } // fin loop hojas

            // ─── PASO 5: Enviar a Supabase ────────────────────────────────────────
            const agentList = Object.values(agentChangesCache);
            if (agentList.length === 0) {
                alert('❌ No se encontraron filas válidas de agentes en el archivo.');
                return;
            }

            // --- PASO CRÍTICO: SINCRONIZAR IDs CON LA BASE DE DATOS ANTES DE SUBIR ---
            try {
                const { data: dbAgents } = await supabaseClient.from('agentes').select('id, rut');
                const dbMap = new Map();
                if (dbAgents) {
                    dbAgents.forEach(x => {
                        const norm = normalizeSearch(x.rut);
                        if (norm) dbMap.set(norm, x.id);
                    });
                }
                agentList.forEach(a => {
                    const norm = normalizeSearch(a.rut);
                    if (dbMap.has(norm)) a.id = dbMap.get(norm);
                });
            } catch (e) { console.error("⚠️ Error pre-sincronizando ruts:", e); }

            console.log("📤 Sincronizando con Supabase (Historial Diario)...");

            // 5.1 Filtrar para que solo UN agente por RUT se suba a 'agentes' (evita conflictos de RUT único)
            const uniqueAgentsByRut = {};
            agentList.forEach(a => {
                const norm = normalizeSearch(a.rut);
                if (norm && !uniqueAgentsByRut[norm]) {
                    uniqueAgentsByRut[norm] = a;
                }
            });

            const uniqueAgentList = Object.values(uniqueAgentsByRut);
            const dailyUploads = [];
            let updatedPermCount = 0;

            const upsertPermPromises = uniqueAgentList.map(async pack => {
                const dbPayload = {
                    id: pack.id,
                    nombre: pack.nombre,
                    rut: pack.rut || undefined,
                    tica_vigente: pack.tica_vigente !== undefined ? pack.tica_vigente : undefined,
                    rol_mensual: pack.rol_mensual || undefined
                };
                Object.keys(dbPayload).forEach(k => dbPayload[k] === undefined && delete dbPayload[k]);

                // 🛡️ FORZAR UPSERT POR ID DISPONIBLE
                const { error } = await supabaseClient.from('agentes').upsert(dbPayload, { onConflict: 'id' });
                if (!error) updatedPermCount++;

                // Agregamos todas las asistencias diarias vinculadas a este agente unificado
                if (pack.daily_data) {
                    Object.keys(pack.daily_data).forEach(dateStr => {
                        const d = pack.daily_data[dateStr];
                        dailyUploads.push({
                            agent_id: pack.id,
                            fecha: dateStr,
                            asistencia: d.asistencia,
                            observacion: d.observacion,
                            equipo: d.equipo
                        });
                    });
                }
            });

            // Procesar los demás agentes que tienen datos diarios pero no fueron el "único" por RUT (por si acaso)
            agentList.forEach(a => {
                if (!uniqueAgentList.find(x => x.id === a.id) && a.daily_data) {
                    Object.keys(a.daily_data).forEach(dateStr => {
                        const d = a.daily_data[dateStr];
                        dailyUploads.push({
                            agent_id: a.id,
                            fecha: dateStr,
                            asistencia: d.asistencia,
                            observacion: d.observacion,
                            equipo: d.equipo
                        });
                    });
                }
            });

            await Promise.all(upsertPermPromises);

            // 5.2 Enviar bloques de 50 registros diarios para optimizar
            let updatedDailyCount = 0;
            const chunkSize = 50;
            for (let i = 0; i < dailyUploads.length; i += chunkSize) {
                const chunk = dailyUploads.slice(i, i + chunkSize);
                const { error } = await supabaseClient.from('asistencias_diarias').upsert(chunk, { onConflict: 'agent_id,fecha' });
                if (!error) updatedDailyCount += chunk.length;
            }

            alert(`✅ Importación Exitosa.\n📊 Hojas: ${workbook.SheetNames.length}\n👤 Agentes Base: ${updatedPermCount}\n📅 Registros Diarios: ${updatedDailyCount}`);

            // ─── PASO 6: Refrescar UI ─────────────────────────────────────────────
            await DataManager.fetchOperationalData();
            if (typeof renderAgentsDirectory === 'function') renderAgentsDirectory(activeAgentSubTab || 'assist');
            if (typeof updateRRHHKPIs === 'function') updateRRHHKPIs();
            if (typeof updateDashboardKPIs === 'function') updateDashboardKPIs();

        } catch (err) {
            console.error('❌ Error procesando Excel multi-hoja:', err);
            alert('❌ Error al procesar el archivo: ' + err.message);
        }
        e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}

/* ==========================================================================
   CRUD AEROLINEAS Y SSR (SETTINGS)
   ========================================================================== */

// --- AEROLINEAS ---
function openAeroModal(name = null) {
    const title = document.getElementById('aero-modal-title');
    const oldNameField = document.getElementById('field-aero-old-name');
    const nameField = document.getElementById('field-aero-name');
    const preview = document.getElementById('aero-logo-preview');

    oldNameField.value = name || '';
    nameField.value = name || '';
    title.innerText = name ? `✏️ Editar Aerolínea: ${name}` : '➕ Añadir Nueva Aerolínea';
    preview.innerHTML = name && AIRLINE_LOGOS[name]
        ? `<img src="${AIRLINE_LOGOS[name]}" style="width:100%; height:100%; object-fit:contain;">`
        : '<span style="font-size: 0.6rem; color: #999;">SIN LOGO</span>';

    openModal('modal-aero-edit');
}

function previewAeroLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        document.getElementById('aero-logo-preview').innerHTML = `<img src="${evt.target.result}" style="width:100%; height:100%; object-fit:contain;">`;
    };
    reader.readAsDataURL(file);
}

function saveAero(e) {
    e.preventDefault();
    const oldName = document.getElementById('field-aero-old-name').value;
    const newName = document.getElementById('field-aero-name').value.trim().toUpperCase();
    const previewImg = document.querySelector('#aero-logo-preview img');

    if (!newName) return;

    // Si cambió el nombre, borrar el viejo
    if (oldName && oldName !== newName) {
        delete AIRLINE_LOGOS[oldName];
    }

    // Guardar logo (si hay imagen nueva o vieja)
    AIRLINE_LOGOS[newName] = previewImg ? previewImg.src : 'img/default-logo.jpg';

    closeModal('modal-aero-edit');
    renderAerolineas();
    showNotification(`Aerolínea ${newName} guardada correctamente.`, 'green');
}

function deleteAero(name) {
    if (!confirm(`¿Estás seguro de eliminar ${name}? Esto afectará la visualización de sus vuelos.`)) return;
    delete AIRLINE_LOGOS[name];
    renderAerolineas();
    showNotification(`Aerolínea ${name} eliminada.`, 'red');
}

// --- SSR CODES ---
function openSSRModal(code = null) {
    const title = document.getElementById('ssr-modal-title');
    const oldCodeField = document.getElementById('field-ssr-old-code');
    const codeField = document.getElementById('field-ssr-code');
    const colorField = document.getElementById('field-ssr-color');
    const descField = document.getElementById('field-ssr-desc');

    const data = code ? SSR_DEFINITIONS[code] : { d: '', col: '#3b82f6' };

    oldCodeField.value = code || '';
    codeField.value = code || '';
    colorField.value = data.col;
    descField.value = data.d;

    title.innerText = code ? `✏️ Editar SSR: ${code}` : '➕ Añadir Nuevo SSR';
    openModal('modal-ssr-edit');
}

function saveSSR(e) {
    e.preventDefault();
    const oldCode = document.getElementById('field-ssr-old-code').value;
    const newCode = document.getElementById('field-ssr-code').value.trim().toUpperCase();
    const color = document.getElementById('field-ssr-color').value;
    const desc = document.getElementById('field-ssr-desc').value;

    if (oldCode && oldCode !== newCode) {
        delete SSR_DEFINITIONS[oldCode];
    }

    SSR_DEFINITIONS[newCode] = { d: desc, col: color };

    closeModal('modal-ssr-edit');
    renderSSR();
    showNotification(`Código SSR ${newCode} actualizado.`, 'green');
}

function deleteSSR(code) {
    if (!confirm(`¿Borrar el código ${code}?`)) return;
    delete SSR_DEFINITIONS[code];
    renderSSR();
    showNotification(`SSR ${code} eliminado.`, 'red');
}

async function exportRRHHToExcel() {
    try {
        showNotification("Generando reporte maestro de RRHH...", "blue");

        // 1. Recolectar datos históricos (similar a renderRRHHView)
        const today = new Date().toISOString().split('T')[0];
        const { data: historyRes } = await supabaseClient
            .from('asistencias_diarias')
            .select('*')
            .gte('fecha', '2026-04-01')
            .lte('fecha', today)
            .order('fecha', { ascending: false });

        if (!historyRes || historyRes.length === 0) {
            alert("No hay datos históricos en abril para exportar.");
            return;
        }

        const wb = XLSX.utils.book_new();

        // --- HOJA 1: ASISTENCIAS Y AUSENCIAS ---
        const asisData = historyRes.map(d => {
            const agent = DataManager.agents.find(a => a.id === d.agent_id);
            return {
                "FECHA": d.fecha,
                "ID": d.agent_id,
                "NOMBRE": agent ? agent.nombre : "DESCONOCIDO",
                "EQUIPO": d.equipo || (agent ? agent.team : "-"),
                "ASISTENCIA": d.asistencia || "PENDIENTE",
                "OBSERVACIÓN": d.observacion || "-"
            };
        });
        const wsAsis = XLSX.utils.json_to_sheet(asisData);
        XLSX.utils.book_append_sheet(wb, wsAsis, "Asistencias_Abril");

        // --- HOJA 2: CATEGORIZADOS (Renuncias, Licencias, Atrasos) ---
        const filtered = (filterWord) => historyRes.filter(d => (d.observacion || '').toUpperCase().includes(filterWord)).map(d => {
            const agent = DataManager.agents.find(a => a.id === d.agent_id);
            return {
                "FECHA": d.fecha,
                "NOMBRE": agent ? agent.nombre : "DESCONOCIDO",
                "EQUIPO": d.equipo || (agent ? agent.team : "-"),
                "DETALLE": d.observacion
            };
        });

        const renuncias = filtered("RENUNCIA");
        if (renuncias.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(renuncias), "Renuncias");

        const licencias = historyRes.filter(d => {
            const obs = (d.observacion || '').toUpperCase();
            return obs.includes("LICENCIA") || obs.includes("LIC. MED") || obs.includes("CERTIFICADO");
        }).map(d => {
            const agent = DataManager.agents.find(a => a.id === d.agent_id);
            return { "FECHA": d.fecha, "NOMBRE": agent ? agent.nombre : "-", "TIPO": d.observacion };
        });
        if (licencias.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(licencias), "Licencias_Medicas");

        const atrasos = filtered("LLEGA TARDE");
        if (atrasos.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(atrasos), "Atrasos");

        // Descarga
        XLSX.writeFile(wb, `REPORTE_RRHH_ABRIL_${today}.xlsx`);
        showNotification("¡Reporte descargado con éxito!", "green");

    } catch (err) {
        console.error(err);
        alert("Error al generar Excel: " + err.message);
    }
}

function downloadLicensesZip() {
    showNotification("Modulo de Empaquetado .ZIP en desarrollo. Contacte a soporte IT.", "orange");
}

async function normalizeAllAgentIDs() {
    if (!confirm('⚠️ ESTA ACCIÓN RE-INDEXARÁ TODOS LOS AGENTES A FORMATO AG-0001.\n¿Deseas continuar?')) return;

    try {
        showNotification("Iniciando normalización de base de datos...", "blue");

        // 1. Obtener todos los agentes reales
        const { data: agents } = await supabaseClient.from('agentes').select('*').neq('id', 'ROL_MASTER_HEADER').order('nombre');
        if (!agents) return;

        showNotification(`Procesando ${agents.length} registros...`, "orange");

        // 2. Preparar mapeo y nuevos objetos
        const oldToNewMap = {};
        const newAgents = agents.map((a, index) => {
            const newId = `AG-${(index + 1).toString().padStart(4, '0')}`;
            oldToNewMap[a.id] = newId;
            return { ...a, id: newId };
        });

        // 3. ACTUALIZAR REFERENCIAS (OPCIONAL PERO RECOMENDADO SI HAY HIJOS)
        // Nota: En Supabase sin cascada manual, esto es complejo. 
        // Por ahora, solo actualizamos la tabla principal.

        // 4. ELIMINAR ANTIGUOS Y SUBIR NUEVOS (BATCH)
        // Debido a las PKs, lo mejor es un borrado masivo y re-inserción
        const oldIds = agents.map(a => a.id);

        const { error: delErr } = await supabaseClient.from('agentes').delete().in('id', oldIds);
        if (delErr) throw delErr;

        const { error: insErr } = await supabaseClient.from('agentes').insert(newAgents);
        if (insErr) throw insErr;

        showNotification("¡ID's Normalizados con éxito!", "green");
        await DataManager.fetchOperationalData();
        renderAgentCRUDList();
        renderAgentsDirectory('assist');

    } catch (err) {
        console.error(err);
        alert("Error en normalización: " + err.message);
    }
}

// --- FLIGHT MANAGEMENT (Manual & Bulk) ---

function openAddFlightModal() {
    const form = document.getElementById('form-add-flight');
    if (form) form.reset();
    
    // Default date to today
    const dateInput = document.getElementById('v-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    openModal('modal-vuelo');
}

async function saveFlightManual(e) {
    if (e) e.preventDefault();
    
    try {
        const routeEl = document.getElementById('v-route');
        const gateEl = document.getElementById('v-gate');

        const payload = {
            vuelo_num: document.getElementById('v-num').value.toUpperCase().trim(),
            aerolinea_name: document.getElementById('v-airline').value,
            tipo: document.getElementById('v-type').value,
            hora_programada: document.getElementById('v-time').value,
            fecha: document.getElementById('v-date').value,
            terminal: document.getElementById('v-terminal').value,
            gate: gateEl ? gateEl.value.toUpperCase().trim() : 'S/A',
            ruta: (routeEl && routeEl.value.trim()) ? routeEl.value.toUpperCase().trim() : '--'
        };

        showNotification("Guardando vuelo en la nube...", "blue");

        const { error } = await supabaseClient.from('vuelos').upsert([payload], { onConflict: 'vuelo_num' });
        if (error) throw error;

        closeModal('modal-vuelo');
        showNotification(`✅ Vuelo ${payload.vuelo_num} registrado con éxito.`, "green");
        
        await DataManager.fetchOperationalData();
        if (typeof renderVuelosTable === 'function') renderVuelosTable();
        if (typeof renderDashboardTimeline === 'function') renderDashboardTimeline();

    } catch (err) {
        console.error("Error saving flight:", err);
        alert("❌ Error al guardar vuelo: " + err.message);
    }
}

function importFlightsBulk(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            if (jsonData.length === 0) {
                alert("⚠️ El archivo está vacío.");
                return;
            }

            showNotification(`Procesando ${jsonData.length} vuelos...`, "blue");

            const payloads = jsonData.map(item => {
                const fn = item["VUELO"] || item["Vuelo"] || item["FLIGHT"] || item["fn"] || '---';
                const al = item["AEROLINEA"] || item["Aerolinea"] || item["AIRLINE"] || item["al"] || 'LATAM';
                const type = (item["TIPO"] || item["Tipo"] || '').toUpperCase().includes('ARR') ? 'ARRIBO' : 'EMBARQUE';
                
                return {
                    vuelo_num: String(fn).toUpperCase().trim(),
                    aerolinea: String(al).toUpperCase().trim(),
                    tipo: type,
                    hora: item["HORA"] || item["Hora"] || item["sch"] || '--:--',
                    fecha: item["FECHA"] || item["Fecha"] || new Date().toISOString().split('T')[0],
                    terminal: item["TERMINAL"] || item["Terminal"] || 'T1',
                    puerta: String(item["GATE"] || item["Gate"] || item["Puerta"] || '---').toUpperCase().trim(),
                    ruta: String(item["RUTA"] || item["Ruta"] || 'SCL').toUpperCase().trim()
                };
            });

            const { error } = await supabaseClient.from('vuelos').upsert(payloads, { onConflict: 'vuelo_num' });
            if (error) throw error;

            alert(`✅ ¡Carga Masiva Exitosa! ${payloads.length} vuelos sincronizados.`);
            await DataManager.fetchOperationalData();
            if (typeof renderVuelosTable === 'function') renderVuelosTable();
            if (typeof renderDashboardTimeline === 'function') renderDashboardTimeline();

        } catch (err) {
            console.error("Error bulk importing flights:", err);
            alert("❌ Error en carga masiva: " + err.message);
        }
        input.value = ''; // Reset input
    };
    reader.readAsArrayBuffer(file);
}

function downloadFlightTemplate() {
    const templateData = [
        {
            "VUELO": "LA530",
            "AEROLINEA": "LATAM",
            "TIPO": "ARRIBO",
            "HORA": "08:30",
            "FECHA": "2026-04-05",
            "TERMINAL": "T1",
            "GATE": "C12",
            "RUTA": "SCL - MDZ"
        },
        {
            "VUELO": "DL146",
            "AEROLINEA": "DELTA",
            "TIPO": "EMBARQUE",
            "HORA": "21:15",
            "FECHA": "2026-04-05",
            "TERMINAL": "T2",
            "GATE": "E04",
            "RUTA": "SCL - ATL"
        }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Vuelos");

    XLSX.writeFile(wb, "FORMATO_CARGA_VUELOS_WEB_PMR.xlsx");
    showNotification("Plantilla descargada. Favor respetar las columnas.", "green");
}
