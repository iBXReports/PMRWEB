/**
 * 📱 AGENTE PMR - MÓDULO OPERATIVO AVANZADO + GESTIÓN RRHH
 * Perfil, Turnos (Pintado/Pintar), iCal EXTREME, Licencias Médicas
 */

const SESSION_USER = JSON.parse(localStorage.getItem('webPmr_user'));
let CURRENT_AGENT_ID = SESSION_USER ? SESSION_USER.id : null;
const NOTI_SOUND = new Audio('Sonidos/noti1.mp3');
let knownTaskIds = new Set();

const SUPABASE_URL = "https://tgyltxcabrbegwlmcbmv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRneWx0eGNhYnJiZWd3bG1jYm12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMzE2NjcsImV4cCI6MjA5MDkwNzY2N30.wguY1f1HKaP4b8pCdO355Yf1pdcD9GJAalp4xQyCHuU";
const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const LOCATIONS = [
    'Informar', 'Puente Arribo', 'Punto T1', 'Punto T2', 'Embarque A', 'Embarque B',
    'Embarque C', 'Embarque D', 'Embarque E', 'Embarque F', 'Salón VIP', 'Minsal',
    'Plaza Central', 'Conexiones', 'Salida AMB', 'Counters'
];

const STATUS_PAX_OPTIONS = [
    '🚶‍♂️ No Requiere', '👨‍🦽 Contactado', '🤳 No Contactado',
    '💺 Embarcado', '🛬 Desembarcado', '⚠️ No Embarcado', '💙 Finalizado'
];

// Logic State for Shifts
let monthlyShifts = {};
let selectedPaintTurn = 'L'; // Default: Libre
let customTurns = {
    M: ['M0513', 'M0514', 'M0515', 'M0516', 'M0517', 'M0718', 'M0719', 'M0819', 'M0820', 'M0921'],
    T: ['T1300', 'T1401', 'T1402', 'T1321', 'T1323', 'T1322', 'T1422', 'T1423', 'T1502', 'T1603', 'T1704'],
    N: ['N1805', 'N1906', 'N1907', 'N2007', 'N2008'],
    L: ['L'], S: ['S'], V: ['V']
};
let medicalLicenses = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!SESSION_USER) { window.location.href = 'Login.html'; return; }

    initApp();
    setupClock();
    setupProfileForm();
    initShiftLogic();
    setupManualPmr();

    // Solicitar permiso de notificaciones nativas
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    // Polling de Tareas
    checkTasks();
    setInterval(checkTasks, 5000);
});

function initApp() {
    // 🛡️ REPARACIÓN: Sincronizar ID global con la sesión real
    CURRENT_AGENT_ID = SESSION_USER.id;

    document.getElementById('agent-id-tag').textContent = `${SESSION_USER.id} • ${SESSION_USER.equipo}`;
    document.getElementById('agent-name-display').textContent = SESSION_USER.nombre;
    const avatar = document.getElementById('agent-avatar-img');
    if (avatar) avatar.src = `https://i.pravatar.cc/150?u=${SESSION_USER.id}`;

    if (localStorage.getItem('pmr_mobile_theme') === 'light') toggleMobileTheme(true);
}

function setupClock() {
    const update = () => {
        const now = new Date();
        const clock = document.getElementById('mobile-clock');
        const date = document.getElementById('mobile-date');
        if (clock) clock.textContent = now.toLocaleTimeString('es-ES', { hour12: false });
        if (date) {
            const options = { weekday: 'short', day: '2-digit', month: 'short' };
            date.textContent = now.toLocaleDateString('es-ES', options).toUpperCase();
        }
    };
    update();
    setInterval(update, 1000);
}

/**
 * 🛰️ GESTIÓN DE TAREAS
 */
async function checkTasks() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient
            .from('asistencias')
            .select('*')
            .eq('agente_id', CURRENT_AGENT_ID)
            // 🛡️ REPARACIÓN: Permitir que vengan tareas finalizadas para el Historial
            .order('asignado_at', { ascending: false })
            .limit(20); // Traer las últimas 20 para no saturar

        if (error) throw error;
        if (data) processTasks(data);
    } catch (e) { console.error("Error polling Supabase:", e); }
}

function processTasks(tasks) {
    const asign = tasks.filter(t => t.status === 'pendiente');
    const tramos = tasks.filter(t => t.status === 'en curso');
    const hist = tasks.filter(t => t.status === 'finalizado' || t.status === 'rechazado');

    // 🔔 ALERTAS Y NOTIFICACIONES NATIVAS
    tasks.forEach(t => {
        if (!knownTaskIds.has(t.id)) {
            knownTaskIds.add(t.id);
            if (t.status === 'pendiente') triggerNotification(t);
        }
    });

    renderAsignaciones(asign);
    renderTramos(tramos);
    renderHistorial(hist);
    updateStats(hist.filter(h => h.status === 'finalizado').length);
}

function triggerNotification(t) {
    if (NOTI_SOUND) NOTI_SOUND.play();
    if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200]);

    // 🌍 Notificación Nativa (Escritorio / Android)
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`🚀 NUEVA MISIÓN PMR`, {
            body: `Pasajero: ${t.pax_name}\nVuelo: ${t.vuelo_num}\nAsignado a: ${CURRENT_AGENT_ID}`,
            icon: 'favicon.ico',
            tag: `pax-${t.id}`
        });
    }
}

function renderAsignaciones(list) {
    const container = document.getElementById('active-tasks-list');
    if (list.length === 0) { container.innerHTML = `<div style="text-align:center; padding:40px; opacity:0.5;">😴 Sin nuevas asignaciones.</div>`; return; }
    container.innerHTML = list.map(t => `
        <div class="task-card-mobile" style="border-left: 5px solid var(--accent-warning);">
            <div class="task-header"><b class="flight-tag">${t.vuelo_num}</b><span class="ssr-tag">${t.ssr}</span></div>
            <span class="pax-name">👤 ${t.pax_name}</span>
            <div class="info-grid">
                <div class="info-item"><label>Acción</label><span>${t.category}</span></div>
                <div class="info-item"><label>Tramo</label><span>${t.transfer_type}</span></div>
            </div>
            <div class="btn-group-mobile">
                <button class="btn-mobile btn-acc" onclick="updateTaskStatus('${t.id}', 'en curso')">ACEPTAR</button>
                <button class="btn-mobile btn-rej" onclick="updateTaskStatus('${t.id}', 'rechazado')">RECHAZAR</button>
            </div>
        </div>
    `).join('');
}

function renderTramos(list) {
    const container = document.getElementById('en-curso-tasks-list');
    if (list.length === 0) { container.innerHTML = `<div style="text-align:center; padding:40px; opacity:0.5;">🛣 No tienes tramos activos.</div>`; return; }
    container.innerHTML = list.map(t => `
        <div class="task-card-mobile" style="border-left: 5px solid var(--accent-primary);">
            <div class="task-header"><b class="flight-tag">${t.vuelo_num}</b><span class="ssr-tag">${t.ssr}</span></div>
            <span class="pax-name">👤 ${t.pax_name}</span>
            <div class="info-grid">
                <div class="info-item"><label>Hora</label><span>${new Date(t.asignado_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                <div class="info-item"><label>Agente</label><span>${CURRENT_AGENT_ID}</span></div>
            </div>
            <div class="info-item" style="margin-bottom:10px;"><label>📍 Tomado En</label>
                <select class="loc-select" onchange="syncTaskField('${t.id}', 'tomado_en', this.value)">
                    ${LOCATIONS.map(l => `<option value="${l}" ${t.tomado_en === l ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
            </div>
            <div class="info-item" style="margin-bottom:10px;"><label>🏁 Dejado En</label>
                <select class="loc-select" onchange="syncTaskField('${t.id}', 'dejado_en', this.value)">
                    ${LOCATIONS.map(l => `<option value="${l}" ${t.dejado_en === l ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
            </div>
            <div class="info-item" style="margin-bottom:10px;"><label>📋 Status Pax</label>
                <select class="status-select" onchange="syncTaskField('${t.id}', 'status_pax', this.value)">
                    ${STATUS_PAX_OPTIONS.map(o => `<option value="${o}" ${t.status_pax === o ? 'selected' : ''}>${o}</option>`).join('')}
                </select>
            </div>
            <button class="btn-mobile btn-fin" onclick="updateTaskStatus('${t.id}', 'finalizado')">💙 FINALIZAR TRAMO</button>
        </div>
    `).join('');
}

function renderHistorial(list) {
    const container = document.getElementById('historial-tasks-list');
    if (!container) return;
    if (list.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; opacity:0.5;">Sin historial hoy.</div>`;
        return;
    }

    container.innerHTML = list.map(t => {
        const time = t.finalizado_at ? new Date(t.finalizado_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
        const statusIcon = t.status === 'finalizado' ? '✅' : '❌';
        return `
        <div class="hist-item" style="border-left: 3px solid ${t.status === 'finalizado' ? '#10b981' : '#ef4444'}; margin-bottom:10px; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">
            <div class="hist-info">
                <div style="font-weight:800; color:white;">${statusIcon} ${t.vuelo_num} • ${t.pax_name}</div>
                <div style="font-size:0.75rem; opacity:0.6;">${t.status === 'finalizado' ? 'FINALIZADO' : 'RECHAZADO'} | SSR: ${t.ssr || '---'}</div>
            </div>
            <div style="text-align:right; font-size:0.7rem; opacity:0.5;">${time}</div>
        </div>`;
    }).join('');
}

/**
 * 🛠 ACTUALIZACIONES Y SYNC
 */
async function updateTaskStatus(taskId, status) {
    if (!supabaseClient) return;
    try {
        const updateData = { status: status };
        // 🛡️ REPARACIÓN: Columnas oficiales de Telemetría
        if (status === 'en curso') updateData.aceptado_at = new Date().toISOString();
        if (status === 'finalizado') updateData.finalizado_at = new Date().toISOString();

        const { error } = await supabaseClient
            .from('asistencias')
            .update(updateData)
            .eq('id', taskId);

        if (error) throw error;
        if (window.navigator.vibrate) window.navigator.vibrate(50);

        await checkTasks(); // Sincronizar listas tras cambio
    } catch (err) {
        console.error("Error updating status:", err);
        alert(`❌ Error al actualizar estado: ${err.message || 'Error de conexión'}`);
    }
}

async function syncTaskField(taskId, fieldName, value) {
    if (!supabaseClient) return;
    try {
        const updateData = {};
        updateData[fieldName] = value;
        const { error } = await supabaseClient
            .from('asistencias')
            .update(updateData)
            .eq('id', taskId);
        if (error) throw error;
    } catch (e) { console.error("Error syncing field:", e); }
}

/**
 * ⚙ PERFIL Y CONFIGURACIÓN
 */
function setupProfileForm() {
    const form = document.getElementById('profile-config-form');
    if (!form) return;

    // Cargar datos actuales desde SESSION_USER (inicial)
    loadProfileFields(SESSION_USER);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-profile');
        const oldText = btn.textContent;
        btn.textContent = "⏳ GUARDANDO EN DB..."; btn.disabled = true;
        const payload = {
            id: CURRENT_AGENT_ID,
            direccion: document.getElementById('conf-direccion').value,
            num: document.getElementById('conf-num').value,
            comuna: document.getElementById('conf-comuna').value,
            telefono: document.getElementById('conf-telefono').value,
            tica: document.getElementById('conf-tica').value,
            talla: document.getElementById('conf-talla').value,
            genero: document.getElementById('conf-genero').value
        };
        try {
            const { error } = await supabaseClient
                .from('agentes')
                .update({
                    direccion: payload.direccion,
                    direccion_num: payload.num,
                    comuna: payload.comuna,
                    telefono: payload.telefono,
                    tica: payload.tica,
                    talla_polera: payload.talla,
                    genero: payload.genero
                })
                .eq('id', CURRENT_AGENT_ID);

            if (error) throw error;

            alert("✅ DATOS ACTUALIZADOS EN LA NUBE (Supabase).");
            // Actualizar sesión local
            Object.assign(SESSION_USER, payload);
            localStorage.setItem('webPmr_user', JSON.stringify(SESSION_USER));
        } catch (e) { alert("❌ ERROR AL GUARDAR: " + e.message); }
        finally { btn.textContent = oldText; btn.disabled = false; }
    });
}

function loadProfileFields(data) {
    if (!data) return;
    if (document.getElementById('conf-direccion')) document.getElementById('conf-direccion').value = data.direccion || '';
    if (document.getElementById('conf-num')) document.getElementById('conf-num').value = data.direccion_num || '';
    if (document.getElementById('conf-comuna')) document.getElementById('conf-comuna').value = data.comuna || '';
    if (document.getElementById('conf-telefono')) document.getElementById('conf-telefono').value = data.telefono || '';
    if (document.getElementById('conf-tica')) document.getElementById('conf-tica').value = data.tica || '⛔Pendiente';
    if (document.getElementById('conf-talla')) document.getElementById('conf-talla').value = data.talla_polera || 'M';
    if (document.getElementById('conf-genero')) document.getElementById('conf-genero').value = data.genero || 'MASCULINO';
}

async function immediateTicaUpdate() {
    if (!supabaseClient) return;
    const ticaValue = document.getElementById('conf-tica').value;
    const payload = {
        direccion: document.getElementById('conf-direccion').value,
        direccion_num: document.getElementById('conf-num').value,
        comuna: document.getElementById('conf-comuna').value,
        telefono: document.getElementById('conf-telefono').value,
        tica: ticaValue,
        talla_polera: document.getElementById('conf-talla').value,
        genero: document.getElementById('conf-genero').value
    };

    try {
        await supabaseClient.from('agentes').update(payload).eq('id', CURRENT_AGENT_ID);
        console.log("TICA Updated Immmediately in Supabase:", ticaValue);
        if (window.navigator.vibrate) window.navigator.vibrate([20, 50, 20]);
    } catch (e) { console.error("Error in immediate update:", e); }
}

/**
 * 📅 GESTIÓN DE TURNOS AVANZADA
 */
function initShiftLogic() {
    const now = new Date();
    const month = now.getMonth() + 1, year = now.getFullYear();
    const savedShifts = localStorage.getItem(`agente_monthly_shifts_${month}_${year}`);
    if (savedShifts) monthlyShifts = JSON.parse(savedShifts);

    renderShiftPalette();
    renderMonthlyCalendar();
    renderMedicalLicenses();
}

function renderShiftPalette() {
    const container = document.getElementById('shift-palette-container');
    const types = ['L', 'M', 'T', 'N', 'S', 'V'];
    let html = `<div class="palette-item p-del ${selectedPaintTurn === 'DELETE' ? 'active' : ''}" onclick="selectPaletteShift('DELETE')" style="background:#ef4444 !important; border-color:#fff;">🧼 BORRAR</div>`;

    types.forEach(t => {
        const list = customTurns[t] || [t];
        list.forEach(code => {
            const isActive = selectedPaintTurn === code ? 'active' : '';
            html += `<div class="palette-item p-${t} ${isActive}" onclick="selectPaletteShift('${code}')">${code}</div>`;
        });
    });
    container.innerHTML = html;
}

function selectPaletteShift(code) { selectedPaintTurn = code; renderShiftPalette(); }

function renderMonthlyCalendar() {
    const container = document.getElementById('monthly-calendar-container');
    const now = new Date(), year = now.getFullYear(), month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    let html = `<div style="text-align:center; font-weight:900; margin:15px 0 10px; font-size:0.9rem;">${monthNames[month].toUpperCase()} ${year}</div>`;
    html += `<div class="calendar-grid">`;
    dayNames.forEach(d => html += `<div class="cal-day-header">${d}</div>`);
    for (let i = 0; i < firstDay; i++) html += `<div></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const fullShift = monthlyShifts[d] || '';
        const type = fullShift ? fullShift.charAt(0) : 'none';
        const isToday = d === now.getDate() && month === now.getMonth() ? 'today' : '';
        html += `<div class="cal-cell ${isToday} shift-${type}" onclick="paintDayShift(${d})">
                    <span class="cal-num">${d}</span>
                    <span class="cal-turn">${fullShift}</span>
                 </div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
}

function paintDayShift(day) {
    if (selectedPaintTurn === 'DELETE') {
        delete monthlyShifts[day];
    } else {
        monthlyShifts[day] = selectedPaintTurn;
    }
    renderMonthlyCalendar();
    if (window.navigator.vibrate) window.navigator.vibrate(10);
}

function saveMonthlyShifts() {
    const now = new Date();
    localStorage.setItem(`agente_monthly_shifts_${now.getMonth() + 1}_${now.getFullYear()}`, JSON.stringify(monthlyShifts));
    alert('📅 CALENDARIO GUARDADO LOCALMENTE.');
}

function exportToICal() {
    if (Object.keys(monthlyShifts).length === 0) { alert('Configura tus turnos primero.'); return; }
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//WebPMR//Shift Calendar//ES\n";
    const now = new Date(), year = now.getFullYear(), month = now.getMonth();
    const pad = (n) => n < 10 ? '0' + n : n;

    for (const day in monthlyShifts) {
        const code = monthlyShifts[day];
        if (code === 'L' || code === 'V' || code === 'S') continue;

        let startTimeStr = "08:00", endTimeStr = "16:00", typeLabel = "MAÑANA";

        if (code.match(/^[MTN]\d{4}$/)) {
            const h1 = code.substring(1, 3), h2 = code.substring(3, 5);
            startTimeStr = `${h1}:00`; endTimeStr = `${h2}:00`;
            const typeChar = code.charAt(0);
            typeLabel = typeChar === 'M' ? "MAÑANA" : (typeChar === 'T' ? "TARDE" : "NOCHE");
        }

        const title = `TURNO ${typeLabel} ${code}`;
        const sTime = `${year}${pad(month + 1)}${pad(day)}T${startTimeStr.replace(':', '')}00`;
        let eDate = new Date(year, month, parseInt(day));
        const [hStart] = startTimeStr.split(':').map(Number);
        const [hEnd] = endTimeStr.split(':').map(Number);
        if (hEnd < hStart) eDate.setDate(eDate.getDate() + 1);
        const eTime = `${eDate.getFullYear()}${pad(eDate.getMonth() + 1)}${pad(eDate.getDate())}T${endTimeStr.replace(':', '')}00`;

        ics += `BEGIN:VEVENT\nDTSTART:${sTime}\nDTEND:${eTime}\nSUMMARY:${title}\nDESCRIPTION:Generado por WebPMR\nEND:VEVENT\n`;
    }
    ics += "END:VCALENDAR";
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Turnos_PMR_${month + 1}.ics`;
    link.click();
}

/**
 * 🏥 LICENCIAS MÉDICAS
 */
function updateFileCounter() {
    const input = document.getElementById('lic-files');
    const files = input.files;
    document.getElementById('file-counter').textContent = `${files.length}/3`;
}

async function addMedicalLicense() {
    const start = document.getElementById('lic-start').value;
    const end = document.getElementById('lic-end').value;
    const desc = document.getElementById('lic-desc').value;
    const files = document.getElementById('lic-files').files;

    if (!start || !end) { alert('Selecciona fechas.'); return; }

    const attachments = [];
    const maxSizeBytes = 2 * 1024 * 1024; // 2MB

    for (let f of files) {
        if (f.size > maxSizeBytes) { alert(`El archivo ${f.name} supera los 2MB.`); return; }
        const b64 = await new Promise(r => { const reader = new FileReader(); reader.onload = () => r(reader.result); reader.readAsDataURL(f); });
        attachments.push({ name: f.name, data: b64, type: f.type });
    }

    const payload = {
        id_agente: CURRENT_AGENT_ID,
        fecha_inicio: start,
        fecha_fin: end,
        descripcion: desc,
        adjuntos: attachments
    };

    try {
        const { error } = await supabaseClient
            .from('licencias')
            .insert({
                id_agente: CURRENT_AGENT_ID,
                fecha_inicio: start,
                fecha_fin: end,
                descripcion: desc,
                adjuntos: attachments
            });

        if (error) throw error;

        alert('🚀 LICENCIA INFORMADA CORRECTAMENTE A SUPABASE.');
        document.getElementById('lic-start').value = '';
        document.getElementById('lic-end').value = '';
        document.getElementById('lic-desc').value = '';
        document.getElementById('lic-files').value = '';
        updateFileCounter();
    } catch (e) { alert('❌ ERROR AL INFORMAR: ' + e.message); }
}

function renderMedicalLicenses() {
    const container = document.getElementById('medical-licenses-list');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center; opacity:0.5; font-size:12px;">Últimas licencias informadas se verán en RRHH.</p>';
}

/**
 * 🎨 UI HELPERS
 */
function switchMobileView(viewId, element) {
    document.querySelectorAll('.nav-item').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.section-view').forEach(v => v.classList.remove('active'));
    element.classList.add('active');
    document.getElementById(`view-${viewId}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStats(totalTramos) {
    document.getElementById('stat-tramos-hoy').textContent = totalTramos;
    document.getElementById('stat-xp').textContent = `+${totalTramos * 25}`;
}

function calculateDuration(start, end) { const s = new Date(start), e = new Date(end); return Math.floor((e - s) / 1000 / 60); }

function toggleMobileTheme(forceLight = false) {
    const isLight = forceLight || document.body.classList.toggle('light-mode');
    const btn = document.querySelector('.top-btn');
    if (btn) btn.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('pmr_mobile_theme', isLight ? 'light' : 'dark');
}

function triggerNotification(task) {
    NOTI_SOUND.play().catch(() => { });
    if (Notification.permission === 'granted') new Notification("NUEVA TAREA PMR", { body: `Vuelo ${task.vuelo_num} - Pax: ${task.pax_name}`, icon: 'img/icon_pmr.png' });
}

function logoutAgent() { localStorage.removeItem('webPmr_user'); window.location.href = 'Login.html'; }

/**
 * ➕ MANUAL PMR LOGIC
 */
function setupManualPmr() {
    const form = document.getElementById('form-add-pmr-manual');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveManualPMR();
        });
    }
}

function openAddPmrModal() {
    const modal = document.getElementById('modal-pmr-manual');
    if (modal) {
        modal.style.display = 'flex';
        const now = new Date();
        document.getElementById('manual-hora').value = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    }
}

function closeAddPmrModal() {
    const modal = document.getElementById('modal-pmr-manual');
    if (modal) modal.style.display = 'none';
}

async function saveManualPMR() {
    if (!supabaseClient) return;

    const btn = document.querySelector('#form-add-pmr-manual button[type="submit"]');
    const oldText = btn ? btn.textContent : 'GUARDAR';
    if (btn) { btn.textContent = "⏳ GUARDANDO..."; btn.disabled = true; }

    const vueloNum = document.getElementById('manual-vuelo').value.toUpperCase();
    const paxName = document.getElementById('manual-pax').value.toUpperCase();
    const hora = document.getElementById('manual-hora').value;
    const ssr = document.getElementById('manual-ssr').value;
    const tomadoEn = document.getElementById('manual-tomado').value;

    const payload = {
        vuelo_num: vueloNum,
        pax_name: paxName,
        pax_id: 'MAN-' + Math.floor(1000 + Math.random() * 9000),
        ssr: ssr,
        agente_id: CURRENT_AGENT_ID,
        status: 'en curso',
        status_pax: 'Contactado',
        category: 'EMBARQUE', // Default para manual (Boarding)
        transfer_type: 'ESCRON', // Default (Full Service)
        tomado_en: tomadoEn,
        aceptado_at: new Date().toISOString(), // Ya está tomado
        obs: `Ingreso Manual Agente @ ${hora}`
    };

    try {
        const { error } = await supabaseClient.from('asistencias').insert(payload);
        if (error) throw error;

        alert(`✅ Pasajero ${paxName} guardado y asignado exitosamente.`);
        closeAddPmrModal();
        
        // Limpiar formulario
        document.getElementById('form-add-pmr-manual').reset();
        
        await checkTasks(); // Sincronizar UI
    } catch (e) {
        console.error("Error saving manual PMR:", e);
        alert("❌ Error de Supabase: " + e.message);
    } finally {
        if (btn) { btn.textContent = oldText; btn.disabled = false; }
    }
}

