/**
 * --------------------------------------------------------------------------------
 * CORE LOGIC MODULE (WEB PMR DASHBOARD)
 * --------------------------------------------------------------------------------
 */
const AIRLINE_LOGOS = {
    'LATAM': 'img/latam.jpg', 'DELTA': 'img/delta.jpg', 'AIRCANADA': 'img/aircanada.jpg',
    'AIRFRANCE': 'img/airfrance.jpg', 'AVIANCA': 'img/avianca.jpg', 'ARAJET': 'img/arajet.jpg',
    'BOLIVIANADEAVIACION': 'img/boa.jpg', 'BOA': 'img/boa.jpg', 'KLM': 'img/klm.jpg',
    'COPAAIRLINES': 'img/copa.jpg', 'COPA': 'img/copa.jpg', 'BRITISHAIRLINES': 'img/british.jpg',
    'BRITISHAIRWAYS': 'img/british.jpg', 'BRITISH': 'img/british.jpg', 'AEROLINEASARGENTINAS': 'img/argentinas.jpg',
    'IBERIA': 'img/iberia.jpg', 'LEVEL': 'img/level.jpg', 'QANTAS': 'img/qantas.jpg'
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

// 🚀 GUARDIA DE SEGURIDAD (SUPABASE)
if (!SESSION_USER && !window.location.href.includes('Login.html')) {
    window.location.href = 'Login.html';
}

function logoutUser() {
    localStorage.removeItem('webPmr_user');
    window.location.href = 'Login.html';
}

// 🚀 VARIABLES DE DATOS REALES (SUPABASE)
const REAL_SCL_MOCKS = []; // VACIADO TOTAL
let PASSENGERS_MOCK = [];  // VACIADO TOTAL
let TASKS_MOCK = [];       // VACIADO TOTAL

let activeAirlineFilter = 'ALL';
let activeDateFilter = new Date().toISOString().split('T')[0];
