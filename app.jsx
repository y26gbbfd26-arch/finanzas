const { useState, useEffect, useCallback } = React;


// ═══════════════════════════════════════════════════════
// CONSTANTES Y DATOS BASE
// ═══════════════════════════════════════════════════════

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// Metadatos de bancos: se rellenan dinámicamente desde datos.bancosConfig.
// Cada banco lo crea el usuario; el color y el icono se derivan automáticamente.
let BANCO_META = {};
const PALETA_BANCOS = ["--c2", "--accent", "--c4", "--c3", "--c1"];
function sincronizarBancoMeta(bancosConfig) {
  BANCO_META = {};
  Object.keys(bancosConfig || {}).forEach((id, i) => {
    const b = bancosConfig[id] || {};
    const nombre = b.nombre || id;
    BANCO_META[id] = {
      color: V(b.color || PALETA_BANCOS[i % PALETA_BANCOS.length]),
      label: nombre,
      icono: b.icono || nombre.charAt(0).toUpperCase(),
    };
  });
}

const TARIFA_KM = 0.20;

// ═══════════════════════════════════════════════════════
// TEMAS ESTÉTICOS
// ═══════════════════════════════════════════════════════
const TEMAS = {
  midnight: {
    nombre: "Bosque",
    "--bg": "#0A1410", "--bg-deep": "#050907",
    "--surface": "rgba(149,213,178,0.04)", "--surface-2": "rgba(149,213,178,0.08)",
    "--surface-elevated": "#102019", "--surface-soft": "#15281F",
    "--border": "rgba(149,213,178,0.10)",
    "--text": "#EAF3EC", "--text-mid": "#B7D4C0", "--text-dim": "#6E8B7A",
    "--accent": "#74C69D", "--accent-light": "#95D5B2", "--accent-pale": "#D8F3DC",
    "--header-glow": "rgba(116,198,157,0.08)",
    "--c1": "#2D6A4F", "--c2": "#52B788", "--c3": "#74C69D", "--c4": "#95D5B2",
    "--warn": "#E8A838", "--negative": "#E8765A",
  },
  ocean: {
    nombre: "Océano",
    "--bg": "#091622", "--bg-deep": "#040A10",
    "--surface": "rgba(72,202,228,0.04)", "--surface-2": "rgba(72,202,228,0.08)",
    "--surface-elevated": "#0E1F2D", "--surface-soft": "#11263340",
    "--border": "rgba(72,202,228,0.10)",
    "--text": "#E6F2FB", "--text-mid": "#AFD2E8", "--text-dim": "#6486A0",
    "--accent": "#48CAE4", "--accent-light": "#90E0EF", "--accent-pale": "#CAF0F8",
    "--header-glow": "rgba(72,202,228,0.08)",
    "--c1": "#2A6F97", "--c2": "#2A9FD0", "--c3": "#48CAE4", "--c4": "#90E0EF",
    "--warn": "#E8A838", "--negative": "#E8765A",
  },
  plum: {
    nombre: "Coral",
    "--bg": "#1A0E15", "--bg-deep": "#0E060A",
    "--surface": "rgba(231,111,81,0.05)", "--surface-2": "rgba(231,111,81,0.09)",
    "--surface-elevated": "#24131D", "--surface-soft": "#2E1826",
    "--border": "rgba(231,111,81,0.12)",
    "--text": "#F7EAE6", "--text-mid": "#E0BFB5", "--text-dim": "#9C7A72",
    "--accent": "#E8765A", "--accent-light": "#F4A582", "--accent-pale": "#F7C9B0",
    "--header-glow": "rgba(232,118,90,0.09)",
    "--c1": "#C85A45", "--c2": "#E8765A", "--c3": "#F4A582", "--c4": "#F7C9B0",
    "--warn": "#E0B23C", "--negative": "#D9534F",
  },
  paper: {
    nombre: "Marfil",
    "--bg": "#ECE7DC", "--bg-deep": "#E3DDCF",
    "--surface": "rgba(45,74,30,0.04)", "--surface-2": "rgba(45,74,30,0.07)",
    "--surface-elevated": "#F7F4EC", "--surface-soft": "#F0EBDF",
    "--border": "rgba(45,74,30,0.12)",
    "--text": "#1C1C1A", "--text-mid": "#4C4C40", "--text-dim": "#8A8775",
    "--accent": "#2D5E3F", "--accent-light": "#588157", "--accent-pale": "#6A994E",
    "--header-glow": "rgba(106,153,78,0.10)",
    "--c1": "#2D4A1E", "--c2": "#588157", "--c3": "#6A994E", "--c4": "#A7C957",
    "--warn": "#B8860B", "--negative": "#C0573E",
  },
};

function aplicarTema(claveTema) {
  const tema = TEMAS[claveTema] || TEMAS.midnight;
  const root = document.documentElement;
  Object.keys(tema).forEach(k => {
    if (k.startsWith("--")) root.style.setProperty(k, tema[k]);
  });
  // theme-color del navegador
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", tema["--bg"]);
}

const BASE_EMERGENCIA = 2500;

// Cuentas compartidas: tu participación siempre 50%
const PARTICIPACION_COMPARTIDA = 0.5;

// Teorías del ahorro: cada una define categorías con sus porcentajes objetivo
// Las categorías se mapean a las clasificaciones de gastos: necesidad, deseo, ahorro, deuda, educacion, libertad, dar
const TEORIAS_AHORRO = {
  "50_30_20": {
    nombre: "50 / 30 / 20",
    autor: "Elizabeth Warren",
    descripcion: "La clásica: 50% necesidades, 30% deseos, 20% ahorro.",
    categorias: [
      { id:"necesidad", label:"Necesidades", pct:50, color:V("--c2"), incluye:["necesidad"] },
      { id:"deseo",     label:"Deseos",      pct:30, color:V("--c4"), incluye:["deseo"] },
      { id:"ahorro",    label:"Ahorro",      pct:20, color:V("--accent"), incluye:["ahorro","deuda"] },
    ],
  },
  "70_20_10": {
    nombre: "70 / 20 / 10",
    autor: "Pragmática",
    descripcion: "70% gastos vitales, 20% ahorro, 10% deuda o donación.",
    categorias: [
      { id:"gastos",  label:"Gastos",  pct:70, color:V("--c2"), incluye:["necesidad","deseo"] },
      { id:"ahorro",  label:"Ahorro",  pct:20, color:V("--accent"), incluye:["ahorro"] },
      { id:"deuda",   label:"Deuda/Dar", pct:10, color:V("--c4"), incluye:["deuda","dar"] },
    ],
  },
  "jars": {
    nombre: "6 Botes (JARS)",
    autor: "T. Harv Eker",
    descripcion: "Divide cada euro en 6 cuentas con propósitos distintos.",
    categorias: [
      { id:"necesidad",  label:"Necesidades",       pct:55, color:V("--c2"), incluye:["necesidad"] },
      { id:"ocio",       label:"Ocio/Placer",       pct:10, color:V("--c4"), incluye:["deseo"] },
      { id:"ahorro",     label:"Ahorro l/p",        pct:10, color:V("--accent"), incluye:["ahorro"] },
      { id:"educacion",  label:"Educación",         pct:10, color:V("--c3"), incluye:["educacion"] },
      { id:"libertad",   label:"Libertad financiera", pct:10, color:V("--c3"), incluye:["libertad"] },
      { id:"dar",        label:"Dar / Donar",       pct:5,  color:V("--text-dim"), incluye:["dar"] },
    ],
  },
  "80_20": {
    nombre: "80 / 20",
    autor: "Pareto / Ramit Sethi",
    descripcion: "El máximo: 80% para vivir, 20% para ahorrar e invertir.",
    categorias: [
      { id:"gastos",  label:"Gastos",  pct:80, color:V("--c2"), incluye:["necesidad","deseo","deuda"] },
      { id:"ahorro",  label:"Ahorro",  pct:20, color:V("--accent"), incluye:["ahorro"] },
    ],
  },
};

// Clasificación por defecto según el tipo de gasto (catalogo de origen)
const CLASIF_DEFAULT_POR_TIPO = {
  fijos: "necesidad",
  variables: "deseo",
  ahorro: "ahorro",
  puntuales: "deseo",
};

const PROPOSITOS = {
  operativa:  { label: "Operativa",       icono: "deuda" },
  emergencia: { label: "Emergencia",      icono: "salvavidas" },
  anuales:    { label: "Gastos anuales",  icono: "calendario" },
  ahorro:     { label: "Ahorro/Objetivo", icono: "objetivo" },
  inversion:  { label: "Inversión",       icono: "inversiones" },
  otros:      { label: "Otros",           icono: "carpeta" },
};

const TIPOS_ACTIVO = {
  fondo:   { label:"Fondo",       color:V("--c4"), icono:"fondo" },
  etf:     { label:"ETF",         color:V("--c2"), icono:"etf" },
  accion:  { label:"Acción",      color:V("--accent"), icono:"accion" },
  cripto:  { label:"Cripto",      color:V("--c3"), icono:"cripto" },
  bono:    { label:"Bono",        color:V("--c3"), icono:"bono" },
  pension: { label:"Plan/Pensión", color:V("--text-dim"), icono:"pension", soloValor:true },
};

// ─────────────────────────────────────────────────────
// Datos iniciales (solo se cargan si no hay storage)
// ─────────────────────────────────────────────────────

const GASTOS_FIJOS_DEFAULT = [];

const GASTOS_VARIABLES_DEFAULT = [];

const GASTOS_AHORRO_DEFAULT = [];

const ANUALES_DEFAULT = {};

const CUENTAS_DEFAULT = [];

// ═══════════════════════════════════════════════════════
// STORAGE Y ESTADO
// ═══════════════════════════════════════════════════════

const STORAGE_KEY = "finanzas-v9";
const TEMA_KEY = "finanzas-tema";

function añoActual() { return new Date().getFullYear(); }

// Configuración por defecto de cada banco: modo "suma" (total = suma cuentas)
// o "reserva" (total manual, libre = total - asignaciones)
const BANCOS_CONFIG_DEFAULT = {};

// Ingresos base por defecto (todos editables, eliminables, ampliables)
const INGRESOS_BASE_DEFAULT = [{ id:"nomina", nombre:"Nómina", importe:0 }];

function datosVacios() {
  return {
    // ─── Estado actual (no por mes) ───
    catalogoFijos:     GASTOS_FIJOS_DEFAULT.map(g => ({...g})),
    catalogoVariables: GASTOS_VARIABLES_DEFAULT.map(g => ({...g})),
    catalogoAhorro:    GASTOS_AHORRO_DEFAULT.map(g => ({...g})),
    cuentas:           CUENTAS_DEFAULT.map(c => ({...c})),
    bancosConfig:      JSON.parse(JSON.stringify(BANCOS_CONFIG_DEFAULT)),
    ingresosBase:      INGRESOS_BASE_DEFAULT.map(i => ({...i})),  // ahora es array
    reservaImpCuenta:  null,
    porcentajeExtra:   42.86,  // % de la nómina extra que se destina a anuales (default 3/7)
    inversiones:       [],
    objetivos:         [],  // [{id, nombre, importe, fechaLimite:"YYYY-MM", cuentaId, ahorradoManual, creadoEn}]
    inmuebles:         [],  // [{id, nombre, valorBase, mesBase:"YYYY-MM", revalAnual}] (valor derivado por mes)
    deudas:            [],  // [{id,nombre,capitalInicial,saldoActual,tin,tipoInteres,plazoAnios,mesBase}] amortización francesa
    autoReservaAnual:  false,  // inyecta gasto de ahorro = prorrateo anual redondeado a 50€
    autoReservaBanco:  null,   // banco al que va ese gasto automático (null = primero disponible)
    autoObjetivos:     false,  // inyecta gasto de ahorro = suma cuotas de objetivos redondeada a 50€
    autoObjetivosBanco:null,   // banco al que va el gasto automático de objetivos

    // ─── Por año: gastos anuales del año en curso ───
    anuales: {
      año: añoActual(),
      catalogo: JSON.parse(JSON.stringify(ANUALES_DEFAULT)),
    },

    // ─── Por mes ───
    meses: {},  // { "2026-04": { km, ingresosMes, puntuales, pagos... } }
  };
}

function estadoMesVacio() {
  return {
    km: 0,
    ingresosMes: [],       // [{id, nombre, importe}] ingresos SOLO de este mes (no se heredan)
    puntuales: [],
    pagosFijos: {},
    pagosVariables: {},
    pagosAhorro: {},
  };
}

async function cargarDatos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return datosVacios();
    const cargado = JSON.parse(raw);
    const base = datosVacios();
    if (!cargado.catalogoFijos || !cargado.anuales || !cargado.bancosConfig || !Array.isArray(cargado.ingresosBase)) return base;
    const datos = { ...base, ...cargado, meses: cargado.meses || {} };
    // Migración: dar nombre/color/icono a bancos antiguos que no lo tengan
    const NOMBRES_LEGACY = { BBVA:"BBVA", TRADE:"Trade Republic", BANK:"Bankinter", MYINV:"MyInvestor" };
    Object.keys(datos.bancosConfig || {}).forEach((id, i) => {
      const b = datos.bancosConfig[id];
      if (!b.nombre) b.nombre = NOMBRES_LEGACY[id] || id;
      if (!b.color) b.color = PALETA_BANCOS[i % PALETA_BANCOS.length];
    });
    return datos;
  } catch { return datosVacios(); }
}

async function guardarDatos(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.error("Error guardando:", e); }
}

// ─── Exportar / Importar JSON para backup ───
function descargarBackup() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return alert("No hay datos para exportar todavía");
  const fecha = new Date().toISOString().split("T")[0];
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `finanzas-backup-${fecha}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importarBackup(file, onDone) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const datos = JSON.parse(e.target.result);
      if (!datos.catalogoFijos) throw new Error("Archivo no válido");
      if (!confirm("Esto sobrescribirá tus datos actuales. ¿Continuar?")) return;
      localStorage.setItem(STORAGE_KEY, e.target.result);
      onDone();
    } catch (err) {
      alert("Error leyendo el archivo: " + err.message);
    }
  };
  reader.readAsText(file);
}

function claveMes(m, y) { return `${y}-${String(m+1).padStart(2,"0")}`; }

// Clave del mes anterior a una clave "YYYY-MM"
function claveMesAnterior(claveM) {
  let [y, m] = claveM.split("-").map(Number);  // m: 1..12
  m -= 1;
  if (m < 1) { m = 12; y -= 1; }
  return `${y}-${String(m).padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════════════
// CIERRE / REAPERTURA DE MES
// ═══════════════════════════════════════════════════════

// Un mes está "cerrado/congelado" si tiene snapshot guardado.
// Esto puede ser por cierre manual del usuario (con candado) o por auto-congelación
// al editar un mes posterior.
function mesEstaCerrado(datos, claveM) {
  const mes = datos.meses[claveM];
  return !!(mes && mes.snapshot);
}

// Cierre manual: el usuario indica explícitamente que este mes queda cerrado.
// Solo afecta a la UI (sólo lectura), no a la propagación.
function mesCerradoManual(datos, claveM) {
  const mes = datos.meses[claveM];
  return !!(mes && mes.cerrado);
}

// Crear snapshot del estado actual del mes: congela todos los catálogos,
// ingresos base, bancos, cuentas, anuales (y sus pagados), inversiones.
function crearSnapshotMes(datos) {
  return {
    catalogoFijos:     JSON.parse(JSON.stringify(datos.catalogoFijos)),
    catalogoVariables: JSON.parse(JSON.stringify(datos.catalogoVariables)),
    catalogoAhorro:    JSON.parse(JSON.stringify(datos.catalogoAhorro)),
    cuentas:           JSON.parse(JSON.stringify(datos.cuentas)),
    bancosConfig:      JSON.parse(JSON.stringify(datos.bancosConfig)),
    ingresosBase:      JSON.parse(JSON.stringify(datos.ingresosBase)),
    reservaImpCuenta:  datos.reservaImpCuenta,
    porcentajeExtra:   datos.porcentajeExtra,
    anuales:           JSON.parse(JSON.stringify(datos.anuales)),
    inversiones:       JSON.parse(JSON.stringify(datos.inversiones || [])),
    objetivos:         JSON.parse(JSON.stringify(datos.objetivos || [])),
    inmuebles:         JSON.parse(JSON.stringify(datos.inmuebles || [])),
    deudas:            JSON.parse(JSON.stringify(datos.deudas || [])),
  };
}

// Devuelve los datos efectivos de un mes: si el mes tiene snapshot, mezcla los catálogos
// del snapshot con los datos del mes en sí (km, pagados, puntuales). Si no, devuelve datos tal cual.
function datosEfectivosMes(datos, claveM) {
  const mes = datos.meses[claveM];
  if (!mes || !mes.snapshot) return datos;
  return {
    ...datos,
    catalogoFijos:     mes.snapshot.catalogoFijos,
    catalogoVariables: mes.snapshot.catalogoVariables,
    catalogoAhorro:    mes.snapshot.catalogoAhorro,
    cuentas:           mes.snapshot.cuentas,
    bancosConfig:      mes.snapshot.bancosConfig,
    ingresosBase:      mes.snapshot.ingresosBase,
    reservaImpCuenta:  mes.snapshot.reservaImpCuenta,
    porcentajeExtra:   mes.snapshot.porcentajeExtra,
    anuales:           mes.snapshot.anuales,
    inversiones:       mes.snapshot.inversiones,
    objetivos:         mes.snapshot.objetivos || datos.objetivos || [],
    inmuebles:         mes.snapshot.inmuebles || datos.inmuebles || [],
    deudas:            mes.snapshot.deudas || datos.deudas || [],
  };
}

// AUTO-CONGELACIÓN: antes de aplicar un cambio en un mes, congela todos los meses
// ANTERIORES que aún no estén congelados, para que el cambio no les afecte retroactivamente.
// Las claves de mes tienen formato "YYYY-MM" que ordena alfabéticamente igual que cronológicamente.
function congelarMesesAnteriores(d, claveActual) {
  // Recorremos todas las claves de meses ya creadas
  Object.keys(d.meses).forEach(k => {
    if (k < claveActual && !d.meses[k].snapshot) {
      d.meses[k].snapshot = crearSnapshotMes(d);
    }
  });
}

// ═══════════════════════════════════════════════════════
// CÁLCULOS
// ═══════════════════════════════════════════════════════

function getMes(datos, claveM) {
  return datos.meses[claveM] || estadoMesVacio();
}

// Lista de gastos efectivos de un mes. Si el mes está cerrado, usa el snapshot.
function gastosFijosDeMes(datos, claveM) {
  const d = datosEfectivosMes(datos, claveM);
  const mes = getMes(datos, claveM);
  return d.catalogoFijos
    .filter(g => g.importe > 0)
    .map(g => ({ ...g, pagado: (mes.pagosFijos && mes.pagosFijos[g.id]) || false }));
}
function gastosVariablesDeMes(datos, claveM) {
  const d = datosEfectivosMes(datos, claveM);
  const mes = getMes(datos, claveM);
  return d.catalogoVariables
    .filter(g => g.importe > 0)
    .map(g => ({ ...g, pagado: (mes.pagosVariables && mes.pagosVariables[g.id]) || false }));
}
function gastosAhorroDeMes(datos, claveM) {
  const d = datosEfectivosMes(datos, claveM);
  const mes = getMes(datos, claveM);
  const manuales = d.catalogoAhorro
    .filter(g => g.importe > 0)
    .map(g => ({ ...g, pagado: (mes.pagosAhorro && mes.pagosAhorro[g.id]) || false }));
  // Inyectar gastos de ahorro automáticos (reserva anual, objetivos) si están activos
  const mesNum = Number(claveM.split("-")[1]) - 1;  // "YYYY-MM" → 0..11
  const autos = gastosAhorroAutomaticos(datos, claveM, mesNum).map(g => ({
    ...g, pagado: (mes.pagosAhorro && mes.pagosAhorro[g.id]) || false,
  }));
  return [...manuales, ...autos];
}

function gastosPuntualesDeMes(datos, claveM) {
  return getMes(datos, claveM).puntuales || [];
}

// Totales del mes
function calcularGastoMensualTotal(datos, claveM) {
  const fijos = gastosFijosDeMes(datos, claveM).reduce((a,g) => a + g.importe, 0);
  const vars_ = gastosVariablesDeMes(datos, claveM).reduce((a,g) => a + g.importe, 0);
  const ahorro = gastosAhorroDeMes(datos, claveM).reduce((a,g) => a + g.importe, 0);
  const punt = gastosPuntualesDeMes(datos, claveM).reduce((a,g) => a + g.importe, 0);
  return { fijos, vars: vars_, ahorro, puntuales: punt, total: fijos + vars_ + ahorro + punt };
}

function calcularPagadoMes(datos, claveM) {
  const f = gastosFijosDeMes(datos, claveM).filter(g => g.pagado).reduce((a,g) => a + g.importe, 0);
  const v = gastosVariablesDeMes(datos, claveM).filter(g => g.pagado).reduce((a,g) => a + g.importe, 0);
  const a = gastosAhorroDeMes(datos, claveM).filter(g => g.pagado).reduce((a,g) => a + g.importe, 0);
  const p = gastosPuntualesDeMes(datos, claveM).filter(g => g.pagado).reduce((a,g) => a + g.importe, 0);
  return f + v + a + p;
}

function calcularIngresoKm(datos, claveM) {
  return (getMes(datos, claveM).km || 0) * TARIFA_KM;
}

function calcularIngresosMes(datos, claveM) {
  const d = datosEfectivosMes(datos, claveM);
  const mes = getMes(datos, claveM);
  // Suma de todas las fuentes fijas (ingresosBase es ahora un array)
  const totalBase = (d.ingresosBase || []).reduce((a, fuente) => a + (fuente.importe || 0), 0);
  // Suma de ingresos SOLO de este mes (no heredables)
  const im = mes.ingresosMes || [];
  const totalMes = Array.isArray(im)
    ? im.reduce((a, f) => a + (f.importe || 0), 0)
    : Object.values(im).reduce((a, v) => a + (v || 0), 0);  // compat legacy
  return totalBase + totalMes + calcularIngresoKm(datos, claveM);
}

// Gastos anuales: total, pagado acumulado en TODOS los meses del año actual, pendiente
function totalCategoriaAnual(catData) {
  return catData.conceptos.reduce((a,c) => a + (c.importe || 0), 0);
}

function pagadoCategoriaAnual(datos, categoria) {
  // Suma el "pagado parcial" de cada concepto (independientemente de si está cerrado)
  const cat = datos.anuales.catalogo[categoria];
  if (!cat) return 0;
  return cat.conceptos.reduce((total, concepto) => {
    return total + (concepto.pagado || 0);
  }, 0);
}

function pendienteCategoriaAnual(datos, categoria) {
  const cat = datos.anuales.catalogo[categoria];
  if (!cat) return 0;
  return Math.max(0, totalCategoriaAnual(cat) - pagadoCategoriaAnual(datos, categoria));
}

function totalAnualesPendiente(datos) {
  return Object.keys(datos.anuales.catalogo)
    .reduce((a,cat) => a + pendienteCategoriaAnual(datos, cat), 0);
}

function totalAnualesYear(datos) {
  return Object.values(datos.anuales.catalogo)
    .reduce((a,cat) => a + totalCategoriaAnual(cat), 0);
}

function totalAnualesPagado(datos) {
  return Object.keys(datos.anuales.catalogo)
    .reduce((a,cat) => a + pagadoCategoriaAnual(datos, cat), 0);
}

// Reserva efectiva de impuestos = saldo de la cuenta vinculada (o 0 si no hay)
function calcularReservaEfectiva(datos) {
  if (!datos.reservaImpCuenta) return 0;
  const cuenta = datos.cuentas.find(c => c.id === datos.reservaImpCuenta);
  return cuenta ? (cuenta.asignado || 0) : 0;
}

// Fórmula del Excel para la aportación mensual a gastos anuales
function calcularAportacionAnual(datos, mesNum, claveM) {
  // Si el mes está cerrado, usamos su snapshot (anuales, ingresos, reserva todos congelados)
  const d = claveM ? datosEfectivosMes(datos, claveM) : datos;
  const pendiente = totalAnualesPendiente(d);
  const reserva = calcularReservaEfectiva(d);
  // El número en pantalla del mes M es lo que se aportará en M+1.
  // La última aportación es la de noviembre (para tener todo a primeros de diciembre).
  // Aportaciones que quedan estando en el mes M: M+1, M+2, …, noviembre = (10 - mesNum).
  // (mesNum: 0=enero … 11=diciembre; noviembre=10)
  const aportacionesRestantes = 10 - mesNum;
  const nominaRef = (d.ingresosBase && d.ingresosBase[0]) ? (d.ingresosBase[0].importe || 0) : 0;
  const pct = (d.porcentajeExtra || 0) / 100;
  const extrasFactor = nominaRef * pct;
  const aReparto = pendiente - reserva - extrasFactor;
  // De noviembre en adelante ya no hay meses para repartir: devolvemos el pendiente completo
  if (aportacionesRestantes <= 0) return Math.max(0, aReparto);
  return aReparto / aportacionesRestantes;
}

// Bancos
// Total del banco según su modo. Cuentas compartidas NO suman al total del banco.
function totalBanco(bancosConfig, cuentas, banco) {
  const cfg = bancosConfig[banco] || { modo: "suma", total: 0 };
  if (cfg.modo === "reserva") return cfg.total || 0;
  // modo suma: total = sumatorio de asignaciones de las cuentas PROPIAS (no compartidas)
  return cuentas.filter(c => c.banco === banco && !c.compartida)
    .reduce((a,c) => a + (c.asignado || 0), 0);
}

// Libre del banco. Las compartidas tampoco cuentan aquí (van por separado).
function libreBanco(bancosConfig, cuentas, banco) {
  const cfg = bancosConfig[banco] || { modo: "suma", total: 0 };
  if (cfg.modo === "suma") return 0;
  const asignado = cuentas.filter(c => c.banco === banco && !c.compartida)
    .reduce((a,c) => a + (c.asignado || 0), 0);
  return (cfg.total || 0) - asignado;
}

// Aportación tuya en cuentas compartidas (50% de cada saldo)
function patrimonioCompartido(cuentas) {
  return cuentas
    .filter(c => c.compartida)
    .reduce((a, c) => a + ((c.asignado || 0) * PARTICIPACION_COMPARTIDA), 0);
}

// Saldo total compartido (100%, para mostrar el dinero en juego)
function saldoCompartidoTotal(cuentas) {
  return cuentas
    .filter(c => c.compartida)
    .reduce((a, c) => a + (c.asignado || 0), 0);
}

// Devuelve la clasificación (necesidad/deseo/ahorro/etc) de un gasto.
// Si el gasto tiene `clasificacion` explícita la usa; si no, usa el default según el tipo.
function clasificacionGasto(gasto, tipoOrigen) {
  if (gasto && gasto.clasificacion) return gasto.clasificacion;
  return CLASIF_DEFAULT_POR_TIPO[tipoOrigen] || "deseo";
}

// ═══════════════════════════════════════════════════════
// OBJETIVOS DE AHORRO
// ═══════════════════════════════════════════════════════

// Meses entre dos claves "YYYY-MM" (b - a). Puede ser negativo si b < a.
function mesesEntre(claveA, claveB) {
  const [ya, ma] = claveA.split("-").map(Number);
  const [yb, mb] = claveB.split("-").map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

// Evalúa el estado de un objetivo en el mes claveM.
// ahorrado: saldo de la cuenta vinculada o el campo manual.
function evaluarObjetivo(objetivo, cuentas, claveM) {
  const cuenta = objetivo.cuentaId ? cuentas.find(c => c.id === objetivo.cuentaId) : null;
  const bruto = cuenta ? (cuenta.asignado || 0) : (objetivo.ahorradoManual || 0);
  // Si la cuenta es compartida, cuenta solo tu 50%
  const ahorrado = (cuenta && cuenta.compartida) ? bruto * PARTICIPACION_COMPARTIDA : bruto;

  const importe = objetivo.importe || 0;
  const restante = Math.max(0, importe - ahorrado);
  const pctAhorrado = importe > 0 ? Math.min(100, (ahorrado / importe) * 100) : 0;

  const mesesRestantes = mesesEntre(claveM, objetivo.fechaLimite);
  const completado = ahorrado >= importe && importe > 0;
  const vencido = !completado && mesesRestantes < 0;

  // Cuota mensual necesaria desde ahora hasta el límite
  const cuotaMensual = (completado || vencido) ? 0 : restante / Math.max(1, mesesRestantes);

  // Ritmo: comparar % tiempo transcurrido vs % ahorrado (si hay creadoEn)
  let ritmo = null;  // "adelantado" | "alDia" | "atrasado"
  if (!completado && !vencido && objetivo.creadoEn) {
    const mesesTotales = Math.max(1, mesesEntre(objetivo.creadoEn, objetivo.fechaLimite));
    const transcurridos = Math.max(0, mesesEntre(objetivo.creadoEn, claveM));
    const pctTiempo = (transcurridos / mesesTotales) * 100;
    if (pctAhorrado >= pctTiempo + 5) ritmo = "adelantado";
    else if (pctAhorrado >= pctTiempo - 5) ritmo = "alDia";
    else ritmo = "atrasado";
  }

  return { cuenta, ahorrado, restante, pctAhorrado, mesesRestantes, completado, vencido, cuotaMensual, ritmo };
}

// ═══════════════════════════════════════════════════════
// PATRIMONIO: INMUEBLES, DEUDAS Y AUTOMATISMOS
// ═══════════════════════════════════════════════════════

// Redondeo hacia arriba al múltiplo de 50 más cercano
function redondear50(x) {
  return Math.ceil((x || 0) / 50) * 50;
}

// Valor de un inmueble en un mes dado, aplicando revalorización lineal anual
// desde su mes base. valor(M) = valorBase × (1 + revalAnual%/100 × meses/12)
function valorInmuebleEnMes(inm, claveM) {
  const base = inm.valorBase || 0;
  if (!inm.revalAnual || !inm.mesBase) return base;
  const meses = Math.max(0, mesesEntre(inm.mesBase, claveM));
  return base * (1 + (inm.revalAnual / 100) * (meses / 12));
}

// Analiza una deuda tipo préstamo francés y devuelve cuota, tiempo pagado y restante.
// Datos: capitalInicial (C0), saldoActual (S), tin (% anual), plazoAnios (N años), mesBase.
function analizarDeuda(deuda) {
  const C0 = deuda.capitalInicial || 0;
  const S = deuda.saldoActual || 0;
  const N = Math.round((deuda.plazoAnios || 0) * 12);   // cuotas totales
  const i = (deuda.tin || 0) / 100 / 12;                // interés mensual

  // Cuota (sistema francés) calculada con los datos ORIGINALES del préstamo
  let cuota = 0;
  if (N > 0) {
    cuota = (i > 0)
      ? C0 * i / (1 - Math.pow(1 + i, -N))
      : C0 / N;
  }

  // Cuotas que quedan, derivadas del saldo actual con esa cuota
  let cuotasRestantes = 0;
  if (cuota > 0) {
    if (i > 0) {
      const arg = 1 - (S * i) / cuota;
      // arg<=0 significaría que la cuota no cubre intereses (datos incoherentes): cap a N
      cuotasRestantes = arg > 0 ? (-Math.log(arg) / Math.log(1 + i)) : N;
    } else {
      cuotasRestantes = S / cuota;
    }
  }
  cuotasRestantes = Math.max(0, Math.min(N, cuotasRestantes));
  const cuotasPagadas = Math.max(0, N - cuotasRestantes);

  const aMesesAnios = (m) => ({ anios: Math.floor(m / 12), meses: Math.round(m % 12) });

  return {
    cuota,
    N,
    cuotasRestantes: Math.round(cuotasRestantes),
    cuotasPagadas: Math.round(cuotasPagadas),
    pagado: aMesesAnios(cuotasPagadas),
    restante: aMesesAnios(cuotasRestantes),
    pctPagado: C0 > 0 ? Math.min(100, ((C0 - S) / C0) * 100) : 0,
  };
}

// Saldo de una deuda en un mes dado, amortizando desde saldoActual con la cuota francesa.
// saldo(t) = S·(1+i)^t − cuota·((1+i)^t − 1)/i, acotado a [0, ...]. t = meses desde mesBase.
function saldoDeudaEnMes(deuda, claveM) {
  // Compatibilidad con el modelo antiguo (saldoBase + cuotaMensual)
  if (deuda.saldoActual === undefined && deuda.saldoBase !== undefined) {
    const base = deuda.saldoBase || 0;
    if (!deuda.cuotaMensual || !deuda.mesBase) return base;
    const m = Math.max(0, mesesEntre(deuda.mesBase, claveM));
    return Math.max(0, base - (deuda.cuotaMensual * m));
  }
  const S = deuda.saldoActual || 0;
  if (!deuda.mesBase) return S;
  const t = Math.max(0, mesesEntre(deuda.mesBase, claveM));
  if (t === 0) return S;
  const i = (deuda.tin || 0) / 100 / 12;
  const { cuota } = analizarDeuda(deuda);
  if (cuota <= 0) return S;
  let saldo;
  if (i > 0) {
    const f = Math.pow(1 + i, t);
    saldo = S * f - cuota * ((f - 1) / i);
  } else {
    saldo = S - cuota * t;
  }
  return Math.max(0, saldo);
}

// Totales de inmuebles y deudas en un mes
function totalInmuebles(datos, claveM) {
  return (datos.inmuebles || []).reduce((a, i) => a + valorInmuebleEnMes(i, claveM), 0);
}
function totalDeudas(datos, claveM) {
  return (datos.deudas || []).reduce((a, d) => a + saldoDeudaEnMes(d, claveM), 0);
}

// Suma de cuotas mensuales de objetivos activos (no completados ni vencidos)
function totalCuotaObjetivos(datos, claveM) {
  return (datos.objetivos || []).reduce((a, o) => {
    const ev = evaluarObjetivo(o, datos.cuentas, claveM);
    return a + (ev.completado || ev.vencido ? 0 : ev.cuotaMensual);
  }, 0);
}

// Gastos de ahorro "automáticos" que se inyectan según los flags activos.
// No se almacenan: se calculan al vuelo para el mes que se mira (no divergen, respetan el pasado).
function gastosAhorroAutomaticos(datos, claveM, mesNum) {
  const autos = [];
  const bancoPorDefecto = Object.keys(BANCO_META)[0];  // primer banco disponible
  if (datos.autoReservaAnual) {
    // La aportación que ENTRA en este mes M se calculó estando en el mes ANTERIOR (M-1),
    // porque el prorrateo de un mes es "lo que se aporta el mes siguiente".
    const claveAnt = claveMesAnterior(claveM);
    const mesNumAnt = (mesNum - 1 + 12) % 12;
    const aportacionesRestantesAnt = 10 - mesNumAnt;
    // Solo hay aportación si el mes anterior tenía margen (no en enero ni diciembre)
    if (aportacionesRestantesAnt > 0) {
      const imp = redondear50(Math.max(0, calcularAportacionAnual(datos, mesNumAnt, claveAnt)));
      if (imp > 0) autos.push({
        id: "auto-reserva-anual", nombre: "Reserva gastos anuales", importe: imp,
        banco: datos.autoReservaBanco || bancoPorDefecto,
        auto: true, clasificacion: "ahorro",
      });
    }
  }
  if (datos.autoObjetivos) {
    const imp = redondear50(totalCuotaObjetivos(datos, claveM));
    if (imp > 0) autos.push({
      id: "auto-objetivos", nombre: "Aportación a objetivos", importe: imp,
      banco: datos.autoObjetivosBanco || bancoPorDefecto,
      auto: true, clasificacion: "ahorro",
    });
  }
  return autos;
}

// Inversiones
function calcularPosicion(inv) {
  const tipo = TIPOS_ACTIVO[inv.tipo] || TIPOS_ACTIVO.fondo;
  const valorActual = inv.valorActual || 0;
  // Planes de pensiones: no calculamos plusvalía (no se conoce el coste base)
  if (tipo.soloValor) {
    return { invertido: valorActual, valorActual, plusvalia: 0, pctPlusvalia: 0, soloValor: true };
  }
  const invertido = inv.invertido || 0;
  const plusvalia = valorActual - invertido;
  const pctPlusvalia = invertido > 0 ? (plusvalia / invertido) * 100 : 0;
  return { invertido, valorActual, plusvalia, pctPlusvalia, soloValor: false };
}

function calcularTotalCartera(inversiones) {
  return inversiones.reduce((acc, inv) => {
    const { invertido, valorActual, plusvalia } = calcularPosicion(inv);
    acc.invertido   += invertido;
    acc.valorActual += valorActual;
    acc.plusvalia   += plusvalia;
    return acc;
  }, { invertido: 0, valorActual: 0, plusvalia: 0 });
}

// ═══════════════════════════════════════════════════════
// COMPONENTES UI BASE
// ═══════════════════════════════════════════════════════

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
  body { background:var(--bg); transition: background 0.3s; }
  ::-webkit-scrollbar { width:3px; }
  ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:2px; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; }
  input { -webkit-appearance:none; }
  .slide-in { animation: slideIn 0.25s ease forwards; }
  @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .pulse { animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
`;

// Helper para leer variables CSS de tema en estilos inline
function V(nombre) { return `var(${nombre})`; }

// Mezcla un color (var o hex) con transparencia. alpha en hex de 2 chars ("20") o número 0-255.
function mix(color, alpha) {
  let pct;
  if (typeof alpha === "string") pct = (parseInt(alpha, 16) / 255) * 100;
  else if (alpha <= 1) pct = alpha * 100;        // 0.08 → 8%
  else pct = (alpha / 255) * 100;                // 20 → ~8%
  pct = Math.max(0, Math.min(100, Math.round(pct)));
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

// Fuente serif elegante para logo y cifras destacadas
const SERIF = "'DM Serif Display', Georgia, serif";
const UI = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

// Logo de barras ascendentes (icono de la marca). Color por degradado hacia el acento.
// ── Set de iconografía de línea (estilo moodboard: stroke fino, redondeado) ──
const ICONOS = {
  // Navegación principal
  ingresos:    <><path d="M12 4v10"/><path d="M8 11l4 4 4-4"/><path d="M5 20h14"/></>,
  gastos:      <><path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4V3z"/><path d="M9 8h6"/><path d="M9 12h6"/></>,
  cartera:     <><path d="M3 9l9-5 9 5"/><path d="M5 9v9"/><path d="M9 9v9"/><path d="M15 9v9"/><path d="M19 9v9"/><path d="M3 18h18"/></>,
  analisis:    <><path d="M4 4v16h16"/><path d="M7 14l3-4 3 2 4-6"/></>,
  // Secciones / categorías
  banco:       <><path d="M3 9l9-5 9 5"/><path d="M5 9v9"/><path d="M9 9v9"/><path d="M15 9v9"/><path d="M19 9v9"/><path d="M3 18h18"/></>,
  inversiones: <><path d="M3 17l6-6 4 4 7-8"/><path d="M16 7h5v5"/></>,
  patrimonio:  <><path d="M6 3h12l3 5-9 13L3 8z"/><path d="M3 8h18"/><path d="M9 3l3 18 3-18"/></>,
  inmueble:    <><path d="M4 11l8-6 8 6"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/></>,
  deuda:       <><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/></>,
  objetivo:    <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></>,
  ahorro:      <><circle cx="12" cy="12" r="8"/><path d="M14.5 9.5a3 3 0 1 0 0 5"/><path d="M8 11h4"/><path d="M8 13.2h4"/></>,
  resumen:     <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/></>,
  teorias:     <><circle cx="12" cy="12" r="8"/><path d="M12 4v8h8"/></>,
  anuales:     <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4"/><path d="M16 3v4"/></>,
  calendario:  <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4"/><path d="M16 3v4"/></>,
  // Estados / acciones
  auto:        <><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></>,
  formula:     <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><path d="M8.5 11h0M12 11h0M15.5 11h0M8.5 14.5h0M12 14.5h0M15.5 14.5h0"/></>,
  alerta:      <><path d="M12 3l9 16H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/></>,
  check:       <><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></>,
  celebra:     <><path d="M12 3l2.4 5.6 6 .5-4.6 4 1.4 5.9L12 16l-5.2 3 1.4-5.9-4.6-4 6-.5z"/></>,
  candado:     <><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
  candadoAbierto: <><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-1.8"/></>,
  lapiz:       <><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></>,
  bombilla:    <><path d="M9.5 18h5"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.4 1 2.5h6c0-1.1.3-1.8 1-2.5A6 6 0 0 0 12 3z"/></>,
  link:        <><path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5"/><path d="M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.5-1.5"/></>,
  escudo:      <><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/></>,
  movil:       <><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></>,
  carpeta:     <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>,
  exportar:    <><path d="M5 21h14"/><path d="M5 3h9l5 5v8H5z"/><path d="M14 3v5h5"/><path d="M12 16v-6"/><path d="M9.5 12.5l2.5 2.5 2.5-2.5"/></>,
  importar:    <><path d="M5 20h14"/><path d="M12 16V4"/><path d="M7.5 9.5L12 5l4.5 4.5"/></>,
  paleta:      <><path d="M12 3a9 9 0 1 0 0 18c1 0 1.6-.9 1.6-2s-.6-2 .4-2H17a4 4 0 0 0 4-4c0-5-4-7-9-7z"/><circle cx="7.5" cy="11" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="11" r="1" fill="currentColor"/></>,
  refresh:     <><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></>,
  papelera:    <><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/></>,
  ajustes:     <><circle cx="12" cy="12" r="3"/><path d="M19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V19a2 2 0 1 1-4 0 1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H5a2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H11a1.6 1.6 0 0 0 1-1.5V5a2 2 0 1 1 4 0 1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V11a1.6 1.6 0 0 0 1.5 1H19a2 2 0 1 1 0 4 1.6 1.6 0 0 0-1.5 1z"/></>,
  campana:     <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>,
  compartida:  <><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 6a3 3 0 0 1 0 6"/><path d="M17 14a6 6 0 0 1 4 6"/></>,
  // Tipos de inversión
  fondo:       <><path d="M3 9l9-5 9 5"/><path d="M5 9v9"/><path d="M9 9v9"/><path d="M15 9v9"/><path d="M19 9v9"/><path d="M3 18h18"/></>,
  etf:         <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/></>,
  accion:      <><path d="M3 17l6-6 4 4 7-8"/><path d="M16 7h5v5"/></>,
  cripto:      <><circle cx="12" cy="12" r="8"/><path d="M9 8.5h4a2 2 0 0 1 0 4H9zM9 12.5h4.5a2 2 0 0 1 0 4H9zM9 6.5v11"/></>,
  bono:        <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/></>,
  pension:     <><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/><path d="M9 12l2 2 4-4"/></>,
  cohete:      <><path d="M5 15c-1 2.5-1 5-1 5s2.5 0 5-1"/><path d="M9 19a10 10 0 0 1 11-13 10 10 0 0 1-7 11z"/><circle cx="14.5" cy="9.5" r="1.6"/></>,
  salvavidas:  <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.6"/><path d="M5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9"/></>,
};

function Icono({ nombre, size = 20, color = "currentColor", stroke = 1.7 }) {
  const contenido = ICONOS[nombre];
  if (!contenido) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{ display:"block", flexShrink:0 }}>
      {contenido}
    </svg>
  );
}

// Icono en línea con el texto (hereda el color del contenedor)
function IconoInline({ nombre, size = 14, color = "currentColor" }) {
  return (
    <span style={{ display:"inline-flex", verticalAlign:"middle", marginRight:5, position:"relative", top:"-1px" }}>
      <Icono nombre={nombre} size={size} color={color}/>
    </span>
  );
}

function LogoBarras({ size = 28 }) {
  const u = size / 28;
  const gid = "logograd" + size;
  // Barras ascendentes con degradado vertical menta (del kit): accent → accent-pale
  const barras = [
    { x: 0,       h: 11 },
    { x: 8 * u,   h: 18 },
    { x: 16 * u,  h: 27 },
  ];
  return (
    <svg width={21*u} height={size} viewBox={`0 0 ${21*u} ${size}`} style={{ display:"block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1={size} x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor={V("--accent")}/>
          <stop offset="1" stopColor={V("--accent-pale")}/>
        </linearGradient>
      </defs>
      {barras.map((b, i) => (
        <rect key={i} x={b.x} y={size - b.h * u} width={5 * u} height={b.h * u}
          rx={2.5 * u} fill={`url(#${gid})`}/>
      ))}
    </svg>
  );
}

// Marca tipográfica "economízalo." — economíza en Inter, lo en serif, punto en acento
function MarcaLO({ serifSize = 24, sansSize = 18, conIso = true, isoSize = 22 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      {conIso && <LogoBarras size={isoSize}/>}
      <span style={{ display:"inline-flex", alignItems:"baseline" }}>
        <span style={{ fontFamily:UI, fontSize:sansSize, fontWeight:500, color:V("--text"),
          letterSpacing:"-0.02em" }}>economíza</span>
        <span style={{ fontFamily:SERIF, fontSize:serifSize, fontWeight:700, color:V("--accent-pale"),
          letterSpacing:"-0.01em", marginLeft:1 }}>lo</span>
        <span style={{ fontFamily:SERIF, fontSize:serifSize, color:V("--accent") }}>.</span>
      </span>
    </div>
  );
}

// Pantalla de bienvenida (se muestra la primera vez)
function PantallaBienvenida({ onEntrar }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000, background:V("--bg"),
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:"40px 28px", textAlign:"center",
      backgroundImage:`radial-gradient(circle at 50% 28%, ${V("--header-glow")}, transparent 62%)`,
    }}>
      {/* Logo grande: barras + lo. */}
      <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginBottom:14 }}>
        <LogoBarras size={52}/>
        <span style={{ display:"inline-flex", alignItems:"baseline" }}>
          <span style={{ fontFamily:SERIF, fontSize:64, fontWeight:700, color:V("--text"), lineHeight:0.9 }}>lo</span>
          <span style={{ fontFamily:SERIF, fontSize:64, color:V("--accent") }}>.</span>
        </span>
      </div>
      <div style={{ fontFamily:SERIF, fontSize:30, color:V("--accent"), marginBottom:18 }}>
        economízalo<span style={{ color:V("--accent") }}>.</span>
      </div>
      <div style={{ fontFamily:UI, fontSize:16, color:V("--text-mid"),
        marginBottom:44, maxWidth:300, lineHeight:1.5 }}>
        Ahorra sin complicarte. La app que te ayuda a entender tus gastos y tomar mejores decisiones.
      </div>

      <button onClick={onEntrar} style={{
        background:V("--accent"), color:V("--bg"), border:"none", borderRadius:999,
        padding:"16px 56px", fontFamily:UI, fontWeight:800, fontSize:16,
        cursor:"pointer", letterSpacing:"0.01em", marginBottom:14,
        boxShadow:`0 0 40px ${mix(V("--accent"),0.16)}`,
      }}>Continuar</button>
      <div style={{ fontFamily:UI, fontSize:12, color:V("--text-dim") }}>Tu dinero, bajo control.</div>
    </div>
  );
}

function Num({ v, decimals=0, color, size=14, mono=true, suffix="€" }) {
  const formatted = typeof v === "number"
    ? v.toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : v;
  return (
    <span style={{
      fontFamily: mono ? "'JetBrains Mono', monospace" : "'Inter', sans-serif",
      fontSize: size, color: color || V("--text"), fontWeight: 500,
    }}>{formatted}{suffix}</span>
  );
}

function BarraProgreso({ valor, maximo, color=V("--c2"), altura=6 }) {
  const pct = maximo > 0 ? Math.min(100, (valor/maximo)*100) : 0;
  const excede = pct >= 100;
  return (
    <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:99, height:altura, overflow:"hidden" }}>
      <div style={{
        width:`${pct}%`, height:"100%", borderRadius:99,
        background: excede ? V("--warn") : color,
        transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: excede ? `0 0 8px ${mix(V("--negative"),"80")}` : `0 0 6px ${mix(color,"60")}`,
      }}/>
    </div>
  );
}

function InputMoneda({ valor, onChange, placeholder="0", compact=false, ancho }) {
  // Estado de texto local: permite editar la cifra completa con libertad
  // (borrar todo, seleccionar y sobrescribir) sin que React normalice en cada tecla.
  const [txt, setTxt] = useState(String(valor || ""));
  const [enfocado, setEnfocado] = useState(false);

  // Cuando el valor externo cambia y NO estamos editando, sincronizamos el texto
  useEffect(() => {
    if (!enfocado) setTxt(valor ? String(valor) : "");
  }, [valor, enfocado]);

  const manejarCambio = (e) => {
    const raw = e.target.value;
    setTxt(raw);
    const num = parseFloat(raw.replace(",", "."));
    onChange(isNaN(num) ? 0 : num);
  };

  return (
    <div style={{ display:"flex", alignItems:"center", gap:3,
      background:V("--surface-2"), border:"1px solid rgba(255,255,255,0.1)",
      borderRadius:8, padding: compact ? "4px 8px" : "7px 10px",
    }}>
      <span style={{ color:V("--text-dim"), fontFamily:"'JetBrains Mono',monospace", fontSize: compact?11:13 }}>€</span>
      <input type="text" inputMode="decimal" value={txt} placeholder={placeholder}
        onFocus={e => { setEnfocado(true); e.target.select(); }}
        onBlur={() => setEnfocado(false)}
        onChange={manejarCambio}
        style={{
          background:"transparent", border:"none", outline:"none",
          width: ancho || (compact ? 65 : 85),
          color:V("--text"), fontFamily:"'JetBrains Mono',monospace", fontSize: compact?12:14,
          textAlign:"right",
        }}
      />
    </div>
  );
}

function InputNumero({ valor, onChange, placeholder="0", sufijo="", compact=false, ancho=85, step=1 }) {
  const [txt, setTxt] = useState(String(valor || ""));
  const [enfocado, setEnfocado] = useState(false);

  useEffect(() => {
    if (!enfocado) setTxt(valor ? String(valor) : "");
  }, [valor, enfocado]);

  const manejarCambio = (e) => {
    const raw = e.target.value;
    setTxt(raw);
    const num = parseFloat(raw.replace(",", "."));
    onChange(isNaN(num) ? 0 : num);
  };

  return (
    <div style={{ display:"flex", alignItems:"center", gap:3,
      background:V("--surface-2"), border:"1px solid rgba(255,255,255,0.1)",
      borderRadius:8, padding: compact ? "4px 8px" : "7px 10px",
    }}>
      <input type="text" inputMode="decimal" value={txt} placeholder={placeholder}
        onFocus={e => { setEnfocado(true); e.target.select(); }}
        onBlur={() => setEnfocado(false)}
        onChange={manejarCambio}
        style={{
          background:"transparent", border:"none", outline:"none", width: ancho,
          color:V("--text"), fontFamily:"'JetBrains Mono',monospace", fontSize: compact?12:14,
          textAlign:"right",
        }}
      />
      {sufijo && <span style={{ color:V("--text-dim"), fontFamily:"'JetBrains Mono',monospace", fontSize: compact?11:13 }}>{sufijo}</span>}
    </div>
  );
}

function SelectorBanco({ value, onChange, compact=true }) {
  const [abierto, setAbierto] = useState(false);
  const meta = BANCO_META[value] || { color:V("--text-dim"), label:"?" };
  return (
    <div style={{ position:"relative" }}>
      <button onClick={(e) => { e.stopPropagation(); setAbierto(a => !a); }} style={{
        fontFamily:"'JetBrains Mono',monospace", fontSize: compact?9:11, fontWeight:600,
        color: meta.color, background: mix(meta.color, "20"),
        padding: compact ? "2px 6px" : "4px 10px",
        borderRadius:4, border:"none", cursor:"pointer",
        display:"flex", alignItems:"center", gap:3,
      }}>
        {value} <span style={{ opacity:0.5, fontSize: compact?8:10 }}>▾</span>
      </button>
      {abierto && (
        <>
          <div onClick={() => setAbierto(false)} style={{ position:"fixed", inset:0, zIndex:50 }}/>
          <div style={{
            position:"absolute", top:"calc(100% + 4px)", right:0, zIndex:51,
            background:V("--surface-elevated"), border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:8, padding:4, boxShadow:"0 8px 24px rgba(0,0,0,0.4)", minWidth:140,
          }}>
            {Object.entries(BANCO_META).map(([id, m]) => (
              <button key={id} onClick={() => { onChange(id); setAbierto(false); }} style={{
                display:"flex", alignItems:"center", gap:8, width:"100%",
                padding:"6px 10px", borderRadius:6, border:"none", cursor:"pointer",
                background: id === value ? mix(m.color, "15") : "transparent",
                fontFamily:"'Inter',sans-serif", fontSize:12, color:V("--text-mid"), textAlign:"left",
              }}>
                <span style={{
                  width:18, height:18, borderRadius:4, background: mix(m.color, "25"),
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, fontWeight:800, color: m.color,
                }}>{m.icono}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SelectorCuenta({ value, cuentas, onChange, placeholder="Sin asignar" }) {
  const [abierto, setAbierto] = useState(false);
  const cuenta = cuentas.find(c => c.id === value);
  const meta = cuenta ? BANCO_META[cuenta.banco] : null;

  return (
    <div style={{ position:"relative" }}>
      <button onClick={(e) => { e.stopPropagation(); setAbierto(a => !a); }} style={{
        fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600,
        color: meta ? meta.color : V("--text-dim"),
        background: meta ? mix(meta.color, "15") : V("--surface-2"),
        padding:"4px 10px", borderRadius:6, border:"none", cursor:"pointer",
        display:"flex", alignItems:"center", gap:5,
      }}>
        {cuenta ? `${cuenta.nombre}` : placeholder}
        <span style={{ opacity:0.5, fontSize:9 }}>▾</span>
      </button>
      {abierto && (
        <>
          <div onClick={() => setAbierto(false)} style={{ position:"fixed", inset:0, zIndex:50 }}/>
          <div style={{
            position:"absolute", top:"calc(100% + 4px)", right:0, zIndex:51,
            background:V("--surface-elevated"), border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:8, padding:4, boxShadow:"0 8px 24px rgba(0,0,0,0.4)",
            minWidth:220, maxHeight:280, overflowY:"auto",
          }}>
            <button onClick={() => { onChange(null); setAbierto(false); }} style={{
              display:"block", width:"100%", padding:"6px 10px", borderRadius:6,
              border:"none", cursor:"pointer", background:"transparent",
              fontFamily:"'Inter',sans-serif", fontSize:12, color:V("--text-dim"),
              textAlign:"left", fontStyle:"italic",
            }}>— Sin asignar —</button>
            {cuentas.map(c => {
              const m = BANCO_META[c.banco];
              return (
                <button key={c.id} onClick={() => { onChange(c.id); setAbierto(false); }} style={{
                  display:"flex", alignItems:"center", gap:8, width:"100%",
                  padding:"6px 10px", borderRadius:6, border:"none", cursor:"pointer",
                  background: c.id === value ? mix(m.color, "15") : "transparent",
                  fontFamily:"'Inter',sans-serif", fontSize:12, color:V("--text-mid"),
                  textAlign:"left",
                }}>
                  <span style={{
                    width:18, height:18, borderRadius:4, background: mix(m.color, "25"),
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:10, fontWeight:800, color: m.color, flexShrink:0,
                  }}>{m.icono}</span>
                  <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {c.nombre}
                  </span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:V("--text-dim") }}>
                    {c.asignado.toLocaleString("es-ES",{minimumFractionDigits:0})}€
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SelectorProposito({ value, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const prop = PROPOSITOS[value] || PROPOSITOS.otros;
  return (
    <div style={{ position:"relative" }}>
      <button onClick={(e) => { e.stopPropagation(); setAbierto(a => !a); }} style={{
        fontSize:11, padding:"2px 5px", borderRadius:4, border:"none", cursor:"pointer",
        background:V("--surface-2"), color:V("--text-mid"),
      }}><Icono nombre={prop.icono} size={14} color={V("--text-mid")}/> ▾</button>
      {abierto && (
        <>
          <div onClick={() => setAbierto(false)} style={{ position:"fixed", inset:0, zIndex:50 }}/>
          <div style={{
            position:"absolute", top:"calc(100% + 4px)", right:0, zIndex:51,
            background:V("--surface-elevated"), border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:8, padding:4, boxShadow:"0 8px 24px rgba(0,0,0,0.4)", minWidth:140,
          }}>
            {Object.entries(PROPOSITOS).map(([id, p]) => (
              <button key={id} onClick={() => { onChange(id); setAbierto(false); }} style={{
                display:"flex", alignItems:"center", gap:6, width:"100%",
                padding:"5px 8px", borderRadius:5, border:"none", cursor:"pointer",
                background: id === value ? mix(V("--accent"),0.15) : "transparent",
                fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-mid"), textAlign:"left",
              }}>
                <span style={{display:"inline-flex"}}><Icono nombre={p.icono} size={14} color="currentColor"/></span> <span>{p.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BotonAnadir({ onClick, label, color=V("--accent") }) {
  return (
    <button onClick={onClick} style={{
      width:"100%", marginTop:8, padding:10, borderRadius:10,
      border:`1.5px dashed ${color}50`, background:"transparent",
      color, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600,
    }}>+ {label}</button>
  );
}

// Fila de gasto del catálogo: importe y banco son globales, pagado es del mes
function FilaGastoCatalogo({ gasto, onPagado, onImporte, onBanco, onEliminar }) {
  const esAuto = !!gasto.auto;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:8, padding:"9px 0",
      borderBottom:`1px solid ${V("--border")}`,
      background: esAuto ? mix(V("--accent"),0.04) : "transparent",
    }}>
      <button onClick={onPagado} style={{
        width:20, height:20, borderRadius:5, flexShrink:0, cursor:"pointer",
        border: gasto.pagado ? "none" : "1.5px solid rgba(255,255,255,0.2)",
        background: gasto.pagado ? V("--accent") : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {gasto.pagado && <span style={{ fontSize:11, color:V("--bg"), fontWeight:900 }}>✓</span>}
      </button>

      <span style={{
        flex:1, fontSize:13, fontFamily:"'Inter',sans-serif", fontWeight:500, minWidth:0,
        color: gasto.pagado ? V("--accent") : V("--text-mid"),
        textDecoration: gasto.pagado ? "line-through" : "none",
        opacity: gasto.pagado ? 0.7 : 1,
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
      }}>
        {esAuto && <span style={{ marginRight:3, display:"inline-flex", verticalAlign:"middle" }}><Icono nombre="auto" size={12} color={V("--accent")}/></span>}
        {gasto.nombre}
      </span>

      <SelectorBanco value={gasto.banco} onChange={onBanco}/>

      {esAuto ? (
        // Importe calculado, no editable
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700,
          color:V("--accent"), minWidth:55, textAlign:"right" }}>
          {(gasto.importe||0).toLocaleString("es-ES",{minimumFractionDigits:0})}€
        </span>
      ) : (
        <InputMoneda valor={gasto.importe} onChange={onImporte} compact ancho={55}/>
      )}

      {esAuto ? (
        <span style={{ width:18, display:"inline-flex", justifyContent:"center" }} title="Gasto automático"><Icono nombre="auto" size={13} color={V("--text-dim")}/></span>
      ) : (
        <button onClick={onEliminar} style={{ background:"none", border:"none",
          cursor:"pointer", color:mix(V("--negative"),"60"), fontSize:14, padding:"0 2px" }}>×</button>
      )}
    </div>
  );
}

function FormularioAnadirGasto({ tipo, onGuardar, onCancelar, colorAccion=V("--accent") }) {
  const [nombre, setNombre]   = useState("");
  const [importe, setImporte] = useState(0);
  const [banco, setBanco]     = useState("BBVA");

  const guardar = () => {
    if (!nombre.trim() || importe <= 0) return;
    onGuardar({ nombre: nombre.trim(), importe, banco });
  };

  return (
    <div style={{ marginTop:8, padding:"12px", background:"rgba(255,255,255,0.03)", borderRadius:10,
      border:"1px solid rgba(255,255,255,0.08)" }}>
      <input placeholder="Nombre del gasto" value={nombre}
        onChange={e => setNombre(e.target.value)}
        style={{ width:"100%", background:V("--border"), border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:8, padding:"8px 10px", color:V("--text"), fontSize:13, outline:"none",
          fontFamily:"'Inter',sans-serif", marginBottom:8 }}
      />
      <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
        {Object.keys(BANCO_META).map(b => (
          <button key={b} onClick={() => setBanco(b)} style={{
            padding:"4px 10px", borderRadius:8, border:"none", cursor:"pointer", fontSize:10,
            fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            background: banco===b ? BANCO_META[b].color : V("--border"),
            color: banco===b ? V("--bg") : V("--text-dim"),
          }}>{b}</button>
        ))}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <InputMoneda valor={importe} onChange={setImporte}/>
        <button onClick={guardar} style={{
          flex:1, background:colorAccion, color:V("--bg"), border:"none", borderRadius:8,
          fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer",
        }}>Guardar</button>
        <button onClick={onCancelar} style={{
          padding:"0 12px", background:V("--border"), color:V("--text-dim"),
          border:"none", borderRadius:8, cursor:"pointer", fontSize:13,
        }}>✕</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BLOQUE BANCOS (en Inicio)
// ═══════════════════════════════════════════════════════

function BloqueBancos({ datos, onUpdateDatos }) {
  const [abierto, setAbierto] = useState(true);  // abierto por defecto, es lo principal
  const [anadiendoEn, setAnadiendoEn] = useState(null);
  const [editandoNombre, setEditandoNombre] = useState(null);
  const [anadiendoBanco, setAnadiendoBanco] = useState(false);

  const añadirBanco = (data) => {
    const nuevoId = `banco-${Date.now()}`;
    const idx = Object.keys(datos.bancosConfig || {}).length;
    onUpdateDatos(d => {
      if (!d.bancosConfig) d.bancosConfig = {};
      d.bancosConfig[nuevoId] = {
        nombre: data.nombre, modo: data.modo, total: 0,
        color: PALETA_BANCOS[idx % PALETA_BANCOS.length],
      };
    });
    setAnadiendoBanco(false);
  };
  const eliminarBanco = (id, nombre) => {
    const cuentasDelBanco = datos.cuentas.filter(c => c.banco === id).length;
    const msg = cuentasDelBanco > 0
      ? `"${nombre}" tiene ${cuentasDelBanco} cuenta(s). Se eliminarán también. ¿Continuar?`
      : `¿Eliminar el banco "${nombre}"?`;
    if (!confirm(msg)) return;
    onUpdateDatos(d => {
      delete d.bancosConfig[id];
      d.cuentas = d.cuentas.filter(c => c.banco !== id);
    });
  };

  // Resumen agregado
  const totalLiquido = Object.keys(BANCO_META).reduce((a, b) =>
    a + totalBanco(datos.bancosConfig, datos.cuentas, b), 0);
  const libreTotal = Object.keys(BANCO_META).reduce((a, b) =>
    a + libreBanco(datos.bancosConfig, datos.cuentas, b), 0);
  // Asignado: suma de cuentas propias (no compartidas)
  const totalAsignado = datos.cuentas.filter(c => !c.compartida)
    .reduce((a, c) => a + (c.asignado || 0), 0);
  // Compartido: 50% de la suma de saldos compartidos
  const totalCompartido = patrimonioCompartido(datos.cuentas);
  const saldoCompartido = saldoCompartidoTotal(datos.cuentas);

  const setModoBanco = (banco, modo) => onUpdateDatos(d => {
    if (!d.bancosConfig[banco]) d.bancosConfig[banco] = { modo: "suma", total: 0 };
    d.bancosConfig[banco].modo = modo;
  });
  const setTotalBancoManual = (banco, v) => onUpdateDatos(d => {
    if (!d.bancosConfig[banco]) d.bancosConfig[banco] = { modo: "reserva", total: 0 };
    d.bancosConfig[banco].total = v;
  });
  const actualizarCuenta = (id, cambios) => onUpdateDatos(d => {
    d.cuentas = d.cuentas.map(c => c.id === id ? { ...c, ...cambios } : c);
  });
  const eliminarCuenta = (id) => onUpdateDatos(d => { d.cuentas = d.cuentas.filter(c => c.id !== id); });
  const añadirCuenta = (banco, data) => {
    const nuevoId = `cuenta-${Date.now()}`;  // id único generado fuera del fn
    onUpdateDatos(d => {
      d.cuentas.push({ ...data, banco, id: nuevoId });
    });
    setAnadiendoEn(null);
  };

  return (
    <div style={{ background:V("--surface"), borderRadius:14, marginBottom:12,
      border:`1px solid ${V("--border")}`, overflow:"hidden" }}>

      {/* Cabecera con resumen */}
      <div onClick={() => setAbierto(a => !a)}
        style={{ padding:"14px 16px", cursor:"pointer",
          borderBottom: abierto ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:abierto ? 10 : 0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase" }}><Icono nombre="banco" size={17} color={V("--text-mid")}/> Bancos y cuentas</div>
          <span style={{ color:V("--text-dim"), fontSize:14 }}>{abierto ? "▲" : "▼"}</span>
        </div>

        {/* Resumen siempre visible */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6 }}>
          <div style={{ textAlign:"center", background:mix(V("--c2"),0.08), borderRadius:8, padding:"8px 4px" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:V("--c2") }}>
              {totalLiquido.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:8, color:V("--text-dim"), marginTop:2 }}>Líquido</div>
          </div>
          <div style={{ textAlign:"center", background:mix(V("--c3"),0.08), borderRadius:8, padding:"8px 4px" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:V("--c3") }}>
              {totalCompartido.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:8, color:V("--text-dim"), marginTop:2 }}>
              <IconoInline nombre="compartida"/>50% ({saldoCompartido.toLocaleString("es-ES",{minimumFractionDigits:0})}€)
            </div>
          </div>
          <div style={{ textAlign:"center", background:mix(V("--c4"),0.08), borderRadius:8, padding:"8px 4px" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:V("--c4") }}>
              {totalAsignado.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:8, color:V("--text-dim"), marginTop:2 }}>Asignado</div>
          </div>
          <div style={{ textAlign:"center",
            background: libreTotal >= 0 ? mix(V("--accent"),0.08) : mix(V("--negative"),0.08),
            borderRadius:8, padding:"8px 4px" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700,
              color: libreTotal >= 0 ? V("--accent") : V("--negative") }}>
              {libreTotal >= 0 ? "+" : ""}{libreTotal.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:8, color:V("--text-dim"), marginTop:2 }}>Libre</div>
          </div>
        </div>
      </div>

      {abierto && (
        <div style={{ padding:"14px" }}>
          {Object.entries(BANCO_META).map(([bancoId, meta]) => {
            const cfg = datos.bancosConfig[bancoId] || { modo:"suma", total:0 };
            const total = totalBanco(datos.bancosConfig, datos.cuentas, bancoId);
            const libre = libreBanco(datos.bancosConfig, datos.cuentas, bancoId);
            const asignado = datos.cuentas.filter(c => c.banco === bancoId)
              .reduce((a,c) => a + (c.asignado||0), 0);
            const cuentasBanco = datos.cuentas.filter(c => c.banco === bancoId);
            const esSuma = cfg.modo === "suma";

            return (
              <div key={bancoId} style={{ marginBottom:14,
                background:"rgba(255,255,255,0.02)", borderRadius:12,
                border:`1px solid ${meta.color}20`, padding:"10px 12px" }}>

                {/* Header del banco */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{
                      width:24, height:24, borderRadius:6, background: mix(meta.color, "25"),
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:800, color: meta.color,
                    }}>{meta.icono}</div>
                    <div>
                      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:700, color:V("--text-mid") }}>
                        {meta.label}
                      </div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:V("--text-dim"), marginTop:1 }}>
                        {esSuma ? <><IconoInline nombre="formula"/>suma de cuentas</> : <><IconoInline nombre="objetivo"/>total manual + reservas</>}
                      </div>
                    </div>
                  </div>
                  {/* Toggle modo: suma / reserva */}
                  <button onClick={() => setModoBanco(bancoId, esSuma ? "reserva" : "suma")} style={{
                    padding:"3px 8px", borderRadius:5, border:"none", cursor:"pointer", fontSize:9,
                    fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
                    background: V("--border"), color:V("--text-dim"),
                  }}>{esSuma ? "→ reserva" : "→ suma"}</button>
                </div>

                {/* Total del banco: editable si reserva, display si suma */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  marginBottom:10, padding:"6px 8px", borderRadius:6,
                  background: mix(meta.color, "10") }}>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-dim") }}>
                    Total {esSuma ? "(auto)" : "(introduce tú)"}
                  </span>
                  {esSuma ? (
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700,
                      color: meta.color }}>
                      {total.toLocaleString("es-ES",{minimumFractionDigits:0})}€
                    </span>
                  ) : (
                    <InputMoneda valor={cfg.total || 0} onChange={v => setTotalBancoManual(bancoId, v)} compact ancho={75}/>
                  )}
                </div>

                {/* Lista de cuentas */}
                {cuentasBanco.length === 0 && (
                  <div style={{ padding:"8px", textAlign:"center", fontFamily:"'Inter',sans-serif",
                    fontSize:11, color:V("--text-dim"), fontStyle:"italic" }}>
                    Sin cuentas
                  </div>
                )}
                {cuentasBanco.map(c => {
                  const prop = PROPOSITOS[c.proposito] || PROPOSITOS.otros;
                  const enEdicion = editandoNombre === c.id;
                  const esCompartida = !!c.compartida;
                  return (
                    <div key={c.id} style={{
                      display:"flex", alignItems:"center", gap:6, padding:"6px 0",
                      borderBottom:`1px solid ${V("--border")}`,
                      background: esCompartida ? mix(V("--c3"),0.04) : "transparent",
                    }}>
                      <span style={{ width:18, display:"inline-flex", justifyContent:"center" }}><Icono nombre={prop.icono} size={13} color="currentColor"/></span>
                      {enEdicion ? (
                        <input value={c.nombre}
                          onChange={e => actualizarCuenta(c.id, { nombre: e.target.value })}
                          onBlur={() => setEditandoNombre(null)}
                          autoFocus
                          style={{ flex:1, background:V("--border"), border:"1px solid "+meta.color+"40",
                            borderRadius:5, padding:"3px 6px", color:V("--text"), fontSize:12, outline:"none",
                            fontFamily:"'Inter',sans-serif", minWidth:0 }}
                        />
                      ) : (
                        <span onClick={() => setEditandoNombre(c.id)} style={{
                          flex:1, fontFamily:"'Inter',sans-serif", fontSize:12, color:V("--text-mid"),
                          cursor:"pointer", minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        }}>
                          {esCompartida && <span style={{ marginRight:4, display:"inline-flex", verticalAlign:"middle" }}><Icono nombre="compartida" size={12}/></span>}
                          {c.nombre}
                          <span style={{ fontSize:9, color:V("--text-dim"), marginLeft:5 }}>
                            {prop.label}{esCompartida ? " · 50%" : ""}
                          </span>
                        </span>
                      )}
                      {/* Botón pequeño para alternar compartida */}
                      <button onClick={() => actualizarCuenta(c.id, { compartida: !esCompartida })} title={esCompartida ? "Quitar compartida" : "Marcar compartida"} style={{
                        fontSize:11, padding:"2px 5px", borderRadius:4, border:"none", cursor:"pointer",
                        background: esCompartida ? mix(V("--c3"),0.2) : V("--surface-2"),
                        color: esCompartida ? V("--c3") : V("--text-dim"),
                      }}><Icono nombre="compartida" size={14}/></button>
                      <SelectorProposito value={c.proposito} onChange={p => actualizarCuenta(c.id, { proposito: p })}/>
                      <InputMoneda valor={c.asignado} onChange={v => actualizarCuenta(c.id, { asignado: v })} compact ancho={55}/>
                      <button onClick={() => eliminarCuenta(c.id)} style={{ background:"none", border:"none",
                        cursor:"pointer", color:mix(V("--negative"),"60"), fontSize:13, padding:"0 2px" }}>×</button>
                    </div>
                  );
                })}

                {/* Solo en modo reserva: indicador de libre */}
                {!esSuma && cuentasBanco.length > 0 && (
                  <div style={{
                    marginTop:8, padding:"8px 10px", borderRadius:8,
                    background: libre >= 0 ? mix(V("--accent"),0.06) : mix(V("--negative"),0.08),
                    border: `1px solid ${libre >= 0 ? mix(V("--accent"),"25") : mix(V("--negative"),"30")}`,
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-dim") }}>
                        reservado <span style={{ color:V("--text-mid"), fontFamily:"'JetBrains Mono',monospace" }}>
                          {asignado.toLocaleString("es-ES",{minimumFractionDigits:0})}€
                        </span>
                      </span>
                      <span style={{
                        fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700,
                        color: libre >= 0 ? V("--accent") : V("--negative"),
                      }}>
                        <IconoInline nombre="candadoAbierto"/>{libre >= 0 ? "+" : ""}{libre.toLocaleString("es-ES",{minimumFractionDigits:0})}€ libre
                      </span>
                    </div>
                    {libre < 0 && (
                      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:V("--warn"), marginTop:4 }}>
                        <IconoInline nombre="alerta"/>Has reservado más de lo que tienes en el banco
                      </div>
                    )}
                  </div>
                )}

                {anadiendoEn === bancoId ? (
                  <FormularioAnadirCuenta
                    onGuardar={data => añadirCuenta(bancoId, data)}
                    onCancelar={() => setAnadiendoEn(null)}
                    colorAccion={meta.color}
                  />
                ) : (
                  <BotonAnadir onClick={() => setAnadiendoEn(bancoId)}
                    label={`Añadir cuenta en ${meta.label}`} color={meta.color}/>
                )}
                <button onClick={() => eliminarBanco(bancoId, meta.label)} style={{
                  marginTop:6, width:"100%", background:"none", border:`1px solid ${V("--border")}`,
                  borderRadius:8, padding:"6px", cursor:"pointer", fontFamily:"'Inter',sans-serif",
                  fontSize:10, color:V("--text-dim") }}>
                  Eliminar banco
                </button>
              </div>
            );
          })}

          {/* Estado vacío + añadir banco */}
          {Object.keys(datos.bancosConfig || {}).length === 0 && !anadiendoBanco && (
            <div style={{ padding:"16px 8px", textAlign:"center" }}>
              <div style={{ fontFamily:UI, fontSize:13, color:V("--text-mid"), marginBottom:4 }}>
                Aún no tienes bancos
              </div>
              <div style={{ fontFamily:UI, fontSize:11, color:V("--text-dim"), lineHeight:1.4 }}>
                Añade tu primer banco para empezar a organizar tus cuentas y saldos.
              </div>
            </div>
          )}

          {anadiendoBanco ? (
            <FormularioAnadirBanco onGuardar={añadirBanco} onCancelar={() => setAnadiendoBanco(false)}/>
          ) : (
            <BotonAnadir onClick={() => setAnadiendoBanco(true)} label="Añadir banco" color={V("--accent")}/>
          )}
        </div>
      )}
    </div>
  );
}

function FormularioAnadirBanco({ onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState("");
  const [modo, setModo] = useState("suma");

  return (
    <div style={{ marginTop:8, padding:"12px", background:"rgba(255,255,255,0.03)", borderRadius:12,
      border:`1px solid ${V("--border")}` }}>
      <input placeholder="Nombre del banco (ej. BBVA)" value={nombre}
        onChange={e => setNombre(e.target.value)} autoFocus
        style={{ width:"100%", background:V("--surface-2"), border:`1px solid ${V("--border")}`,
          borderRadius:10, padding:"10px 12px", color:V("--text"), fontSize:14, outline:"none",
          fontFamily:UI, marginBottom:12 }}/>

      <div style={{ fontFamily:UI, fontSize:10, fontWeight:600, color:V("--text-dim"),
        marginBottom:6 }}>¿CÓMO QUIERES LLEVAR EL SALDO?</div>
      <div style={{ display:"flex", gap:6, marginBottom:8 }}>
        {[
          { id:"suma", label:"Por cuentas", desc:"El saldo es la suma de las cuentas que le asignes" },
          { id:"reserva", label:"Saldo total", desc:"Tú escribes el saldo total del banco a mano" },
        ].map(m => (
          <button key={m.id} onClick={() => setModo(m.id)} style={{
            flex:1, padding:"10px 8px", borderRadius:10, cursor:"pointer", textAlign:"left",
            border:`1px solid ${modo === m.id ? V("--accent") : V("--border")}`,
            background: modo === m.id ? mix(V("--accent"), "20") : "transparent",
          }}>
            <div style={{ fontFamily:UI, fontSize:12, fontWeight:700,
              color: modo === m.id ? V("--accent") : V("--text-mid") }}>{m.label}</div>
            <div style={{ fontFamily:UI, fontSize:9, color:V("--text-dim"), marginTop:3, lineHeight:1.3 }}>{m.desc}</div>
          </button>
        ))}
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => { if (nombre.trim()) onGuardar({ nombre: nombre.trim(), modo }); }}
          style={{ flex:1, background:V("--accent"), color:V("--bg"), border:"none", borderRadius:999,
            fontFamily:UI, fontWeight:800, fontSize:14, cursor:"pointer", padding:"12px" }}>Crear banco</button>
        <button onClick={onCancelar} style={{ padding:"0 16px", background:V("--surface-2"),
          color:V("--text-dim"), border:"none", borderRadius:999, cursor:"pointer", fontSize:14 }}>✕</button>
      </div>
    </div>
  );
}

function FormularioAnadirCuenta({ onGuardar, onCancelar, colorAccion=V("--accent") }) {
  const [nombre, setNombre]       = useState("");
  const [proposito, setProposito] = useState("operativa");
  const [asignado, setAsignado]   = useState(0);
  const [compartida, setCompartida] = useState(false);

  const guardar = () => {
    if (!nombre.trim()) return;
    onGuardar({ nombre: nombre.trim(), proposito, asignado, compartida });
  };

  return (
    <div style={{ marginTop:8, padding:"10px", background:"rgba(255,255,255,0.03)", borderRadius:10,
      border:"1px solid rgba(255,255,255,0.08)" }}>
      <input placeholder="Nombre de la cuenta" value={nombre}
        onChange={e => setNombre(e.target.value)}
        style={{ width:"100%", background:V("--border"), border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:6, padding:"6px 10px", color:V("--text"), fontSize:12, outline:"none",
          fontFamily:"'Inter',sans-serif", marginBottom:6 }}
      />
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
        {Object.entries(PROPOSITOS).map(([id, p]) => (
          <button key={id} onClick={() => setProposito(id)} style={{
            padding:"3px 7px", borderRadius:5, border:"none", cursor:"pointer", fontSize:10,
            fontFamily:"'Inter',sans-serif", fontWeight:600,
            background: proposito === id ? colorAccion + "25" : V("--surface-2"),
            color: proposito === id ? colorAccion : V("--text-dim"),
          }}><span style={{display:"inline-flex",verticalAlign:"middle",marginRight:5}}><Icono nombre={p.icono} size={13} color="currentColor"/></span>{p.label}</button>
        ))}
      </div>

      {/* Toggle compartida */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"6px 0", marginBottom:8 }}>
        <div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-mid") }}>
            <IconoInline nombre="compartida"/>Cuenta compartida
          </div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginTop:1 }}>
            no suma al banco · cuenta el 50% en patrimonio
          </div>
        </div>
        <button onClick={() => setCompartida(c => !c)} style={{
          padding:"3px 10px", borderRadius:16, border:"none", cursor:"pointer", fontSize:10,
          fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
          background: compartida ? mix(V("--c3"),0.2) : V("--border"),
          color: compartida ? V("--c3") : V("--text-dim"),
        }}>{compartida ? "SÍ" : "NO"}</button>
      </div>

      <div style={{ display:"flex", gap:6 }}>
        <InputMoneda valor={asignado} onChange={setAsignado} compact ancho={70}/>
        <button onClick={guardar} style={{
          flex:1, background:colorAccion, color:V("--bg"), border:"none", borderRadius:6,
          fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer",
        }}>Crear</button>
        <button onClick={onCancelar} style={{
          padding:"0 10px", background:V("--border"), color:V("--text-dim"),
          border:"none", borderRadius:6, cursor:"pointer", fontSize:12,
        }}>✕</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// VISTA INICIO
// ═══════════════════════════════════════════════════════

function VistaInicio({ datos, claveM, mesNum, onUpdateDatos }) {
  // Datos efectivos del mes (si cerrado, usa snapshot)
  const dEf = datosEfectivosMes(datos, claveM);

  const totalIngresos = calcularIngresosMes(datos, claveM);
  const ingresoKm = calcularIngresoKm(datos, claveM);

  const [anadiendoFuente, setAnadiendoFuente] = useState(false);

  const mes = getMes(datos, claveM);

  // Setters (no se llaman si el mes está cerrado, gracias al pointer-events:none de App)
  const setIngresoBaseCampo = (id, campo, valor) => onUpdateDatos(d => {
    d.ingresosBase = d.ingresosBase.map(f => f.id === id ? { ...f, [campo]: valor } : f);
  });
  const eliminarIngreso = (id) => onUpdateDatos(d => {
    d.ingresosBase = d.ingresosBase.filter(f => f.id !== id);
  });
  const añadirIngreso = (nombre, importe) => {
    const nuevoId = `ing-${Date.now()}`;  // id único generado fuera del fn
    onUpdateDatos(d => {
      d.ingresosBase.push({ id: nuevoId, nombre, importe });
    });
    setAnadiendoFuente(false);
  };
  const setKm = (v) => onUpdateDatos(d => {
    if (!d.meses[claveM]) d.meses[claveM] = estadoMesVacio();
    d.meses[claveM].km = v;
  });

  // Ingresos SOLO de este mes
  const [anadiendoIngresoMes, setAnadiendoIngresoMes] = useState(false);
  const asegurarIngresosMesArray = (d) => {
    if (!d.meses[claveM]) d.meses[claveM] = estadoMesVacio();
    if (!Array.isArray(d.meses[claveM].ingresosMes)) d.meses[claveM].ingresosMes = [];
  };
  const añadirIngresoMes = (nombre, importe) => {
    const nuevoId = `ingmes-${Date.now()}`;
    onUpdateDatos(d => {
      asegurarIngresosMesArray(d);
      d.meses[claveM].ingresosMes.push({ id: nuevoId, nombre, importe });
    });
    setAnadiendoIngresoMes(false);
  };
  const setIngresoMesCampo = (id, campo, valor) => onUpdateDatos(d => {
    asegurarIngresosMesArray(d);
    d.meses[claveM].ingresosMes = d.meses[claveM].ingresosMes.map(f =>
      f.id === id ? { ...f, [campo]: valor } : f);
  });
  const eliminarIngresoMes = (id) => onUpdateDatos(d => {
    asegurarIngresosMesArray(d);
    d.meses[claveM].ingresosMes = d.meses[claveM].ingresosMes.filter(f => f.id !== id);
  });

  return (
    <div className="slide-in">

      {/* 1. INGRESOS DEL MES */}
      <div style={{ background:V("--surface"), borderRadius:18, padding:"16px 18px", marginBottom:12,
        border:`1px solid ${V("--border")}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase" }}>Ingresos del mes</div>
          <Num v={totalIngresos} decimals={0} color={V("--accent")} size={14}/>
        </div>

        {/* Fuentes fijas (editables, borrables) */}
        {(dEf.ingresosBase || []).map(fuente => (
          <FilaIngreso key={fuente.id} fuente={fuente}
            onNombre={n => setIngresoBaseCampo(fuente.id, "nombre", n)}
            onImporte={v => setIngresoBaseCampo(fuente.id, "importe", v)}
            onEliminar={() => eliminarIngreso(fuente.id)}
          />
        ))}

        {/* Añadir nueva fuente */}
        {anadiendoFuente ? (
          <FormularioAnadirIngreso
            onGuardar={añadirIngreso}
            onCancelar={() => setAnadiendoFuente(false)}/>
        ) : (
          <button onClick={() => setAnadiendoFuente(true)} style={{
            width:"100%", padding:"6px", borderRadius:6, border:"none", cursor:"pointer",
            background:"rgba(255,255,255,0.03)", color:V("--text-dim"),
            fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, marginTop:4,
          }}>+ Añadir fuente de ingreso</button>
        )}

        {/* Ingresos SOLO de este mes */}
        <div style={{ marginTop:8, paddingTop:6, borderTop:"1px solid rgba(255,255,255,0.04)" }}>
          {(Array.isArray(mes.ingresosMes) ? mes.ingresosMes : []).map(fuente => (
            <FilaIngreso key={fuente.id} fuente={fuente} soloMes
              onNombre={n => setIngresoMesCampo(fuente.id, "nombre", n)}
              onImporte={v => setIngresoMesCampo(fuente.id, "importe", v)}
              onEliminar={() => eliminarIngresoMes(fuente.id)}
            />
          ))}
          {anadiendoIngresoMes ? (
            <FormularioAnadirIngreso
              onGuardar={añadirIngresoMes}
              onCancelar={() => setAnadiendoIngresoMes(false)}/>
          ) : (
            <button onClick={() => setAnadiendoIngresoMes(true)} style={{
              width:"100%", padding:"6px", borderRadius:6, border:"none", cursor:"pointer",
              background:mix(V("--warn"),0.06), color:V("--warn"),
              fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, marginTop:4,
            }}>+ Añadir ingreso solo de este mes</button>
          )}
        </div>

        {/* Km (no se hereda) */}
        <div style={{ padding:"9px 0", marginTop:4, borderTop:"1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:V("--text-mid") }}>
                Km coche trabajo
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:V("--warn"),
                  background:mix(V("--warn"),0.12), padding:"1px 5px", borderRadius:3, marginLeft:5 }}>SOLO MES</span>
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:V("--text-dim"), marginTop:2 }}>
                {TARIFA_KM.toFixed(2).replace(".",",")}€/km · <span style={{ color:V("--accent") }}>+{ingresoKm.toLocaleString("es-ES",{minimumFractionDigits:2})}€</span>
              </div>
            </div>
            <InputNumero valor={mes.km} onChange={setKm} sufijo="km" compact />
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:700, color:V("--text-mid") }}>TOTAL</span>
          <Num v={totalIngresos} decimals={2} color={V("--accent")} size={15}/>
        </div>
      </div>

      {/* Km (no se hereda) ya está arriba; cierre de la vista */}
    </div>
  );
}

// Fila editable de una fuente de ingreso fija
function FilaIngreso({ fuente, onNombre, onImporte, onEliminar, soloMes=false }) {
  const [editando, setEditando] = useState(false);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 0",
      borderBottom:`1px solid ${V("--border")}` }}>
      {editando ? (
        <input value={fuente.nombre}
          onChange={e => onNombre(e.target.value)}
          onBlur={() => setEditando(false)}
          autoFocus
          style={{ flex:1, background:V("--border"), border:"1px solid rgba(255,255,255,0.15)",
            borderRadius:5, padding:"3px 6px", color:V("--text"), fontSize:13, outline:"none",
            fontFamily:"'Inter',sans-serif", minWidth:0 }}
        />
      ) : (
        <span onClick={() => setEditando(true)} style={{
          flex:1, fontFamily:"'Inter',sans-serif", fontSize:13, color:V("--text-mid"),
          cursor:"pointer", minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        }}>
          {fuente.nombre}
          {soloMes && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:V("--warn"),
              background:mix(V("--warn"),0.12), padding:"1px 5px", borderRadius:3, marginLeft:5 }}>SOLO MES</span>
          )}
        </span>
      )}
      <InputMoneda valor={fuente.importe} onChange={onImporte} compact />
      <button onClick={onEliminar} style={{ background:"none", border:"none",
        cursor:"pointer", color:mix(V("--negative"),"60"), fontSize:14, padding:"0 2px" }}>×</button>
    </div>
  );
}

function FormularioAnadirIngreso({ onGuardar, onCancelar }) {
  const [nombre, setNombre]   = useState("");
  const [importe, setImporte] = useState(0);

  const guardar = () => {
    if (!nombre.trim()) return;
    onGuardar(nombre.trim(), importe);
  };

  return (
    <div style={{ marginTop:6, padding:"8px", background:"rgba(255,255,255,0.03)", borderRadius:8,
      border:"1px solid rgba(255,255,255,0.08)" }}>
      <input placeholder="Nombre (ej. Alquiler habitación)" value={nombre}
        onChange={e => setNombre(e.target.value)}
        style={{ width:"100%", background:V("--border"), border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:6, padding:"6px 10px", color:V("--text"), fontSize:12, outline:"none",
          fontFamily:"'Inter',sans-serif", marginBottom:6 }}
      />
      <div style={{ display:"flex", gap:6 }}>
        <InputMoneda valor={importe} onChange={setImporte} compact ancho={70}/>
        <button onClick={guardar} style={{
          flex:1, background:V("--accent"), color:V("--bg"), border:"none", borderRadius:6,
          fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer",
        }}>Añadir</button>
        <button onClick={onCancelar} style={{
          padding:"0 10px", background:V("--border"), color:V("--text-dim"),
          border:"none", borderRadius:6, cursor:"pointer", fontSize:12,
        }}>✕</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// VISTA GASTOS MENSUALES
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// BLOQUE APORTACIÓN ANUAL (prorrateo) — compacto desplegable
// ═══════════════════════════════════════════════════════
function BloqueAportacionAnual({ datos, claveM, mesNum, onUpdateDatos }) {
  const [abierto, setAbierto] = useState(false);
  const dEf = datosEfectivosMes(datos, claveM);

  const aportacion = calcularAportacionAnual(datos, mesNum, claveM);
  const pendienteAnual = totalAnualesPendiente(dEf);
  const cuentaReservaImp = dEf.cuentas.find(c => c.id === dEf.reservaImpCuenta);
  const saldoReservaImp = cuentaReservaImp ? cuentaReservaImp.asignado : 0;
  const pct = dEf.porcentajeExtra || 0;

  const setReservaImpCuenta = (id) => onUpdateDatos(d => { d.reservaImpCuenta = id; });
  const setPorcentajeExtra = (v) => onUpdateDatos(d => {
    d.porcentajeExtra = Math.max(0, Math.min(100, v));
  });

  return (
    <div style={{ background:`linear-gradient(135deg, ${mix(V("--accent"),0.10)}, ${mix(V("--c2"),0.06)})`,
      borderRadius:12, border:`1px solid ${mix(V("--accent"),"40")}`, marginBottom:12, overflow:"hidden" }}>

      {/* Barra compacta clicable */}
      <div onClick={() => setAbierto(a => !a)}
        style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"12px 14px", cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Icono nombre="formula" size={16} color={V("--accent")}/>
          <div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:700, color:V("--text-mid") }}>
              A aportar el mes que viene
            </div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:V("--text-dim") }}>
              para gastos anuales
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:800, color:V("--accent") }}>
              {Math.max(0, aportacion).toFixed(0)}€<span style={{ fontSize:10, color:V("--text-dim"), marginLeft:2 }}>/mes</span>
            </div>
          </div>
          <span style={{ color:V("--text-dim"), fontSize:13 }}>{abierto ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Detalle desplegable */}
      {abierto && (
        <div style={{ padding:"0 14px 12px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"8px 0", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-dim") }}>Pendiente este año</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:V("--c4") }}>
              {pendienteAnual.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </span>
          </div>

          {/* % del extra a destinar */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"6px 0", borderBottom:`1px solid ${V("--border")}` }}>
            <div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-mid") }}>% del extra a destinar</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:V("--text-dim"), marginTop:1 }}>
                del sueldo extra anual
              </div>
            </div>
            <InputNumero valor={pct} onChange={setPorcentajeExtra} sufijo="%" compact ancho={45} step={0.1}/>
          </div>

          {/* Cuenta vinculada */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"6px 0", borderBottom:`1px solid ${V("--border")}` }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-mid") }}>Cuenta de la reserva</span>
            <SelectorCuenta value={dEf.reservaImpCuenta} cuentas={dEf.cuentas}
              onChange={setReservaImpCuenta}/>
          </div>

          {/* Reserva impuestos = saldo de la cuenta */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0" }}>
            <div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-mid") }}>Reserva impuestos</div>
              {cuentaReservaImp ? (
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginTop:1 }}>
                  desde {cuentaReservaImp.nombre}
                </div>
              ) : (
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--warn"), marginTop:1 }}>
                  sin cuenta asignada
                </div>
              )}
            </div>
            <span style={{
              fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700,
              color: cuentaReservaImp ? V("--accent") : V("--text-dim"),
            }}>
              {saldoReservaImp.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </span>
          </div>

          <div style={{ marginTop:8, fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"),
            padding:"6px 8px", background:mix(V("--c2"),0.05), borderRadius:5, lineHeight:1.4 }}>
            <IconoInline nombre="formula"/>(pendiente − reserva imp.{pct > 0 ? ` − ${pct.toFixed(2)}% del extra` : ""}) ÷ {Math.max(0, 10-mesNum)} aportaciones (hasta noviembre)
          </div>

          {/* Automatismo: crear gasto de ahorro con esta aportación (redondeada a 50€) */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            marginTop:8, padding:"8px 10px", background:mix(V("--accent"),0.06), borderRadius:8 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, color:V("--text-mid") }}>
                <IconoInline nombre="auto"/>Crear gasto automático
              </div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginTop:1 }}>
                añade un ahorro = esta cifra redondeada a 50€
              </div>
            </div>
            <button onClick={() => onUpdateDatos(d => { d.autoReservaAnual = !d.autoReservaAnual; })} style={{
              padding:"4px 12px", borderRadius:16, border:"none", cursor:"pointer", fontSize:11,
              fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
              background: datos.autoReservaAnual ? mix(V("--accent"),0.25) : V("--surface-2"),
              color: datos.autoReservaAnual ? V("--accent") : V("--text-dim"),
            }}>{datos.autoReservaAnual ? "ON" : "OFF"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function VistaGastos({ datos, claveM, mesNum, onUpdateDatos }) {
  const [subGasto, setSubGasto] = useState("mensuales");
  const [seccionAbierta, setSeccionAbierta] = useState({ fijos:true, variables:true, ahorro:true, puntuales:true });
  const [anadiendo, setAnadiendo] = useState(null);

  const fijos = gastosFijosDeMes(datos, claveM);
  const variables = gastosVariablesDeMes(datos, claveM);
  const ahorro = gastosAhorroDeMes(datos, claveM);
  const puntuales = gastosPuntualesDeMes(datos, claveM);

  const { fijos:tFijos, vars:tVars, ahorro:tAhorro, puntuales:tPunt, total:tGastos } = calcularGastoMensualTotal(datos, claveM);
  const totalPagado = calcularPagadoMes(datos, claveM);
  const totalIngresos = calcularIngresosMes(datos, claveM);
  const remanente = totalIngresos - tGastos;

  // ─── HANDLERS ───
  // Pagado solo afecta al mes
  const togglePagado = (campoPagos, gastoId) => onUpdateDatos(d => {
    if (!d.meses[claveM]) d.meses[claveM] = estadoMesVacio();
    d.meses[claveM][campoPagos][gastoId] = !d.meses[claveM][campoPagos][gastoId];
  });

  // Cambio de importe/banco modifica catálogo global
  const cambiarCatalogoGasto = (catalogo, gastoId, campo, valor) => onUpdateDatos(d => {
    d[catalogo] = d[catalogo].map(g => g.id === gastoId ? { ...g, [campo]: valor } : g);
  });

  // Eliminar del catálogo
  const eliminarDelCatalogo = (catalogo, gastoId) => onUpdateDatos(d => {
    d[catalogo] = d[catalogo].filter(g => g.id !== gastoId);
  });

  // Añadir al catálogo
  const añadirAlCatalogo = (catalogo, data) => {
    const nuevoId = `${catalogo}-${Date.now()}`;  // id generado UNA vez (el wrapper aplica fn varias veces)
    onUpdateDatos(d => {
      d[catalogo].push({ ...data, id: nuevoId });
    });
    setAnadiendo(null);
  };

  // Puntuales — solo del mes
  const togglePuntual = (idx) => onUpdateDatos(d => {
    if (!d.meses[claveM]) d.meses[claveM] = estadoMesVacio();
    d.meses[claveM].puntuales[idx].pagado = !d.meses[claveM].puntuales[idx].pagado;
  });
  const cambiarPuntual = (idx, campo, valor) => onUpdateDatos(d => {
    if (!d.meses[claveM]) d.meses[claveM] = estadoMesVacio();
    d.meses[claveM].puntuales[idx][campo] = valor;
  });
  const eliminarPuntual = (idx) => onUpdateDatos(d => {
    if (d.meses[claveM]) d.meses[claveM].puntuales.splice(idx, 1);
  });
  const añadirPuntual = (data) => {
    const nuevoId = `punt-${Date.now()}`;
    onUpdateDatos(d => {
      if (!d.meses[claveM]) d.meses[claveM] = estadoMesVacio();
      d.meses[claveM].puntuales.push({ ...data, id: nuevoId, pagado:false });
    });
    setAnadiendo(null);
  };

  const Section = ({ id, titulo, icono, total, children }) => (
    <div style={{ background:V("--surface"), borderRadius:14, marginBottom:10,
      border:`1px solid ${V("--border")}`, overflow:"hidden" }}>
      <div onClick={() => setSeccionAbierta(s => ({...s,[id]:!s[id]}))}
        style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"12px 14px", cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Icono nombre={icono} size={17} color={V("--text-mid")}/>
          <span style={{ fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase" }}>{titulo}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Num v={total} decimals={2} color={V("--c3")} size={13}/>
          <span style={{ color:V("--text-dim"), fontSize:12 }}>{seccionAbierta[id] ? "▲" : "▼"}</span>
        </div>
      </div>
      {seccionAbierta[id] && <div style={{ padding:"0 14px 12px" }}>{children}</div>}
    </div>
  );

  return (
    <div className="slide-in">
      {/* Prorrateo de gastos anuales — fijo arriba en ambas sub-pestañas */}
      <BloqueAportacionAnual datos={datos} claveM={claveM} mesNum={mesNum} onUpdateDatos={onUpdateDatos}/>

      {/* Sub-pestañas Mensuales / Anuales */}
      <div style={{ display:"flex", gap:6, marginBottom:14,
        background:V("--surface"), borderRadius:12, padding:4,
        border:`1px solid ${V("--border")}` }}>
        {[
          { id:"mensuales", icono:"gastos", label:"Mensuales" },
          { id:"anuales",   icono:"calendario", label:"Anuales" },
        ].map(s => (
          <button key={s.id} onClick={() => setSubGasto(s.id)} style={{
            flex:1, padding:"9px 6px", borderRadius:9, border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            background: subGasto === s.id ? mix(V("--accent"), "20") : "transparent",
            fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:700,
            color: subGasto === s.id ? V("--accent") : V("--text-dim"),
            transition:"all 0.2s",
          }}>
            <Icono nombre={s.icono} size={16} color="currentColor"/> {s.label}
          </button>
        ))}
      </div>

      {subGasto === "mensuales" && <div>
      {/* Resumen */}
      <div style={{ background:V("--surface"), borderRadius:18, padding:"16px 18px",
        border:`1px solid ${V("--border")}`, marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <Icono nombre="resumen" size={17} color={V("--text-mid")}/>
          <span style={{ fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase" }}>Resumen del mes</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
          {[
            { label:"Gastos", v:tGastos,    color:V("--c3") },
            { label:"Pagado", v:totalPagado,color:V("--accent") },
            { label:"Remanente", v:remanente,color: remanente >= 0 ? V("--accent") : V("--negative") },
          ].map(({ label, v, color }) => (
            <div key={label} style={{ textAlign:"center", background:V("--surface-2"), borderRadius:10, padding:"10px 4px" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:600, color }}>
                {v.toLocaleString("es-ES",{minimumFractionDigits:0})}€
              </div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginTop:3 }}>{label}</div>
            </div>
          ))}
        </div>
        <BarraProgreso valor={totalPagado} maximo={tGastos||1} color={V("--accent")} altura={6}/>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:V("--text-dim"), marginTop:6, textAlign:"center" }}>
          {tGastos > 0 ? ((totalPagado/tGastos)*100).toFixed(0) : 0}% pagado · ingresos {totalIngresos.toLocaleString("es-ES",{minimumFractionDigits:0})}€
        </div>
      </div>

      <div style={{ background:mix(V("--warn"),0.05), border:`1px solid ${mix(V("--warn"),0.15)}`,
        borderRadius:10, padding:"8px 12px", marginBottom:10,
        fontFamily:"'Inter',sans-serif", fontSize:10, color:V("--warn"), lineHeight:1.5 }}>
        ℹ️ Editar importe/banco cambia el catálogo global. Los checks de pagado son del mes y quedan registrados como histórico.
      </div>

      {/* FIJOS */}
      <Section id="fijos" titulo="Gastos Fijos" icono="inmueble" total={tFijos}>
        {fijos.length === 0 && (
          <div style={{ padding:"12px 0", textAlign:"center", fontFamily:"'Inter',sans-serif",
            fontSize:12, color:V("--text-dim"), fontStyle:"italic" }}>Sin gastos fijos activos</div>
        )}
        {fijos.map(g => (
          <FilaGastoCatalogo key={g.id} gasto={g}
            onPagado={() => togglePagado("pagosFijos", g.id)}
            onImporte={v => cambiarCatalogoGasto("catalogoFijos", g.id, "importe", v)}
            onBanco={b => cambiarCatalogoGasto("catalogoFijos", g.id, "banco", b)}
            onEliminar={() => eliminarDelCatalogo("catalogoFijos", g.id)}
          />
        ))}
        {anadiendo === "fijos" ? (
          <FormularioAnadirGasto tipo="fijo"
            onGuardar={d => añadirAlCatalogo("catalogoFijos", d)}
            onCancelar={() => setAnadiendo(null)} colorAccion={V("--accent")}/>
        ) : (
          <BotonAnadir onClick={() => setAnadiendo("fijos")} label="Añadir gasto fijo" color={V("--accent")}/>
        )}
      </Section>

      {/* VARIABLES */}
      <Section id="variables" titulo="Gastos Variables" icono="movil" total={tVars}>
        {variables.length === 0 && (
          <div style={{ padding:"12px 0", textAlign:"center", fontFamily:"'Inter',sans-serif",
            fontSize:12, color:V("--text-dim"), fontStyle:"italic" }}>Sin gastos variables activos</div>
        )}
        {variables.map(g => (
          <FilaGastoCatalogo key={g.id} gasto={g}
            onPagado={() => togglePagado("pagosVariables", g.id)}
            onImporte={v => cambiarCatalogoGasto("catalogoVariables", g.id, "importe", v)}
            onBanco={b => cambiarCatalogoGasto("catalogoVariables", g.id, "banco", b)}
            onEliminar={() => eliminarDelCatalogo("catalogoVariables", g.id)}
          />
        ))}
        {anadiendo === "variables" ? (
          <FormularioAnadirGasto tipo="variable"
            onGuardar={d => añadirAlCatalogo("catalogoVariables", d)}
            onCancelar={() => setAnadiendo(null)} colorAccion={V("--c2")}/>
        ) : (
          <BotonAnadir onClick={() => setAnadiendo("variables")} label="Añadir gasto variable" color={V("--c2")}/>
        )}
      </Section>

      {/* AHORRO */}
      <Section id="ahorro" titulo="Ahorro" icono="ahorro" total={tAhorro}>
        {ahorro.length === 0 && (
          <div style={{ padding:"12px 0", textAlign:"center", fontFamily:"'Inter',sans-serif",
            fontSize:12, color:V("--text-dim"), fontStyle:"italic" }}>Sin partidas de ahorro activas</div>
        )}
        {ahorro.map(g => (
          <FilaGastoCatalogo key={g.id} gasto={g}
            onPagado={() => togglePagado("pagosAhorro", g.id)}
            onImporte={v => cambiarCatalogoGasto("catalogoAhorro", g.id, "importe", v)}
            onBanco={b => {
              if (g.id === "auto-reserva-anual") onUpdateDatos(d => { d.autoReservaBanco = b; });
              else if (g.id === "auto-objetivos") onUpdateDatos(d => { d.autoObjetivosBanco = b; });
              else cambiarCatalogoGasto("catalogoAhorro", g.id, "banco", b);
            }}
            onEliminar={() => eliminarDelCatalogo("catalogoAhorro", g.id)}
          />
        ))}
        {/* Control del automatismo de reserva anual */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          marginTop:8, padding:"8px 10px", borderRadius:8,
          background: datos.autoReservaAnual ? mix(V("--accent"),0.06) : "rgba(255,255,255,0.02)" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, color:V("--text-mid") }}>
              <IconoInline nombre="auto"/>Reserva anual automática
            </div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginTop:1 }}>
              añade el prorrateo (redondeado a 50€) como ahorro
            </div>
          </div>
          <button onClick={() => onUpdateDatos(d => { d.autoReservaAnual = !d.autoReservaAnual; })} style={{
            padding:"4px 12px", borderRadius:16, border:"none", cursor:"pointer", fontSize:11,
            fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
            background: datos.autoReservaAnual ? mix(V("--accent"),0.25) : V("--surface-2"),
            color: datos.autoReservaAnual ? V("--accent") : V("--text-dim"),
          }}>{datos.autoReservaAnual ? "ON" : "OFF"}</button>
        </div>

        {anadiendo === "ahorro" ? (
          <FormularioAnadirGasto tipo="ahorro"
            onGuardar={d => añadirAlCatalogo("catalogoAhorro", d)}
            onCancelar={() => setAnadiendo(null)} colorAccion={V("--c3")}/>
        ) : (
          <BotonAnadir onClick={() => setAnadiendo("ahorro")} label="Añadir partida de ahorro" color={V("--c3")}/>
        )}
      </Section>

      {/* PUNTUALES */}
      <Section id="puntuales" titulo="Gastos Puntuales" icono="auto" total={tPunt}>
        {puntuales.length === 0 && (
          <div style={{ padding:"12px 0", textAlign:"center", fontFamily:"'Inter',sans-serif",
            fontSize:12, color:V("--text-dim"), fontStyle:"italic" }}>Sin gastos puntuales este mes</div>
        )}
        {puntuales.map((g, i) => (
          <FilaGastoCatalogo key={g.id} gasto={g}
            onPagado={() => togglePuntual(i)}
            onImporte={v => cambiarPuntual(i, "importe", v)}
            onBanco={b => cambiarPuntual(i, "banco", b)}
            onEliminar={() => eliminarPuntual(i)}
          />
        ))}
        {anadiendo === "puntuales" ? (
          <FormularioAnadirGasto tipo="puntual" onGuardar={añadirPuntual}
            onCancelar={() => setAnadiendo(null)} colorAccion={V("--c4")}/>
        ) : (
          <BotonAnadir onClick={() => setAnadiendo("puntuales")} label="Añadir gasto puntual" color={V("--c4")}/>
        )}
      </Section>
      </div>}

      {subGasto === "anuales" && <div>
        <VistaAnuales datos={datos} claveM={claveM} onUpdateDatos={onUpdateDatos}/>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// VISTA ANUALES — por bloques, conceptos editables
// ═══════════════════════════════════════════════════════

function VistaAnuales({ datos, claveM, onUpdateDatos }) {
  const [anadiendoConceptoEn, setAnadiendoConceptoEn] = useState(null);  // categoria id
  const [anadiendoBloque, setAnadiendoBloque] = useState(false);

  // Datos efectivos: si el mes está cerrado, usa el snapshot
  const dEf = datosEfectivosMes(datos, claveM);

  const totalAño = totalAnualesYear(dEf);
  const totalPagado = totalAnualesPagado(dEf);
  const totalPendiente = totalAño - totalPagado;

  const añoCatalogo = dEf.anuales.año;
  const añoAhora = añoActual();

  const setConceptoImporte = (categoria, conceptoId, valor) => onUpdateDatos(d => {
    const conceptos = d.anuales.catalogo[categoria].conceptos;
    const idx = conceptos.findIndex(c => c.id === conceptoId);
    if (idx >= 0) {
      conceptos[idx].importe = valor;
      // Si pagado >= nuevo importe, marcar como cerrado
      if ((conceptos[idx].pagado || 0) >= valor && valor > 0) {
        conceptos[idx].cerrado = true;
        conceptos[idx].pagado = valor;
      } else if (conceptos[idx].cerrado) {
        // Si estaba cerrado y cambias importe a uno mayor, sigue como cerrado pero al nuevo importe
        conceptos[idx].pagado = valor;
      }
    }
  });

  const setConceptoNombre = (categoria, conceptoId, nombre) => onUpdateDatos(d => {
    const conceptos = d.anuales.catalogo[categoria].conceptos;
    const idx = conceptos.findIndex(c => c.id === conceptoId);
    if (idx >= 0) conceptos[idx].nombre = nombre;
  });

  // Editar el importe pagado parcial
  const setConceptoPagado = (categoria, conceptoId, valor) => onUpdateDatos(d => {
    const conceptos = d.anuales.catalogo[categoria].conceptos;
    const idx = conceptos.findIndex(c => c.id === conceptoId);
    if (idx >= 0) {
      const importe = conceptos[idx].importe || 0;
      conceptos[idx].pagado = Math.min(valor, importe);  // no permitir pagar más que el total
      // Si llega al total, se cierra automáticamente
      if (conceptos[idx].pagado >= importe && importe > 0) {
        conceptos[idx].cerrado = true;
        if (!conceptos[idx].mesPago) conceptos[idx].mesPago = claveM;
      } else {
        conceptos[idx].cerrado = false;
        delete conceptos[idx].mesPago;
      }
    }
  });

  // Toggle del check de cerrado (pagado al 100%)
  const toggleConceptoCerrado = (categoria, conceptoId) => onUpdateDatos(d => {
    const conceptos = d.anuales.catalogo[categoria].conceptos;
    const idx = conceptos.findIndex(c => c.id === conceptoId);
    if (idx >= 0) {
      const c = conceptos[idx];
      if (c.cerrado) {
        // Desmarcar: deja el pagado tal como esté (puede que parcialmente)
        c.cerrado = false;
        delete c.mesPago;
        // Si seguía a 100%, lo bajamos un poco para que la lógica de "ya pagado del todo" no se vuelva a disparar
        if ((c.pagado || 0) >= (c.importe || 0)) {
          c.pagado = Math.max(0, (c.importe || 0) - 0.01);
        }
      } else {
        // Marcar como cerrado: pagado = importe total
        c.cerrado = true;
        c.pagado = c.importe || 0;
        c.mesPago = claveM;
      }
    }
  });

  const eliminarConcepto = (categoria, conceptoId) => onUpdateDatos(d => {
    d.anuales.catalogo[categoria].conceptos =
      d.anuales.catalogo[categoria].conceptos.filter(c => c.id !== conceptoId);
  });

  const añadirConcepto = (categoria, data) => {
    const nuevoId = `concepto-${Date.now()}`;  // id único generado fuera del fn
    onUpdateDatos(d => {
      d.anuales.catalogo[categoria].conceptos.push({
        ...data, id: nuevoId, pagado: 0, cerrado: false,
      });
    });
    setAnadiendoConceptoEn(null);
  };

  const eliminarBloque = (categoria) => onUpdateDatos(d => {
    delete d.anuales.catalogo[categoria];
  });

  const añadirBloque = (nombre) => {
    onUpdateDatos(d => {
      d.anuales.catalogo[nombre] = { icono:"carpeta", conceptos:[] };
    });
    setAnadiendoBloque(false);
  };

  const reiniciarAño = () => {
    if (!confirm(`¿Reiniciar gastos anuales a ${añoAhora}? Se mantendrán los bloques y conceptos pero los pagos volverán a cero.`)) return;
    onUpdateDatos(d => {
      d.anuales.año = añoAhora;
      // Reset de pagos
      Object.values(d.anuales.catalogo).forEach(cat => {
        cat.conceptos.forEach(c => {
          c.pagado = 0;
          c.cerrado = false;
          delete c.mesPago;
        });
      });
    });
  };

  return (
    <div className="slide-in">
      {/* Resumen */}
      <div style={{ background:V("--surface"), borderRadius:18, padding:"16px 18px",
        border:`1px solid ${V("--border")}`, marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase" }}>
            Gastos anuales {añoCatalogo}
          </div>
          {añoCatalogo < añoAhora && (
            <button onClick={reiniciarAño} style={{
              padding:"4px 10px", borderRadius:6, border:`1px solid ${mix(V("--warn"),"50")}`,
              background:mix(V("--warn"),"15"), color:V("--warn"), cursor:"pointer", fontSize:10,
              fontFamily:"'Inter',sans-serif", fontWeight:600,
            }}>⟳ Reiniciar a {añoAhora}</button>
          )}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
          {[
            { label:"Total año", v:totalAño,       color:V("--text-mid") },
            { label:"Pagado",    v:totalPagado,    color:V("--accent") },
            { label:"Pendiente", v:totalPendiente, color:V("--c4") },
          ].map(({ label, v, color }) => (
            <div key={label} style={{ textAlign:"center", background:V("--surface-2"), borderRadius:10, padding:"10px 4px" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:600, color }}>
                {v.toLocaleString("es-ES",{minimumFractionDigits:0})}€
              </div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginTop:3 }}>{label}</div>
            </div>
          ))}
        </div>
        <BarraProgreso valor={totalPagado} maximo={totalAño||1} color={V("--accent")} altura={5}/>
      </div>

      {/* Bloques */}
      {Object.entries(dEf.anuales.catalogo).map(([cat, info]) => {
        const total = totalCategoriaAnual(info);
        const pagado = pagadoCategoriaAnual(dEf, cat);
        const pendiente = total - pagado;

        return (
          <div key={cat} style={{ background:V("--surface"), borderRadius:14,
            border:`1px solid ${V("--border")}`, marginBottom:10, overflow:"hidden" }}>
            <div style={{ padding:"12px 14px" }}>
              {/* Cabecera */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <Icono nombre={info.icono} size={16} color={V("--text-mid")}/>
                  <span style={{ fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase" }}>{cat}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Num v={total} decimals={0} color={V("--text-mid")} size={13}/>
                  <button onClick={() => {
                    if (confirm(`¿Eliminar el bloque "${cat}" entero?`)) eliminarBloque(cat);
                  }} style={{ background:"none", border:"none", color:mix(V("--negative"),"60"),
                    cursor:"pointer", fontSize:14 }}>×</button>
                </div>
              </div>
              <BarraProgreso valor={pagado} maximo={total||1} color={V("--accent")} altura={4}/>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:V("--accent") }}>
                  pagado {pagado.toLocaleString("es-ES",{minimumFractionDigits:0})}€
                </span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:V("--c4") }}>
                  pendiente {pendiente.toLocaleString("es-ES",{minimumFractionDigits:0})}€
                </span>
              </div>

              {/* Conceptos con checkbox de pagado */}
              <div style={{ marginTop:12, padding:"6px 8px", background:"rgba(255,255,255,0.02)", borderRadius:8 }}>
                {info.conceptos.map(c => (
                  <FilaConcepto key={c.id} concepto={c}
                    onCerrado={() => toggleConceptoCerrado(cat, c.id)}
                    onPagadoImporte={v => setConceptoPagado(cat, c.id, v)}
                    onNombre={n => setConceptoNombre(cat, c.id, n)}
                    onImporte={v => setConceptoImporte(cat, c.id, v)}
                    onEliminar={() => eliminarConcepto(cat, c.id)}
                  />
                ))}
                {anadiendoConceptoEn === cat ? (
                  <FormularioAnadirConcepto
                    onGuardar={d => añadirConcepto(cat, d)}
                    onCancelar={() => setAnadiendoConceptoEn(null)}/>
                ) : (
                  <button onClick={() => setAnadiendoConceptoEn(cat)} style={{
                    background:"none", border:"none", color:V("--text-dim"), cursor:"pointer",
                    fontFamily:"'Inter',sans-serif", fontSize:10, padding:"4px 0", marginTop:2,
                  }}>+ añadir concepto</button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Añadir bloque */}
      {anadiendoBloque ? (
        <FormularioAnadirBloque
          onGuardar={añadirBloque}
          onCancelar={() => setAnadiendoBloque(false)}/>
      ) : (
        <BotonAnadir onClick={() => setAnadiendoBloque(true)} label="Añadir nuevo bloque" color={V("--c3")}/>
      )}
    </div>
  );
}

function FilaConcepto({ concepto, onCerrado, onPagadoImporte, onNombre, onImporte, onEliminar }) {
  const [editando, setEditando] = useState(false);
  const pagado = concepto.pagado || 0;
  const importe = concepto.importe || 0;
  const cerrado = concepto.cerrado || false;
  const pendiente = Math.max(0, importe - pagado);
  const pct = importe > 0 ? Math.min(100, (pagado / importe) * 100) : 0;

  return (
    <div style={{ padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
      {/* Fila principal: check, nombre, importe total */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
        {/* Checkbox de cerrado (pagado al 100%) */}
        <button onClick={onCerrado} style={{
          width:16, height:16, borderRadius:4, flexShrink:0, cursor:"pointer",
          border: cerrado ? "none" : "1.5px solid rgba(255,255,255,0.2)",
          background: cerrado ? V("--accent") : "transparent",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {cerrado && <span style={{ fontSize:9, color:V("--bg"), fontWeight:900 }}>✓</span>}
        </button>

        {editando ? (
          <input value={concepto.nombre}
            onChange={e => onNombre(e.target.value)}
            onBlur={() => setEditando(false)}
            autoFocus
            style={{ flex:1, background:V("--border"), border:"1px solid rgba(255,255,255,0.15)",
              borderRadius:5, padding:"2px 6px", color:V("--text"), fontSize:11, outline:"none",
              fontFamily:"'Inter',sans-serif" }}
          />
        ) : (
          <span onClick={() => setEditando(true)} style={{
            flex:1, fontFamily:"'Inter',sans-serif", fontSize:11,
            color: cerrado ? V("--accent") : V("--text-mid"),
            textDecoration: cerrado ? "line-through" : "none",
            opacity: cerrado ? 0.7 : 1,
            cursor:"pointer", minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>
            {concepto.nombre}
            {cerrado && concepto.mesPago && (
              <span style={{ fontSize:8, color:V("--accent"), marginLeft:5, opacity:0.8 }}>
                {concepto.mesPago}
              </span>
            )}
          </span>
        )}
        <InputMoneda valor={importe} onChange={onImporte} compact ancho={45}/>
        <button onClick={onEliminar} style={{ background:"none", border:"none",
          cursor:"pointer", color:mix(V("--negative"),"60"), fontSize:13, padding:"0 4px" }}>×</button>
      </div>

      {/* Sub-fila: pagado parcial + barra de progreso (solo si no está cerrado) */}
      {!cerrado && (
        <div style={{ display:"flex", alignItems:"center", gap:8, paddingLeft:22 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:V("--text-dim"), minWidth:42 }}>
            pagado
          </span>
          <InputMoneda valor={pagado} onChange={onPagadoImporte} compact ancho={45}/>
          <div style={{ flex:1, minWidth:0 }}>
            <BarraProgreso valor={pagado} maximo={importe || 1} color={V("--accent")} altura={3}/>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:2 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:V("--text-dim") }}>
                {pct.toFixed(0)}%
              </span>
              {pendiente > 0 && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:V("--warn") }}>
                  faltan {pendiente.toLocaleString("es-ES",{minimumFractionDigits:0})}€
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormularioAnadirConcepto({ onGuardar, onCancelar }) {
  const [nombre, setNombre]   = useState("");
  const [importe, setImporte] = useState(0);
  return (
    <div style={{ display:"flex", gap:4, marginTop:6, alignItems:"center" }}>
      <input placeholder="Concepto" value={nombre}
        onChange={e => setNombre(e.target.value)}
        style={{ flex:1, background:V("--border"), border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:5, padding:"4px 8px", color:V("--text"), fontSize:11, outline:"none",
          fontFamily:"'Inter',sans-serif" }}
      />
      <InputMoneda valor={importe} onChange={setImporte} compact ancho={50}/>
      <button onClick={() => { if (nombre.trim()) onGuardar({ nombre: nombre.trim(), importe }); }} style={{
        background:V("--accent"), color:V("--bg"), border:"none", borderRadius:5,
        padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"'Inter',sans-serif",
      }}>✓</button>
      <button onClick={onCancelar} style={{
        background:V("--border"), color:V("--text-dim"), border:"none", borderRadius:5,
        padding:"4px 6px", cursor:"pointer", fontSize:11,
      }}>✕</button>
    </div>
  );
}

function FormularioAnadirBloque({ onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState("");
  return (
    <div style={{ marginTop:8, padding:"10px", background:"rgba(255,255,255,0.03)", borderRadius:10,
      border:"1px solid rgba(255,255,255,0.08)" }}>
      <input placeholder="Nombre del bloque (ej. MASCOTAS)" value={nombre}
        onChange={e => setNombre(e.target.value.toUpperCase())}
        style={{ width:"100%", background:V("--border"), border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:6, padding:"6px 10px", color:V("--text"), fontSize:13, outline:"none",
          fontFamily:"'Inter',sans-serif", marginBottom:8 }}
      />
      <div style={{ display:"flex", gap:6 }}>
        <button onClick={() => { if (nombre.trim()) onGuardar(nombre.trim()); }} style={{
          flex:1, background:V("--c3"), color:V("--bg"), border:"none", borderRadius:6,
          fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer", padding:"6px",
        }}>Crear bloque</button>
        <button onClick={onCancelar} style={{
          padding:"0 10px", background:V("--border"), color:V("--text-dim"),
          border:"none", borderRadius:6, cursor:"pointer", fontSize:12,
        }}>✕</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// VISTA INVERSIONES
// ═══════════════════════════════════════════════════════

function FilaInversion({ inv, onUpdate, onEliminar }) {
  const { invertido, valorActual, plusvalia, pctPlusvalia, soloValor } = calcularPosicion(inv);
  const tipo = TIPOS_ACTIVO[inv.tipo] || TIPOS_ACTIVO.fondo;
  const ganando = plusvalia >= 0;
  const [editandoMeta, setEditandoMeta] = useState(false);

  return (
    <div style={{
      background:V("--surface"), borderRadius:12,
      border:`1px solid ${tipo.color}25`, padding:"12px 14px", marginBottom:8,
      position:"relative", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background: tipo.color }}/>

      {/* Cabecera: tipo + nombre + editar/borrar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
            <span style={{
              fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
              color: tipo.color, background: tipo.color+"20",
              padding:"2px 6px", borderRadius:4,
            }}><span style={{display:"inline-flex",verticalAlign:"middle",marginRight:4}}><Icono nombre={tipo.icono} size={13} color="currentColor"/></span>{tipo.label}</span>
            {inv.entidad && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color:V("--text-dim"), fontWeight:600 }}>{inv.entidad}</span>
            )}
          </div>
          {editandoMeta ? (
            <input value={inv.nombre} placeholder="Nombre"
              onChange={e => onUpdate({ ...inv, nombre: e.target.value })}
              onBlur={() => setEditandoMeta(false)}
              autoFocus
              style={{ width:"100%", background:V("--border"),
                border:"1px solid rgba(255,255,255,0.15)", borderRadius:5,
                padding:"3px 6px", color:V("--text"), fontSize:13, outline:"none",
                fontFamily:"'Inter',sans-serif" }}
            />
          ) : (
            <div onClick={() => setEditandoMeta(true)} style={{
              fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600,
              color:V("--text-mid"), overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              cursor:"pointer",
            }}>
              {inv.nombre}
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={() => setEditandoMeta(m => !m)} style={{
            background:V("--border"), border:"none",
            color:V("--text-dim"), cursor:"pointer", fontSize:11, padding:"2px 6px", borderRadius:4,
          }}>{editandoMeta ? <Icono nombre="check" size={14} color={V("--accent")}/> : <Icono nombre="lapiz" size={14} color={V("--text-dim")}/>}</button>
          <button onClick={onEliminar} style={{
            background:"none", border:"none", color:mix(V("--negative"),"60"),
            cursor:"pointer", fontSize:16, padding:"0 2px",
          }}>×</button>
        </div>
      </div>

      {/* Selector de tipo (solo en edición) */}
      {editandoMeta && (
        <div style={{ marginBottom:10 }}>
          <input value={inv.entidad || ""} placeholder="Entidad (ej. HNA, MyInvestor, Trade)"
            onChange={e => onUpdate({ ...inv, entidad: e.target.value })}
            style={{ width:"100%", background:V("--border"),
              border:"1px solid rgba(255,255,255,0.1)", borderRadius:6,
              padding:"6px 10px", color:V("--text"), fontSize:12, outline:"none",
              fontFamily:"'JetBrains Mono',monospace", marginBottom:6 }}
          />
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {Object.entries(TIPOS_ACTIVO).map(([id, t]) => (
              <button key={id} onClick={() => onUpdate({ ...inv, tipo: id })} style={{
                padding:"3px 8px", borderRadius:6, border:"none", cursor:"pointer", fontSize:10,
                fontFamily:"'Inter',sans-serif", fontWeight:600,
                background: inv.tipo === id ? mix(t.color, "25") : V("--surface-2"),
                color: inv.tipo === id ? t.color : V("--text-dim"),
              }}>{t.icono} {t.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Métricas principales */}
      {soloValor ? (
        // Planes/pensión: sólo posición del fondo
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:V("--text-dim"), marginBottom:2 }}>
              posición del fondo
            </div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, color: tipo.color }}>
              {valorActual.toLocaleString("es-ES",{minimumFractionDigits:2})}€
            </div>
          </div>
          <InputMoneda valor={inv.valorActual} onChange={v => onUpdate({ ...inv, valorActual: v })} compact ancho={75}/>
        </div>
      ) : (
        // Resto: invertido + valor actual + plusvalía
        <>
          {/* Cabeceras y campos editables inline */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
            <div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginBottom:3 }}>
                Inversión inicial
              </div>
              <InputMoneda valor={inv.invertido} onChange={v => onUpdate({ ...inv, invertido: v })} compact ancho={75}/>
            </div>
            <div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginBottom:3 }}>
                Posición actual
              </div>
              <InputMoneda valor={inv.valorActual} onChange={v => onUpdate({ ...inv, valorActual: v })} compact ancho={75}/>
            </div>
          </div>

          {/* Plusvalía */}
          <div style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"8px 10px", borderRadius:6,
            background: ganando ? mix(V("--accent"),0.08) : mix(V("--negative"),0.08),
            border: `1px solid ${ganando ? mix(V("--accent"),"20") : mix(V("--negative"),"20")}`,
          }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-dim") }}>
              plusvalía
            </span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700,
                color: ganando ? V("--accent") : V("--negative") }}>
                {ganando ? "+" : ""}{plusvalia.toLocaleString("es-ES",{minimumFractionDigits:2})}€
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:600,
                color: ganando ? V("--accent") : V("--negative"), opacity:0.8 }}>
                {ganando ? "+" : ""}{pctPlusvalia.toFixed(2)}%
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FormularioAnadirInversion({ onGuardar, onCancelar }) {
  const [nombre, setNombre]           = useState("");
  const [entidad, setEntidad]         = useState("");
  const [tipo, setTipo]               = useState("fondo");
  const [invertido, setInvertido]     = useState(0);
  const [valorActual, setValorActual] = useState(0);

  const tipoMeta = TIPOS_ACTIVO[tipo];
  const soloValor = tipoMeta && tipoMeta.soloValor;

  const guardar = () => {
    if (!nombre.trim()) return;
    onGuardar({
      id: `inv-${Date.now()}`,
      nombre: nombre.trim(),
      entidad: entidad.trim() || null,
      tipo,
      invertido: soloValor ? 0 : invertido,
      valorActual,
    });
  };

  return (
    <div style={{ marginTop:8, padding:"14px", background:"rgba(255,255,255,0.03)", borderRadius:12,
      border:"1px solid rgba(255,255,255,0.08)" }}>
      <input placeholder="Nombre del activo o fondo" value={nombre}
        onChange={e => setNombre(e.target.value)}
        style={{ width:"100%", background:V("--border"), border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:8, padding:"8px 10px", color:V("--text"), fontSize:13, outline:"none",
          fontFamily:"'Inter',sans-serif", marginBottom:8 }}/>
      <input placeholder="Entidad (ej. HNA, MyInvestor, Trade…)" value={entidad}
        onChange={e => setEntidad(e.target.value)}
        style={{ width:"100%", background:V("--border"), border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:8, padding:"8px 10px", color:V("--text"), fontSize:13, outline:"none",
          fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}/>

      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:10 }}>
        {Object.entries(TIPOS_ACTIVO).map(([id, t]) => (
          <button key={id} onClick={() => setTipo(id)} style={{
            padding:"4px 10px", borderRadius:6, border:"none", cursor:"pointer", fontSize:11,
            fontFamily:"'Inter',sans-serif", fontWeight:600,
            background: tipo === id ? mix(t.color, "25") : V("--surface-2"),
            color: tipo === id ? t.color : V("--text-dim"),
          }}>{t.icono} {t.label}</button>
        ))}
      </div>

      {soloValor ? (
        // Planes/pensión: sólo posición
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:V("--text-dim"), marginBottom:3 }}>
            Posición del fondo
          </div>
          <InputMoneda valor={valorActual} onChange={setValorActual} compact ancho={80}/>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
          <div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:V("--text-dim"), marginBottom:3 }}>
              Inversión inicial
            </div>
            <InputMoneda valor={invertido} onChange={setInvertido} compact ancho={75}/>
          </div>
          <div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:V("--text-dim"), marginBottom:3 }}>
              Posición actual
            </div>
            <InputMoneda valor={valorActual} onChange={setValorActual} compact ancho={75}/>
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:8 }}>
        <button onClick={guardar} style={{
          flex:1, background:V("--accent"), color:V("--bg"), border:"none", borderRadius:8,
          fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", padding:"8px",
        }}>Añadir</button>
        <button onClick={onCancelar} style={{
          padding:"0 14px", background:V("--border"), color:V("--text-dim"),
          border:"none", borderRadius:8, cursor:"pointer", fontSize:13,
        }}>✕</button>
      </div>
    </div>
  );
}

function VistaInversiones({ datos, claveM, onUpdateDatos }) {
  const [anadiendo, setAnadiendo] = useState(false);
  // Datos efectivos: si el mes tiene snapshot, las inversiones vienen de ahí
  const dEf = claveM ? datosEfectivosMes(datos, claveM) : datos;
  const inversiones = dEf.inversiones || [];
  const total = calcularTotalCartera(inversiones);
  const ganando = total.plusvalia >= 0;
  const pctTotal = total.invertido > 0 ? (total.plusvalia / total.invertido) * 100 : 0;

  const porTipo = {};
  Object.keys(TIPOS_ACTIVO).forEach(t => { porTipo[t] = { invertido:0, valorActual:0 }; });
  inversiones.forEach(inv => {
    const { invertido, valorActual } = calcularPosicion(inv);
    if (porTipo[inv.tipo]) {
      porTipo[inv.tipo].invertido   += invertido;
      porTipo[inv.tipo].valorActual += valorActual;
    }
  });

  const actualizarInv = (id, nuevo) => onUpdateDatos(d => {
    d.inversiones = (d.inversiones || []).map(i => i.id === id ? nuevo : i);
  });
  const eliminarInv = (id) => onUpdateDatos(d => {
    d.inversiones = (d.inversiones || []).filter(i => i.id !== id);
  });
  const añadirInv = (nueva) => {
    onUpdateDatos(d => { d.inversiones = [...(d.inversiones || []), nueva]; });
    setAnadiendo(false);
  };

  return (
    <div className="slide-in">
      <div style={{
        background: ganando
          ? `linear-gradient(135deg, ${mix(V("--accent"),"20")}, ${mix(V("--c2"),"15")})`
          : `linear-gradient(135deg, ${mix(V("--negative"),"20")}, ${mix(V("--negative"),"15")})`,
        border: `1px solid ${ganando ? mix(V("--accent"),"30") : mix(V("--negative"),"30")}`,
        borderRadius:18, padding:"18px 20px", marginBottom:14,
      }}>
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:700,
          color: ganando ? V("--accent") : V("--negative"), letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>
          <IconoInline nombre="inversiones"/>Cartera total
        </div>
        <div style={{ fontFamily:SERIF, fontSize:34, fontWeight:700,
          color: ganando ? V("--accent") : V("--negative"), letterSpacing:"-0.02em" }}>
          {total.valorActual.toLocaleString("es-ES",{minimumFractionDigits:2})}€
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:V("--text-dim") }}>
            invertido {total.invertido.toLocaleString("es-ES",{minimumFractionDigits:0})}€
          </span>
          <div style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700,
            color: ganando ? V("--accent") : V("--negative"),
            background: ganando ? mix(V("--accent"),"20") : mix(V("--negative"),"20"),
            padding:"4px 10px", borderRadius:6,
          }}>
            {ganando ? "+" : ""}{total.plusvalia.toLocaleString("es-ES",{minimumFractionDigits:2})}€ · {ganando ? "+" : ""}{pctTotal.toFixed(2)}%
          </div>
        </div>
      </div>

      {inversiones.length > 0 && (
        <div style={{ background:V("--surface"), borderRadius:18, padding:"16px 18px",
          border:`1px solid ${V("--border")}`, marginBottom:14 }}>
          <div style={{ fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:12 }}>Distribución por tipo</div>
          {Object.entries(porTipo)
            .filter(([_, v]) => v.valorActual > 0)
            .sort((a,b) => b[1].valorActual - a[1].valorActual)
            .map(([tipoId, v]) => {
              const t = TIPOS_ACTIVO[tipoId];
              const pct = total.valorActual > 0 ? (v.valorActual / total.valorActual) * 100 : 0;
              return (
                <div key={tipoId} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:V("--text-mid") }}>
                      {t.icono} {t.label}
                    </span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color: t.color }}>
                      {v.valorActual.toLocaleString("es-ES",{minimumFractionDigits:0})}€ · {pct.toFixed(0)}%
                    </span>
                  </div>
                  <BarraProgreso valor={v.valorActual} maximo={total.valorActual||1} color={t.color} altura={5}/>
                </div>
              );
            })}
        </div>
      )}

      <div style={{ fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:10 }}>
        Posiciones ({inversiones.length})
      </div>

      {inversiones.length === 0 && (
        <div style={{ padding:"24px", textAlign:"center", fontFamily:"'Inter',sans-serif",
          fontSize:13, color:V("--text-dim"), fontStyle:"italic",
          background:"rgba(255,255,255,0.02)", borderRadius:12,
          border:"1px dashed rgba(255,255,255,0.06)", marginBottom:8 }}>
          Aún no has añadido ninguna posición.
        </div>
      )}

      {[...inversiones]
        .sort((a,b) => calcularPosicion(b).valorActual - calcularPosicion(a).valorActual)
        .map(inv => (
          <FilaInversion key={inv.id} inv={inv}
            onUpdate={nuevo => actualizarInv(inv.id, nuevo)}
            onEliminar={() => eliminarInv(inv.id)}/>
        ))}

      {anadiendo ? (
        <FormularioAnadirInversion onGuardar={añadirInv} onCancelar={() => setAnadiendo(false)}/>
      ) : (
        <BotonAnadir onClick={() => setAnadiendo(true)} label="Añadir posición" color={V("--accent")}/>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// VISTA ANÁLISIS
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// VISTA PATRIMONIO (inmuebles + deudas + neto)
// ═══════════════════════════════════════════════════════
function VistaPatrimonio({ datos, claveM, onUpdateDatos }) {
  const dEf = datosEfectivosMes(datos, claveM);
  const [anadiendoInm, setAnadiendoInm] = useState(false);
  const [anadiendoDeuda, setAnadiendoDeuda] = useState(false);

  // Cálculos del patrimonio neto para el mes actual
  const liquido = Object.keys(BANCO_META).reduce((a,b) => a + totalBanco(dEf.bancosConfig, dEf.cuentas, b), 0);
  const compartido = patrimonioCompartido(dEf.cuentas);
  const inversion = calcularTotalCartera(dEf.inversiones || []).valorActual;
  const inmuebles = totalInmuebles(dEf, claveM);
  const deudas = totalDeudas(dEf, claveM);
  const activos = liquido + compartido + inversion + inmuebles;
  const neto = activos - deudas;

  // Handlers inmuebles
  const añadirInmueble = (data) => {
    const nuevoId = `inm-${Date.now()}`;
    onUpdateDatos(d => {
      if (!d.inmuebles) d.inmuebles = [];
      d.inmuebles.push({ ...data, id: nuevoId, mesBase: claveM });
    });
    setAnadiendoInm(false);
  };
  const actualizarInmueble = (id, cambios) => onUpdateDatos(d => {
    d.inmuebles = (d.inmuebles || []).map(i => i.id === id ? { ...i, ...cambios } : i);
  });
  const eliminarInmueble = (id) => onUpdateDatos(d => {
    d.inmuebles = (d.inmuebles || []).filter(i => i.id !== id);
  });

  // Handlers deudas
  const añadirDeuda = (data) => {
    const nuevoId = `deuda-${Date.now()}`;
    onUpdateDatos(d => {
      if (!d.deudas) d.deudas = [];
      d.deudas.push({ ...data, id: nuevoId, mesBase: claveM });
    });
    setAnadiendoDeuda(false);
  };
  const actualizarDeuda = (id, cambios) => onUpdateDatos(d => {
    d.deudas = (d.deudas || []).map(x => x.id === id ? { ...x, ...cambios } : x);
  });
  const eliminarDeuda = (id) => onUpdateDatos(d => {
    d.deudas = (d.deudas || []).filter(x => x.id !== id);
  });

  return (
    <div>
      {/* Resumen patrimonio neto */}
      <div style={{ background:`linear-gradient(135deg, ${mix(V("--accent"),"20")}, ${mix(V("--c1"),"10")})`,
        border:`1px solid ${mix(V("--accent"),"40")}`, borderRadius:18, padding:"18px 20px", marginBottom:14 }}>
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:600, color:V("--accent"),
          letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>
          Patrimonio neto
        </div>
        <div style={{ fontFamily:SERIF, fontSize:34, fontWeight:700,
          color:V("--text"), letterSpacing:"-0.02em" }}>
          {neto.toLocaleString("es-ES",{minimumFractionDigits:0})}€
        </div>
        <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:4 }}>
          {[
            { label:"Líquido", v:liquido, c:V("--c2") },
            ...(compartido > 0 ? [{ label:"Compartido (50%)", v:compartido, c:V("--c3") }] : []),
            { label:"Inversiones", v:inversion, c:V("--c3") },
            { label:"Inmuebles", v:inmuebles, c:V("--accent") },
            { label:"− Deudas", v:-deudas, c:V("--negative") },
          ].map(({label, v, c}) => (
            <div key={label} style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-dim") }}>{label}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:c }}>
                {v.toLocaleString("es-ES",{minimumFractionDigits:0})}€
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* INMUEBLES */}
      <div style={{ background:V("--surface"), borderRadius:18, padding:"16px 18px",
        border:`1px solid ${V("--border")}`, marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:10 }}><Icono nombre="inmueble" size={17} color={V("--text-mid")}/> Inmuebles</div>
        {(dEf.inmuebles || []).map(inm => {
          const valorHoy = valorInmuebleEnMes(inm, claveM);
          return (
            <div key={inm.id} style={{ padding:"8px 0", borderBottom:`1px solid ${V("--border")}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600, color:V("--text-mid"), flex:1 }}>
                  {inm.nombre}
                </span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700, color:V("--accent") }}>
                  {valorHoy.toLocaleString("es-ES",{minimumFractionDigits:0})}€
                </span>
                <button onClick={() => { if(confirm(`¿Eliminar "${inm.nombre}"?`)) eliminarInmueble(inm.id); }}
                  style={{ background:"none", border:"none", cursor:"pointer", color:mix(V("--negative"),"60"), fontSize:14, padding:"0 0 0 8px" }}>×</button>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim") }}>valor base</span>
                <InputMoneda valor={inm.valorBase} onChange={v => actualizarInmueble(inm.id, { valorBase: v })} compact ancho={75}/>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim") }}>reval/año</span>
                <InputNumero valor={inm.revalAnual || 0} onChange={v => actualizarInmueble(inm.id, { revalAnual: v })} sufijo="%" compact ancho={42} step={0.5}/>
              </div>
            </div>
          );
        })}
        {anadiendoInm
          ? <FormularioAnadirInmueble onGuardar={añadirInmueble} onCancelar={() => setAnadiendoInm(false)}/>
          : <BotonAnadir onClick={() => setAnadiendoInm(true)} label="Añadir inmueble" color={V("--accent")}/>}
      </div>

      {/* DEUDAS */}
      <div style={{ background:V("--surface"), borderRadius:18, padding:"16px 18px",
        border:`1px solid ${V("--border")}`, marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:10 }}><Icono nombre="deuda" size={17} color={V("--text-mid")}/> Deudas</div>
        {(dEf.deudas || []).map(deuda => (
          <FilaDeuda key={deuda.id} deuda={deuda} claveM={claveM}
            onActualizar={cambios => actualizarDeuda(deuda.id, cambios)}
            onEliminar={() => { if(confirm(`¿Eliminar "${deuda.nombre}"?`)) eliminarDeuda(deuda.id); }}/>
        ))}
        {anadiendoDeuda
          ? <FormularioAnadirDeuda onGuardar={añadirDeuda} onCancelar={() => setAnadiendoDeuda(false)}/>
          : <BotonAnadir onClick={() => setAnadiendoDeuda(true)} label="Añadir deuda" color={V("--negative")}/>}
      </div>
    </div>
  );
}

function FormularioAnadirInmueble({ onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState("");
  const [valorBase, setValorBase] = useState(0);
  const [revalAnual, setRevalAnual] = useState(0);
  return (
    <div style={{ marginTop:8, padding:"12px", background:"rgba(255,255,255,0.03)", borderRadius:10,
      border:"1px solid rgba(255,255,255,0.08)" }}>
      <input placeholder="Nombre (ej. Piso Petrer)" value={nombre} onChange={e => setNombre(e.target.value)}
        style={{ width:"100%", background:V("--surface-2"), border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:8, padding:"8px 10px", color:V("--text"), fontSize:13, outline:"none",
          fontFamily:"'Inter',sans-serif", marginBottom:8 }}/>
      <div style={{ display:"flex", gap:8, marginBottom:10, alignItems:"center" }}>
        <div><div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginBottom:3 }}>Valor</div>
          <InputMoneda valor={valorBase} onChange={setValorBase} compact ancho={80}/></div>
        <div><div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginBottom:3 }}>Revaloriz./año</div>
          <InputNumero valor={revalAnual} onChange={setRevalAnual} sufijo="%" compact ancho={50} step={0.5}/></div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => { if (nombre.trim() && valorBase > 0) onGuardar({ nombre: nombre.trim(), valorBase, revalAnual }); }}
          style={{ flex:1, background:V("--accent"), color:V("--bg"), border:"none", borderRadius:8,
            fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", padding:"8px" }}>Crear</button>
        <button onClick={onCancelar} style={{ padding:"0 14px", background:V("--surface-2"), color:V("--text-dim"),
          border:"none", borderRadius:8, cursor:"pointer", fontSize:13 }}>✕</button>
      </div>
    </div>
  );
}

function FormularioAnadirDeuda({ onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState("");
  const [capitalInicial, setCapitalInicial] = useState(0);
  const [saldoActual, setSaldoActual] = useState(0);
  const [tin, setTin] = useState(0);
  const [tipoInteres, setTipoInteres] = useState("fijo");
  const [plazoAnios, setPlazoAnios] = useState(0);

  return (
    <div style={{ marginTop:8, padding:"12px", background:"rgba(255,255,255,0.03)", borderRadius:10,
      border:"1px solid rgba(255,255,255,0.08)" }}>
      <input placeholder="Nombre (ej. Hipoteca)" value={nombre} onChange={e => setNombre(e.target.value)}
        style={{ width:"100%", background:V("--surface-2"), border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:8, padding:"8px 10px", color:V("--text"), fontSize:13, outline:"none",
          fontFamily:"'Inter',sans-serif", marginBottom:8 }}/>

      <div style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
        <div><div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginBottom:3 }}>Importe inicial</div>
          <InputMoneda valor={capitalInicial} onChange={setCapitalInicial} compact ancho={80}/></div>
        <div><div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginBottom:3 }}>Deuda actual</div>
          <InputMoneda valor={saldoActual} onChange={setSaldoActual} compact ancho={80}/></div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
        <div><div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginBottom:3 }}>Interés (TIN)</div>
          <InputNumero valor={tin} onChange={setTin} sufijo="%" compact ancho={48} step={0.05}/></div>
        <div><div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginBottom:3 }}>Plazo</div>
          <InputNumero valor={plazoAnios} onChange={setPlazoAnios} sufijo="años" compact ancho={42} step={1}/></div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginBottom:3 }}>Tipo</div>
          <div style={{ display:"flex", gap:3 }}>
            {["fijo","variable"].map(t => (
              <button key={t} onClick={() => setTipoInteres(t)} style={{
                flex:1, padding:"5px 4px", borderRadius:6, border:"none", cursor:"pointer", fontSize:10,
                fontFamily:"'Inter',sans-serif", fontWeight:600,
                background: tipoInteres === t ? V("--accent")+"25" : V("--surface-2"),
                color: tipoInteres === t ? V("--accent") : V("--text-dim"),
              }}>{t === "fijo" ? "Fijo" : "Variable"}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview de la cuota calculada en vivo */}
      {capitalInicial > 0 && plazoAnios > 0 && (() => {
        const prev = analizarDeuda({ capitalInicial, saldoActual, tin, plazoAnios });
        return (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"8px 10px", marginBottom:10, borderRadius:8, background:mix(V("--accent"),0.08),
            border:`1px solid ${mix(V("--accent"),0.2)}` }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-mid") }}>
              <IconoInline nombre="formula"/>Cuota calculada
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:15, fontWeight:800, color:V("--accent") }}>
              {prev.cuota.toLocaleString("es-ES",{minimumFractionDigits:2, maximumFractionDigits:2})}€<span style={{ fontSize:9, color:V("--text-dim") }}>/mes</span>
            </span>
          </div>
        );
      })()}

      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => {
          if (nombre.trim() && capitalInicial > 0 && saldoActual > 0 && plazoAnios > 0)
            onGuardar({ nombre: nombre.trim(), capitalInicial, saldoActual, tin, tipoInteres, plazoAnios });
        }}
          style={{ flex:1, background:V("--negative"), color:"#fff", border:"none", borderRadius:8,
            fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", padding:"8px" }}>Crear</button>
        <button onClick={onCancelar} style={{ padding:"0 14px", background:V("--surface-2"), color:V("--text-dim"),
          border:"none", borderRadius:8, cursor:"pointer", fontSize:13 }}>✕</button>
      </div>
    </div>
  );
}

function FilaDeuda({ deuda, claveM, onActualizar, onEliminar }) {
  const [abierto, setAbierto] = useState(false);
  const saldoHoy = saldoDeudaEnMes(deuda, claveM);
  const a = analizarDeuda(deuda);
  const fmtTiempo = (t) => t.anios > 0 ? `${t.anios}a ${t.meses}m` : `${t.meses}m`;

  return (
    <div style={{ padding:"10px 0", borderBottom:`1px solid ${V("--border")}` }}>
      {/* Cabecera: nombre + saldo + cuota */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <div onClick={() => setAbierto(o => !o)} style={{ flex:1, cursor:"pointer", minWidth:0 }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600, color:V("--text-mid") }}>
            {deuda.nombre}
          </span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:V("--text-dim"),
            background: deuda.tipoInteres === "variable" ? mix(V("--warn"),0.15) : mix(V("--accent"),0.12),
            color: deuda.tipoInteres === "variable" ? V("--warn") : V("--accent"),
            padding:"1px 5px", borderRadius:3, marginLeft:6 }}>
            {deuda.tipoInteres === "variable" ? "VAR" : "FIJO"} {deuda.tin}%
          </span>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700, color:V("--warn") }}>
            {saldoHoy.toLocaleString("es-ES",{minimumFractionDigits:0})}€
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:V("--text-dim") }}>
            cuota {a.cuota.toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})}€/mes
          </div>
        </div>
        <button onClick={onEliminar} style={{ background:"none", border:"none", cursor:"pointer",
          color:mix(V("--negative"),"60"), fontSize:14, padding:"0 0 0 8px" }}>×</button>
      </div>

      {/* Progreso amortización */}
      <BarraProgreso valor={a.pctPagado} maximo={100} color={V("--warn")} altura={5}/>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:V("--text-dim") }}>
          pagado {fmtTiempo(a.pagado)} · {a.pctPagado.toFixed(0)}%
        </span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:V("--text-dim") }}>
          quedan {fmtTiempo(a.restante)}
        </span>
      </div>

      {/* Detalle editable */}
      {abierto && (
        <div style={{ marginTop:8, padding:"8px", background:"rgba(255,255,255,0.02)", borderRadius:8 }}>
          <div style={{ display:"flex", gap:8, marginBottom:6, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim") }}>capital inicial</span>
            <InputMoneda valor={deuda.capitalInicial} onChange={v => onActualizar({ capitalInicial: v })} compact ancho={70}/>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim") }}>deuda actual</span>
            <InputMoneda valor={deuda.saldoActual} onChange={v => onActualizar({ saldoActual: v, mesBase: claveM })} compact ancho={70}/>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim") }}>TIN</span>
            <InputNumero valor={deuda.tin} onChange={v => onActualizar({ tin: v })} sufijo="%" compact ancho={48} step={0.05}/>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim") }}>plazo</span>
            <InputNumero valor={deuda.plazoAnios} onChange={v => onActualizar({ plazoAnios: v })} sufijo="años" compact ancho={42} step={1}/>
            <div style={{ display:"flex", gap:3 }}>
              {["fijo","variable"].map(t => (
                <button key={t} onClick={() => onActualizar({ tipoInteres: t })} style={{
                  padding:"4px 8px", borderRadius:6, border:"none", cursor:"pointer", fontSize:9,
                  fontFamily:"'Inter',sans-serif", fontWeight:600,
                  background: deuda.tipoInteres === t ? V("--accent")+"25" : V("--surface-2"),
                  color: deuda.tipoInteres === t ? V("--accent") : V("--text-dim"),
                }}>{t === "fijo" ? "Fijo" : "Variable"}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop:8, fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"),
            padding:"6px 8px", background:mix(V("--negative"),0.05), borderRadius:5, lineHeight:1.4 }}>
            <IconoInline nombre="bombilla"/>La cuota se calcula con el sistema francés (capital, interés y plazo). Compárala con tu recibo: si coincide, los datos son correctos. {deuda.tipoInteres === "variable" ? "Al revisar el euríbor, actualiza el TIN." : ""}
          </div>
        </div>
      )}
    </div>
  );
}

function VistaCartera({ datos, claveM, onUpdateDatos }) {
  const [sub, setSub] = useState("bancos");
  const dEf = datosEfectivosMes(datos, claveM);

  return (
    <div className="slide-in">
      {/* Sub-pestañas */}
      <div style={{ display:"flex", gap:6, marginBottom:14,
        background:V("--surface"), borderRadius:12, padding:4,
        border:`1px solid ${V("--border")}` }}>
        {[
          { id:"bancos", ic:"banco", label:"Bancos" },
          { id:"inversiones", ic:"inversiones", label:"Inversiones" },
          { id:"patrimonio", ic:"patrimonio", label:"Patrimonio" },
        ].map(s => (
          <button key={s.id} onClick={() => setSub(s.id)} style={{
            flex:1, padding:"9px 4px", borderRadius:9, border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:5,
            background: sub === s.id ? mix(V("--accent"), "20") : "transparent",
            fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:700,
            color: sub === s.id ? V("--accent") : V("--text-dim"),
            transition:"all 0.2s",
          }}>
            <Icono nombre={s.ic} size={16} color={sub === s.id ? V("--accent") : V("--text-dim")}/> {s.label}
          </button>
        ))}
      </div>

      {sub === "bancos" && <BloqueBancos datos={dEf} onUpdateDatos={onUpdateDatos}/>}
      {sub === "inversiones" && <VistaInversiones datos={datos} claveM={claveM} onUpdateDatos={onUpdateDatos}/>}
      {sub === "patrimonio" && <VistaPatrimonio datos={datos} claveM={claveM} onUpdateDatos={onUpdateDatos}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BLOQUE ALERTAS / SEMÁFOROS
// ═══════════════════════════════════════════════════════
function BloqueAlertas({ datos, claveM, mesNum }) {
  const dEf = datosEfectivosMes(datos, claveM);
  const alertas = [];

  // 1. Remanente del mes negativo
  const ingresos = calcularIngresosMes(datos, claveM);
  const { total: gastos } = calcularGastoMensualTotal(datos, claveM);
  const remanente = ingresos - gastos;
  if (remanente < 0) {
    alertas.push({ tipo:"error",
      texto:`Gastas ${Math.abs(remanente).toLocaleString("es-ES",{minimumFractionDigits:0})}€ más de lo que ingresas este mes` });
  }

  // 2. Reserva de impuestos insuficiente para lo pendiente
  const reserva = calcularReservaEfectiva(dEf);
  const pendienteAnual = totalAnualesPendiente(dEf);
  if (pendienteAnual > 0 && reserva < pendienteAnual * 0.5 && mesNum >= 6) {
    alertas.push({ tipo:"warn",
      texto:`Tu reserva (${reserva.toLocaleString("es-ES",{minimumFractionDigits:0})}€) cubre menos de la mitad de los anuales pendientes` });
  }

  // 3. Objetivos atrasados o vencidos
  (dEf.objetivos || []).forEach(o => {
    const ev = evaluarObjetivo(o, dEf.cuentas, claveM);
    if (ev.vencido) alertas.push({ tipo:"error", texto:`Objetivo "${o.nombre}" venció sin completarse` });
    else if (ev.ritmo === "atrasado") alertas.push({ tipo:"warn", texto:`Objetivo "${o.nombre}" va atrasado` });
  });

  // 4. Deudas que se saldan pronto (buena noticia)
  (dEf.deudas || []).forEach(deuda => {
    const saldo = saldoDeudaEnMes(deuda, claveM);
    if (saldo > 0 && deuda.cuotaMensual > 0) {
      const meses = Math.ceil(saldo / deuda.cuotaMensual);
      if (meses <= 3) alertas.push({ tipo:"ok", texto:`"${deuda.nombre}" se salda en ~${meses} ${meses===1?"mes":"meses"}` });
    }
  });

  if (alertas.length === 0) return null;

  const colorTipo = { error:V("--warn"), warn:V("--warn"), ok:V("--accent") };
  return (
    <div style={{ marginBottom:14 }}>
      {alertas.map((a, i) => (
        <div key={i} style={{
          display:"flex", alignItems:"center", gap:8, padding:"9px 12px", marginBottom:6,
          background: colorTipo[a.tipo] + "12", borderRadius:10,
          border:`1px solid ${colorTipo[a.tipo]}30`,
        }}>
          <Icono nombre={a.tipo === "ok" ? "check" : "alerta"} size={16} color={colorTipo[a.tipo]}/>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-mid"), lineHeight:1.4 }}>
            {a.texto}
          </span>
        </div>
      ))}
    </div>
  );
}

function VistaAnalisis({ datos, claveM, mesNum, onUpdateDatos }) {
  const [subAna, setSubAna] = useState("resumen");
  // Datos efectivos (snapshot si el mes está cerrado)
  const dEf = datosEfectivosMes(datos, claveM);

  const totalIngresos = calcularIngresosMes(datos, claveM);
  const { fijos, vars, ahorro, puntuales, total: totalGastos } = calcularGastoMensualTotal(datos, claveM);
  const aportacion = calcularAportacionAnual(datos, mesNum, claveM);
  const margen = totalIngresos - totalGastos;
  const tasaAhorro = totalIngresos > 0 ? (ahorro / totalIngresos) * 100 : 0;

  const cartera = calcularTotalCartera(dEf.inversiones || []);
  // Patrimonio NETO: líquido + 50% compartido + inversiones + inmuebles − deudas
  const liquidez = Object.keys(BANCO_META).reduce((a, b) => a + totalBanco(dEf.bancosConfig, dEf.cuentas, b), 0);
  const liquidezCompartida = patrimonioCompartido(dEf.cuentas);
  const inmueblesTotal = totalInmuebles(dEf, claveM);
  const deudasTotal = totalDeudas(dEf, claveM);
  const patrimonio = liquidez + liquidezCompartida + cartera.valorActual + inmueblesTotal - deudasTotal;

  const saldoEmergencia = dEf.cuentas
    .filter(c => c.proposito === "emergencia" && !c.compartida)
    .reduce((a,c) => a + (c.asignado||0), 0);

  // Distribución de gastos
  const totalGastosBanco = {};
  Object.keys(BANCO_META).forEach(b => { totalGastosBanco[b] = 0; });
  [
    ...gastosFijosDeMes(datos, claveM),
    ...gastosVariablesDeMes(datos, claveM),
    ...gastosAhorroDeMes(datos, claveM),
    ...gastosPuntualesDeMes(datos, claveM),
  ].forEach(g => {
    if (totalGastosBanco[g.banco] !== undefined) totalGastosBanco[g.banco] += g.importe || 0;
  });

  // ─── Clasificación de gastos para teorías del ahorro ───
  // Acumula los gastos por clasificación (necesidad/deseo/ahorro/etc.)
  const porClasificacion = {};
  const todosLosGastos = [];
  gastosFijosDeMes(datos, claveM).forEach(g => {
    const c = clasificacionGasto(g, "fijos");
    porClasificacion[c] = (porClasificacion[c] || 0) + (g.importe || 0);
    todosLosGastos.push({ ...g, tipoOrigen: "fijos", clasif: c });
  });
  gastosVariablesDeMes(datos, claveM).forEach(g => {
    const c = clasificacionGasto(g, "variables");
    porClasificacion[c] = (porClasificacion[c] || 0) + (g.importe || 0);
    todosLosGastos.push({ ...g, tipoOrigen: "variables", clasif: c });
  });
  gastosAhorroDeMes(datos, claveM).forEach(g => {
    const c = clasificacionGasto(g, "ahorro");
    porClasificacion[c] = (porClasificacion[c] || 0) + (g.importe || 0);
    todosLosGastos.push({ ...g, tipoOrigen: "ahorro", clasif: c });
  });
  gastosPuntualesDeMes(datos, claveM).forEach(g => {
    const c = clasificacionGasto(g, "puntuales");
    porClasificacion[c] = (porClasificacion[c] || 0) + (g.importe || 0);
    todosLosGastos.push({ ...g, tipoOrigen: "puntuales", clasif: c });
  });

  return (
    <div className="slide-in">
      {/* Sub-pestañas Resumen / Teorías / Objetivos */}
      <div style={{ display:"flex", gap:6, marginBottom:14,
        background:V("--surface"), borderRadius:12, padding:4,
        border:`1px solid ${V("--border")}` }}>
        {[
          { id:"resumen",   ic:"resumen", label:"Resumen" },
          { id:"teorias",   ic:"teorias", label:"Teorías" },
          { id:"objetivos", ic:"objetivo", label:"Objetivos" },
        ].map(s => (
          <button key={s.id} onClick={() => setSubAna(s.id)} style={{
            flex:1, padding:"9px 4px", borderRadius:9, border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:5,
            background: subAna === s.id ? mix(V("--accent"), "20") : "transparent",
            fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:700,
            color: subAna === s.id ? V("--accent") : V("--text-dim"),
            transition:"all 0.2s",
          }}>
            <Icono nombre={s.ic} size={16} color={subAna === s.id ? V("--accent") : V("--text-dim")}/> {s.label}
          </button>
        ))}
      </div>

      {subAna === "resumen" && <div>
      {/* Alertas / semáforos */}
      <BloqueAlertas datos={datos} claveM={claveM} mesNum={mesNum}/>

      {/* Patrimonio */}
      <div style={{ background:`linear-gradient(135deg, ${mix(V("--accent"),"20")}, ${mix(V("--c1"),"12")})`,
        border:`1px solid ${mix(V("--accent"),"30")}`, borderRadius:18, padding:"18px 20px", marginBottom:14 }}>
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:600, color:V("--c2"),
          letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>
          Patrimonio neto
        </div>
        <div style={{ fontFamily:SERIF, fontSize:34, fontWeight:700,
          color:V("--text"), letterSpacing:"-0.02em" }}>
          {patrimonio.toLocaleString("es-ES",{minimumFractionDigits:0})}€
        </div>
        <div style={{ display:"flex", gap:6, marginTop:10 }}>
          <div style={{ flex: liquidez || 1, height:8, background:V("--c2"), borderRadius:4 }}/>
          {liquidezCompartida > 0 && (
            <div style={{ flex: liquidezCompartida, height:8, background:V("--c3"), borderRadius:4, opacity:0.7 }}/>
          )}
          <div style={{ flex: cartera.valorActual || 1, height:8, background:V("--c3"), borderRadius:4 }}/>
          {inmueblesTotal > 0 && (
            <div style={{ flex: inmueblesTotal, height:8, background:V("--accent"), borderRadius:4 }}/>
          )}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, flexWrap:"wrap", gap:6 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:V("--c2") }}>
            Líquido {liquidez.toLocaleString("es-ES",{minimumFractionDigits:0})}€
          </span>
          {liquidezCompartida > 0 && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:V("--c3") }}>
              <IconoInline nombre="compartida"/>{liquidezCompartida.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </span>
          )}
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:V("--c3") }}>
            Inversión {cartera.valorActual.toLocaleString("es-ES",{minimumFractionDigits:0})}€
          </span>
          {inmueblesTotal > 0 && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:V("--accent") }}>
              <IconoInline nombre="inmueble"/>{inmueblesTotal.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </span>
          )}
          {deudasTotal > 0 && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:V("--warn") }}>
              − Deudas {deudasTotal.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </span>
          )}
        </div>
      </div>

      {/* Evolución del patrimonio */}
      <GraficaPatrimonio datos={datos} claveM={claveM}/>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {[
          { label:"Tasa de ahorro", v:`${tasaAhorro.toFixed(1)}%`, sub:`${ahorro.toLocaleString("es-ES",{minimumFractionDigits:0})}€/mes`, color: tasaAhorro >= 20 ? V("--accent") : V("--warn"), ok: tasaAhorro >= 20 },
          { label:"Remanente mes", v:`${margen.toLocaleString("es-ES",{minimumFractionDigits:0})}€`, sub:"tras todos los gastos", color: margen >= 0 ? V("--c2") : V("--warn"), ok: margen >= 0 },
          { label:"Aportación anual", v:`${Math.max(0,aportacion).toFixed(0)}€`, sub:`hasta noviembre`, color:V("--c3"), ok:true },
          { label:"Cobertura SOS", v:`${(saldoEmergencia/BASE_EMERGENCIA).toFixed(1)} meses`, sub:`base ${BASE_EMERGENCIA.toLocaleString("es-ES")}€/mes`, color:V("--c3"), ok: saldoEmergencia >= BASE_EMERGENCIA * 4 },
        ].map(({ label, v, sub, color, ok }) => (
          <div key={label} style={{ background:V("--surface"), borderRadius:14, padding:"14px 12px",
            border:`1px solid ${color}25` }}>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"),
              letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>{label}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color, marginBottom:3 }}>{v}</div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:V("--text-dim"), lineHeight:1.4 }}>{sub}</div>
            <div style={{ marginTop:6, fontFamily:"'Inter',sans-serif", fontSize:10,
              color: ok ? V("--accent") : V("--warn") }}>{ok ? "en objetivo" : "revisar"}</div>
          </div>
        ))}
      </div>

      {/* Distribución de gastos (por tipo) */}
      <div style={{ background:V("--surface"), borderRadius:18, padding:"16px 18px",
        border:`1px solid ${V("--border")}`, marginBottom:12 }}>
        <div style={{ fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:14 }}>
          Distribución de gastos
        </div>
        <DonutChart segmentos={[
          { label:"Fijos",     valor:fijos,     color:V("--accent") },
          { label:"Variables", valor:vars,      color:V("--c2") },
          { label:"Ahorro",    valor:ahorro,    color:V("--c3") },
          { label:"Puntuales", valor:puntuales, color:V("--c4") },
        ]}/>
      </div>

      {/* Flujo por banco */}
      <div style={{ background:V("--surface"), borderRadius:18, padding:"16px 18px",
        border:`1px solid ${V("--border")}` }}>
        <div style={{ fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:12 }}>
          Flujo de gastos por banco
        </div>
        {Object.entries(BANCO_META).map(([banco, meta]) => {
          const v = totalGastosBanco[banco] || 0;
          const pct = totalGastos > 0 ? (v/totalGastos)*100 : 0;
          if (v === 0) return null;
          return (
            <div key={banco} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:V("--text-mid") }}>{meta.label}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:meta.color }}>
                  {v.toLocaleString("es-ES",{minimumFractionDigits:0})}€ · {pct.toFixed(0)}%
                </span>
              </div>
              <BarraProgreso valor={v} maximo={totalGastos||1} color={meta.color} altura={5}/>
            </div>
          );
        })}
      </div>
      </div>}

      {subAna === "teorias" && <div>
        <BloqueTeoriasAhorro
          gastos={todosLosGastos}
          totalIngresos={totalIngresos}
          onReclasificar={(tipoOrigen, gastoId, nuevaClasif) => onUpdateDatos(d => {
            const lista = tipoOrigen === "puntuales"
              ? (d.meses[claveM] && d.meses[claveM].puntuales) || []
              : d[`catalogo${tipoOrigen.charAt(0).toUpperCase()}${tipoOrigen.slice(1)}`];
            if (!lista) return;
            const idx = lista.findIndex(g => g.id === gastoId);
            if (idx >= 0) lista[idx].clasificacion = nuevaClasif;
          })}
        />
      </div>}

      {subAna === "objetivos" && <div>
        <BloqueObjetivos
          objetivos={dEf.objetivos || []}
          cuentas={dEf.cuentas}
          claveM={claveM}
          onUpdateDatos={onUpdateDatos}
          autoObjetivos={datos.autoObjetivos}
        />
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// GRÁFICA DE EVOLUCIÓN DEL PATRIMONIO
// ═══════════════════════════════════════════════════════

// Patrimonio total de un mes: líquido + 50% compartido + inversiones,
// usando el snapshot del mes si lo tiene (o el estado global si no).
function patrimonioDeMes(datos, clave) {
  const dEf = datosEfectivosMes(datos, clave);
  const liquidez = Object.keys(BANCO_META).reduce((a, b) =>
    a + totalBanco(dEf.bancosConfig, dEf.cuentas, b), 0);
  const compartido = patrimonioCompartido(dEf.cuentas);
  const inversion = calcularTotalCartera(dEf.inversiones || []).valorActual;
  const inmuebles = totalInmuebles(dEf, clave);
  const deudas = totalDeudas(dEf, clave);
  return liquidez + compartido + inversion + inmuebles - deudas;  // patrimonio NETO
}

// Donut chart con leyenda. segmentos: [{label, valor, color}]
function DonutChart({ segmentos, tamano = 130 }) {
  const total = segmentos.reduce((a, s) => a + s.valor, 0);
  const visibles = segmentos.filter(s => s.valor > 0);
  if (total <= 0) return null;

  const r = tamano / 2;
  const grosor = tamano * 0.22;
  const rInterno = r - grosor;
  const cx = r, cy = r;

  // Construir arcos SVG
  let anguloAcum = -90;  // empezar arriba
  const arcos = visibles.map(s => {
    const frac = s.valor / total;
    const angIni = anguloAcum;
    const angFin = anguloAcum + frac * 360;
    anguloAcum = angFin;
    const rad = (a) => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(angIni)), y1 = cy + r * Math.sin(rad(angIni));
    const x2 = cx + r * Math.cos(rad(angFin)), y2 = cy + r * Math.sin(rad(angFin));
    const xi2 = cx + rInterno * Math.cos(rad(angFin)), yi2 = cy + rInterno * Math.sin(rad(angFin));
    const xi1 = cx + rInterno * Math.cos(rad(angIni)), yi1 = cy + rInterno * Math.sin(rad(angIni));
    const largo = frac > 0.5 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largo} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${rInterno} ${rInterno} 0 ${largo} 0 ${xi1} ${yi1} Z`;
    return { d, color: s.color };
  });

  return (
    <div style={{ display:"flex", alignItems:"center", gap:18 }}>
      <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`} style={{ flexShrink:0 }}>
        {arcos.map((a, i) => <path key={i} d={a.d} fill={a.color}/>)}
      </svg>
      <div style={{ flex:1, minWidth:0 }}>
        {visibles.map((s, i) => {
          const pct = (s.valor / total) * 100;
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
              <span style={{ width:9, height:9, borderRadius:"50%", background:s.color, flexShrink:0 }}/>
              <span style={{ flex:1, fontFamily:"'Inter',sans-serif", fontSize:12, color:V("--text-mid"),
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.label}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:V("--text"), fontWeight:600 }}>
                {s.valor.toLocaleString("es-ES",{minimumFractionDigits:0})}€
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:V("--text-dim"), width:34, textAlign:"right" }}>
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GraficaPatrimonio({ datos, claveM }) {
  // Meses a pintar: todos los registrados hasta el mes visualizado (incluido)
  const claves = Array.from(new Set([...Object.keys(datos.meses), claveM]))
    .filter(k => k <= claveM)
    .sort();

  const puntos = claves.map(k => ({
    clave: k,
    label: MESES[Number(k.split("-")[1]) - 1].slice(0, 3),
    año: k.split("-")[0],
    valor: patrimonioDeMes(datos, k),
  }));

  if (puntos.length < 2) {
    return (
      <div style={{ background:V("--surface"), borderRadius:18, padding:"16px 18px",
        border:`1px solid ${V("--border")}`, marginBottom:12 }}>
        <div style={{ fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>
          <IconoInline nombre="inversiones"/>Evolución del patrimonio
        </div>
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-dim"),
          fontStyle:"italic", textAlign:"center", padding:"10px 0" }}>
          El histórico se irá dibujando a medida que pasen los meses.
        </div>
      </div>
    );
  }

  // Geometría del SVG
  const W = 320, H = 110, padX = 8, padTop = 14, padBot = 22;
  const valores = puntos.map(p => p.valor);
  const vMin = Math.min(...valores), vMax = Math.max(...valores);
  const rango = (vMax - vMin) || 1;
  const x = (i) => padX + (i / (puntos.length - 1)) * (W - 2 * padX);
  const y = (v) => padTop + (1 - (v - vMin) / rango) * (H - padTop - padBot);

  const path = puntos.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" ");
  const area = `${path} L${x(puntos.length-1).toFixed(1)},${H - padBot} L${x(0).toFixed(1)},${H - padBot} Z`;

  const ultimo = puntos[puntos.length - 1];
  const primero = puntos[0];
  const delta = ultimo.valor - primero.valor;
  const subiendo = delta >= 0;
  const colorLinea = subiendo ? V("--accent") : V("--warn");

  // Qué etiquetas de mes mostrar en eje X (máximo ~5 para que no se solapen)
  const paso = Math.max(1, Math.ceil(puntos.length / 5));
  const mostrarLabel = (i) => i === 0 || i === puntos.length - 1 || i % paso === 0;

  return (
    <div style={{ background:V("--surface"), borderRadius:18, padding:"16px 18px",
      border:`1px solid ${V("--border")}`, marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase" }}>
          <IconoInline nombre="inversiones"/>Evolución del patrimonio
        </div>
        <div style={{
          fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700,
          color: colorLinea, background: colorLinea + "15",
          padding:"3px 8px", borderRadius:5,
        }}>
          {subiendo ? "+" : ""}{delta.toLocaleString("es-ES",{minimumFractionDigits:0})}€
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"auto", display:"block" }}>
        <defs>
          <linearGradient id="gradPatrimonio" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorLinea} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={colorLinea} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Área bajo la curva */}
        <path d={area} fill="url(#gradPatrimonio)"/>
        {/* Línea */}
        <path d={path} fill="none" stroke={colorLinea} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"/>
        {/* Puntos */}
        {puntos.map((p, i) => (
          <circle key={p.clave} cx={x(i)} cy={y(p.valor)}
            r={i === puntos.length - 1 ? 3.5 : 2}
            fill={i === puntos.length - 1 ? colorLinea : V("--bg")}
            stroke={colorLinea} strokeWidth="1.5"/>
        ))}
        {/* Labels de mes (eje X) */}
        {puntos.map((p, i) => mostrarLabel(i) && (
          <text key={`lbl-${p.clave}`} x={x(i)} y={H - 8} textAnchor="middle"
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, fill:V("--text-dim") }}>
            {p.label}
          </text>
        ))}
        {/* Valor máximo y mínimo */}
        <text x={padX} y={10} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, fill:V("--text-dim") }}>
          {vMax.toLocaleString("es-ES",{maximumFractionDigits:0})}€
        </text>
      </svg>

      <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:V("--text-dim") }}>
          {primero.label} {primero.año}: {primero.valor.toLocaleString("es-ES",{minimumFractionDigits:0})}€
        </span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:colorLinea, fontWeight:600 }}>
          {ultimo.label} {ultimo.año}: {ultimo.valor.toLocaleString("es-ES",{minimumFractionDigits:0})}€
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BLOQUE OBJETIVOS DE AHORRO
// ═══════════════════════════════════════════════════════

function BloqueObjetivos({ objetivos, cuentas, claveM, onUpdateDatos, autoObjetivos }) {
  const [anadiendo, setAnadiendo] = useState(false);

  const añadirObjetivo = (data) => {
    const nuevoId = `obj-${Date.now()}`;
    onUpdateDatos(d => {
      if (!d.objetivos) d.objetivos = [];
      d.objetivos.push({ ...data, id: nuevoId, creadoEn: claveM });
    });
    setAnadiendo(false);
  };
  const eliminarObjetivo = (id) => onUpdateDatos(d => {
    d.objetivos = (d.objetivos || []).filter(o => o.id !== id);
  });
  const actualizarObjetivo = (id, cambios) => onUpdateDatos(d => {
    d.objetivos = (d.objetivos || []).map(o => o.id === id ? { ...o, ...cambios } : o);
  });

  return (
    <div style={{ background:V("--surface"), borderRadius:14,
      border:`1px solid ${V("--border")}`, marginBottom:12, padding:"14px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase" }}>
          Objetivos de ahorro
        </div>
        {objetivos.length > 0 && (
          <button onClick={() => onUpdateDatos(d => { d.autoObjetivos = !d.autoObjetivos; })} title="Crear gasto de ahorro automático con la suma de cuotas"
            style={{
              padding:"3px 10px", borderRadius:14, border:"none", cursor:"pointer", fontSize:9,
              fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
              background: autoObjetivos ? mix(V("--accent"),0.25) : V("--surface-2"),
              color: autoObjetivos ? V("--accent") : V("--text-dim"),
            }}><span style={{display:"inline-flex",verticalAlign:"middle",marginRight:4}}><Icono nombre="auto" size={12}/></span>{autoObjetivos ? "ON" : "OFF"}</button>
        )}
      </div>

      {objetivos.length === 0 && !anadiendo && (
        <div style={{ padding:"14px", textAlign:"center", fontFamily:"'Inter',sans-serif",
          fontSize:12, color:V("--text-dim"), fontStyle:"italic",
          background:"rgba(255,255,255,0.02)", borderRadius:10,
          border:"1px dashed rgba(255,255,255,0.06)", marginBottom:8 }}>
          Define un objetivo (viaje, coche, entrada de casa…) y te diré cuánto apartar al mes.
        </div>
      )}

      {objetivos.map(obj => (
        <FilaObjetivo key={obj.id} objetivo={obj} cuentas={cuentas} claveM={claveM}
          onActualizar={cambios => actualizarObjetivo(obj.id, cambios)}
          onEliminar={() => {
            if (confirm(`¿Eliminar el objetivo "${obj.nombre}"?`)) eliminarObjetivo(obj.id);
          }}
        />
      ))}

      {anadiendo ? (
        <FormularioAnadirObjetivo cuentas={cuentas} claveM={claveM}
          onGuardar={añadirObjetivo} onCancelar={() => setAnadiendo(false)}/>
      ) : (
        <BotonAnadir onClick={() => setAnadiendo(true)} label="Añadir objetivo" color={V("--accent")}/>
      )}
    </div>
  );
}

function FilaObjetivo({ objetivo, cuentas, claveM, onActualizar, onEliminar }) {
  const ev = evaluarObjetivo(objetivo, cuentas, claveM);
  const [yLim, mLim] = objetivo.fechaLimite.split("-").map(Number);
  const fechaLabel = `${MESES[mLim-1]} ${yLim}`;

  // Color y etiqueta del estado
  let estadoColor = V("--accent"), estadoLabel = "En ritmo";
  if (ev.completado)       { estadoColor = V("--accent"); estadoLabel = "Completado"; }
  else if (ev.vencido)     { estadoColor = V("--warn"); estadoLabel = "Plazo vencido"; }
  else if (ev.ritmo === "adelantado") { estadoColor = V("--accent"); estadoLabel = "Adelantado"; }
  else if (ev.ritmo === "atrasado")   { estadoColor = V("--warn"); estadoLabel = "Atrasado"; }
  else if (ev.ritmo === "alDia")      { estadoColor = V("--c2"); estadoLabel = "Al día"; }

  return (
    <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:12, padding:"12px 14px",
      border:`1px solid ${estadoColor}25`, marginBottom:10 }}>

      {/* Cabecera: nombre + fecha + eliminar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:700, color:V("--text-mid") }}>
            {objetivo.nombre}
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:V("--text-dim"), marginTop:2 }}>
            límite {fechaLabel}
            {!ev.completado && !ev.vencido && ` · ${ev.mesesRestantes} ${ev.mesesRestantes === 1 ? "mes" : "meses"}`}
            {ev.cuenta && ` · ${ev.cuenta.nombre}`}
          </div>
        </div>
        <button onClick={onEliminar} style={{ background:"none", border:"none",
          cursor:"pointer", color:mix(V("--negative"),"60"), fontSize:15, padding:"0 2px" }}>×</button>
      </div>

      {/* Barra de progreso */}
      <BarraProgreso valor={ev.ahorrado} maximo={objetivo.importe || 1} color={estadoColor} altura={7}/>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, marginBottom:8 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:estadoColor }}>
          {ev.ahorrado.toLocaleString("es-ES",{minimumFractionDigits:0})}€ · {ev.pctAhorrado.toFixed(0)}%
        </span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:V("--text-dim") }}>
          de {(objetivo.importe||0).toLocaleString("es-ES",{minimumFractionDigits:0})}€
        </span>
      </div>

      {/* Estado + cuota mensual */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"8px 10px", borderRadius:8, background: estadoColor + "10" }}>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, color:estadoColor }}>
          {estadoLabel}
        </span>
        {!ev.completado && !ev.vencido && (
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:V("--text") }}>
              {ev.cuotaMensual.toLocaleString("es-ES",{minimumFractionDigits:0})}€<span style={{ fontSize:9, color:V("--text-dim") }}>/mes</span>
            </div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:8, color:V("--text-dim") }}>
              para llegar a tiempo
            </div>
          </div>
        )}
        {ev.vencido && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:V("--warn") }}>
            faltan {ev.restante.toLocaleString("es-ES",{minimumFractionDigits:0})}€
          </span>
        )}
      </div>

      {/* Ahorrado manual editable (solo si no hay cuenta vinculada) */}
      {!ev.cuenta && !ev.completado && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-dim") }}>
            Ahorrado hasta ahora
          </span>
          <InputMoneda valor={objetivo.ahorradoManual || 0}
            onChange={v => onActualizar({ ahorradoManual: v })} compact ancho={65}/>
        </div>
      )}
    </div>
  );
}

function FormularioAnadirObjetivo({ cuentas, claveM, onGuardar, onCancelar }) {
  const [nombre, setNombre]   = useState("");
  const [importe, setImporte] = useState(0);
  const [añoActualNum, mesActualNum] = claveM.split("-").map(Number);
  const [mesLim, setMesLim]   = useState(mesActualNum);
  const [añoLim, setAñoLim]   = useState(añoActualNum + 1);
  const [cuentaId, setCuentaId] = useState(null);

  const guardar = () => {
    if (!nombre.trim() || importe <= 0) return;
    const fechaLimite = `${añoLim}-${String(mesLim).padStart(2,"0")}`;
    if (fechaLimite <= claveM) {
      alert("La fecha límite debe ser posterior al mes actual");
      return;
    }
    onGuardar({
      nombre: nombre.trim(), importe, fechaLimite,
      cuentaId: cuentaId || null, ahorradoManual: 0,
    });
  };

  return (
    <div style={{ marginTop:8, padding:"12px", background:"rgba(255,255,255,0.03)", borderRadius:10,
      border:"1px solid rgba(255,255,255,0.08)" }}>
      <input placeholder="Nombre (ej. Viaje a Japón)" value={nombre}
        onChange={e => setNombre(e.target.value)}
        style={{ width:"100%", background:V("--border"), border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:8, padding:"8px 10px", color:V("--text"), fontSize:13, outline:"none",
          fontFamily:"'Inter',sans-serif", marginBottom:8 }}
      />

      <div style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
        <div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginBottom:3 }}>Importe</div>
          <InputMoneda valor={importe} onChange={setImporte} compact ancho={65}/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:V("--text-dim"), marginBottom:3 }}>Fecha límite</div>
          <div style={{ display:"flex", gap:4 }}>
            <select value={mesLim} onChange={e => setMesLim(Number(e.target.value))}
              style={{ flex:1, background:V("--surface-elevated"), border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:8, padding:"5px 6px", color:V("--text"), fontSize:11, outline:"none",
                fontFamily:"'Inter',sans-serif" }}>
              {MESES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <input type="number" min={añoActualNum} max={añoActualNum+30} value={añoLim}
              onChange={e => setAñoLim(Number(e.target.value) || añoActualNum+1)}
              style={{ width:60, background:V("--border"), border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:8, padding:"5px 6px", color:V("--text"), fontSize:11, outline:"none",
                fontFamily:"'JetBrains Mono',monospace", textAlign:"center" }}
            />
          </div>
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-mid") }}>Cuenta vinculada</div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:8, color:V("--text-dim"), marginTop:1 }}>
            el saldo de la cuenta será tu progreso · opcional
          </div>
        </div>
        <SelectorCuenta value={cuentaId} cuentas={cuentas} onChange={setCuentaId}/>
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <button onClick={guardar} style={{
          flex:1, background:V("--accent"), color:V("--bg"), border:"none", borderRadius:8,
          fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", padding:"8px",
        }}>Crear objetivo</button>
        <button onClick={onCancelar} style={{
          padding:"0 14px", background:V("--border"), color:V("--text-dim"),
          border:"none", borderRadius:8, cursor:"pointer", fontSize:13,
        }}>✕</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BLOQUE TEORÍAS DEL AHORRO
// ═══════════════════════════════════════════════════════

const CLASIFICACIONES_DISPONIBLES = [
  { id:"necesidad", label:"Necesidad", color:V("--c2") },
  { id:"deseo",     label:"Deseo",     color:V("--c4") },
  { id:"ahorro",    label:"Ahorro",    color:V("--accent") },
  { id:"deuda",     label:"Deuda",     color:V("--warn") },
  { id:"educacion", label:"Educación", color:V("--c3") },
  { id:"libertad",  label:"Libertad",  color:V("--c3") },
  { id:"dar",       label:"Dar",       color:V("--text-dim") },
];

function BloqueTeoriasAhorro({ gastos, totalIngresos, onReclasificar }) {
  const [teoriaSel, setTeoriaSel] = useState("50_30_20");
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const teoria = TEORIAS_AHORRO[teoriaSel];

  // Total real por cada categoría de la teoría
  const totalGastos = gastos.reduce((a,g) => a + (g.importe || 0), 0);
  // Base de comparación: usamos los ingresos (no los gastos) porque las teorías hablan
  // de % sobre ingresos
  const base = totalIngresos > 0 ? totalIngresos : totalGastos;

  const totalesCategoria = teoria.categorias.map(cat => {
    const real = gastos
      .filter(g => cat.incluye.includes(g.clasif))
      .reduce((a,g) => a + (g.importe || 0), 0);
    const pctReal = base > 0 ? (real / base) * 100 : 0;
    const objetivoEur = base * (cat.pct / 100);
    return { ...cat, real, pctReal, objetivoEur };
  });

  return (
    <div style={{ background:V("--surface"), borderRadius:14,
      border:`1px solid ${V("--border")}`, marginBottom:12, overflow:"hidden" }}>

      {/* Cabecera */}
      <div style={{ padding:"14px 16px" }}>
        <div style={{ fontFamily:UI, fontSize:12, fontWeight:700, color:V("--text-mid"), letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>
          <IconoInline nombre="formula"/>Teoría del ahorro
        </div>

        {/* Selector de teoría */}
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:10 }}>
          {Object.entries(TEORIAS_AHORRO).map(([id, t]) => (
            <button key={id} onClick={() => setTeoriaSel(id)} style={{
              padding:"4px 10px", borderRadius:6, border:"none", cursor:"pointer", fontSize:11,
              fontFamily:"'Inter',sans-serif", fontWeight:600,
              background: teoriaSel === id ? mix(V("--accent"),0.2) : V("--surface-2"),
              color: teoriaSel === id ? V("--accent") : V("--text-dim"),
            }}>{t.nombre}</button>
          ))}
        </div>

        {/* Descripción */}
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-dim"),
          marginBottom:12, lineHeight:1.5, fontStyle:"italic" }}>
          {teoria.descripcion}
          <span style={{ fontSize:9, color:V("--text-dim"), marginLeft:5 }}>— {teoria.autor}</span>
        </div>

        {/* Categorías con barras */}
        {totalesCategoria.map(cat => {
          const dentro = Math.abs(cat.pctReal - cat.pct) <= 5;
          const excede = cat.pctReal > cat.pct + 5;
          return (
            <div key={cat.id} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <div>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, color:V("--text-mid") }}>
                    {cat.label}
                  </span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                    color:V("--text-dim"), marginLeft:6 }}>
                    meta {cat.pct}%
                  </span>
                </div>
                <div style={{ textAlign:"right" }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700,
                    color: excede ? V("--warn") : dentro ? V("--accent") : V("--warn") }}>
                    {cat.pctReal.toFixed(1)}%
                  </span>
                </div>
              </div>
              <BarraProgreso valor={cat.pctReal} maximo={100} color={excede ? V("--warn") : cat.color} altura={6}/>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:V("--text-dim") }}>
                  real {cat.real.toLocaleString("es-ES",{minimumFractionDigits:0})}€
                </span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:V("--text-dim") }}>
                  objetivo {cat.objetivoEur.toLocaleString("es-ES",{minimumFractionDigits:0})}€
                </span>
              </div>
            </div>
          );
        })}

        {/* Toggle para ver/editar la clasificación de cada gasto */}
        <button onClick={() => setMostrarDetalle(d => !d)} style={{
          width:"100%", marginTop:6, padding:"8px", borderRadius:8, border:"none", cursor:"pointer",
          background:"rgba(255,255,255,0.04)", color:V("--text-dim"),
          fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600,
        }}>
          {mostrarDetalle ? "▲ Ocultar clasificación de gastos" : "▼ Ver / re-clasificar gastos"}
        </button>

        {/* Detalle: cada gasto con su clasificación editable */}
        {mostrarDetalle && (
          <div style={{ marginTop:10, padding:"10px", background:"rgba(255,255,255,0.02)", borderRadius:8 }}>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:V("--text-dim"), marginBottom:8, lineHeight:1.4 }}>
              Por defecto: fijos = necesidad, variables = deseo, ahorro = ahorro. Puedes re-clasificar gastos individualmente (ej. el gimnasio como deseo en lugar de necesidad).
            </div>
            {gastos.map(g => (
              <div key={`${g.tipoOrigen}-${g.id}`} style={{
                display:"flex", alignItems:"center", gap:6, padding:"5px 0",
                borderBottom:`1px solid ${V("--border")}`,
              }}>
                <span style={{
                  fontFamily:"'Inter',sans-serif", fontSize:11, color:V("--text-mid"), flex:1, minWidth:0,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>{g.nombre}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:V("--text-dim") }}>
                  {(g.importe||0).toLocaleString("es-ES",{minimumFractionDigits:0})}€
                </span>
                <SelectorClasificacion value={g.clasif}
                  onChange={c => onReclasificar(g.tipoOrigen, g.id, c)}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectorClasificacion({ value, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const actual = CLASIFICACIONES_DISPONIBLES.find(c => c.id === value) || CLASIFICACIONES_DISPONIBLES[0];

  return (
    <div style={{ position:"relative" }}>
      <button onClick={(e) => { e.stopPropagation(); setAbierto(a => !a); }} style={{
        fontFamily:"'Inter',sans-serif", fontSize:9, fontWeight:600,
        color: actual.color, background: mix(actual.color, "20"),
        padding:"2px 6px", borderRadius:4, border:"none", cursor:"pointer",
        display:"flex", alignItems:"center", gap:3,
      }}>
        {actual.label} <span style={{ opacity:0.5, fontSize:7 }}>▾</span>
      </button>
      {abierto && (
        <>
          <div onClick={() => setAbierto(false)} style={{ position:"fixed", inset:0, zIndex:50 }}/>
          <div style={{
            position:"absolute", top:"calc(100% + 4px)", right:0, zIndex:51,
            background:V("--surface-elevated"), border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:8, padding:4, boxShadow:"0 8px 24px rgba(0,0,0,0.4)", minWidth:120,
          }}>
            {CLASIFICACIONES_DISPONIBLES.map(c => (
              <button key={c.id} onClick={() => { onChange(c.id); setAbierto(false); }} style={{
                display:"block", width:"100%", padding:"5px 10px", borderRadius:5,
                border:"none", cursor:"pointer",
                background: c.id === value ? mix(c.color, "15") : "transparent",
                fontFamily:"'Inter',sans-serif", fontSize:11, color: c.color,
                textAlign:"left", fontWeight:600,
              }}>{c.label}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════


function BotonAjustes({ tema, setTema }) {
  const [abierto, setAbierto] = useState(false);
  const fileRef = React.useRef(null);

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importarBackup(file, () => {
      window.location.reload();
    });
    e.target.value = "";
  };

  const reiniciarTodo = () => {
    if (!confirm("¿Borrar TODOS los datos? Esta acción no se puede deshacer.")) return;
    if (!confirm("Última confirmación: se perderá toda la información guardada.")) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  // Limpia todas las cachés y desregistra service workers para forzar carga limpia
  const forzarActualizacion = async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
    } catch (e) { console.error(e); }
    window.location.reload();
  };

  return (
    React.createElement("div", { style: { position: "relative" } },
      React.createElement("button", {
        onClick: () => setAbierto(a => !a),
        style: {
          background: V("--border"), border: "none",
          color: V("--text-dim"), cursor: "pointer", fontSize: 14,
          width: 32, height: 32, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
        }
      }, React.createElement(Icono, { nombre: "ajustes", size: 17, color: V("--text-dim") })),
      abierto && React.createElement(React.Fragment, null,
        React.createElement("div", {
          onClick: () => setAbierto(false),
          style: { position: "fixed", inset: 0, zIndex: 100 }
        }),
        React.createElement("div", {
          style: {
            position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 101,
            background: V("--surface-elevated"), border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, padding: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            minWidth: 200,
          }
        },
          React.createElement("button", {
            onClick: () => { descargarBackup(); setAbierto(false); },
            style: {
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "8px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: "transparent", fontFamily: "'Inter',sans-serif",
              fontSize: 12, color: V("--text-mid"), textAlign: "left",
            }
          }, React.createElement(Icono, { nombre:"exportar", size:15, color:"currentColor" }), " Exportar backup"),
          React.createElement("button", {
            onClick: () => fileRef.current?.click(),
            style: {
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "8px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: "transparent", fontFamily: "'Inter',sans-serif",
              fontSize: 12, color: V("--text-mid"), textAlign: "left",
            }
          }, React.createElement(Icono, { nombre:"importar", size:15, color:"currentColor" }), " Importar backup"),
          React.createElement("input", {
            ref: fileRef, type: "file", accept: "application/json",
            onChange: handleImport, style: { display: "none" }
          }),
          React.createElement("div", {
            style: { height: 1, background: V("--border"), margin: "4px 0" }
          }),
          // ─── Selector de tema ───
          React.createElement("div", {
            style: {
              padding: "6px 10px", fontFamily: "'Inter',sans-serif",
              fontSize: 10, fontWeight: 600, color: V("--text-dim"),
              letterSpacing: "0.1em", textTransform: "uppercase",
            }
          }, React.createElement(Icono, { nombre:"paleta", size:15, color:"currentColor" }), " Tema"),
          React.createElement("div", {
            style: { display: "flex", flexWrap: "wrap", gap: 4, padding: "0 8px 6px" }
          },
            ...Object.entries(TEMAS).map(([id, t]) =>
              React.createElement("button", {
                key: id,
                onClick: () => setTema(id),
                style: {
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 9px", borderRadius: 6,
                  border: tema === id ? `1px solid ${t["--accent"]}` : "1px solid transparent",
                  cursor: "pointer",
                  background: tema === id ? t["--accent"] + "20" : "rgba(255,255,255,0.05)",
                  fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 600,
                  color: tema === id ? t["--accent"] : V("--text-mid"),
                }
              },
                React.createElement("span", {
                  style: {
                    width: 12, height: 12, borderRadius: "50%",
                    background: t["--bg"], border: `2px solid ${t["--accent"]}`,
                    display: "inline-block", flexShrink: 0,
                  }
                }),
                ` ${t.nombre}`
              )
            )
          ),
          React.createElement("div", {
            style: { height: 1, background: V("--border"), margin: "4px 0" }
          }),
          React.createElement("button", {
            onClick: () => { forzarActualizacion(); },
            style: {
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "8px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: "transparent", fontFamily: "'Inter',sans-serif",
              fontSize: 12, color: V("--c2"), textAlign: "left",
            }
          }, React.createElement(Icono, { nombre:"refresh", size:15, color:"currentColor" }), " Forzar actualización"),
          React.createElement("div", {
            style: { height: 1, background: V("--border"), margin: "4px 0" }
          }),
          React.createElement("button", {
            onClick: () => { reiniciarTodo(); },
            style: {
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "8px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: "transparent", fontFamily: "'Inter',sans-serif",
              fontSize: 12, color: V("--warn"), textAlign: "left",
            }
          }, React.createElement(Icono, { nombre:"papelera", size:15, color:"currentColor" }), " Reiniciar todo")
        )
      )
    )
  );
}

function App() {
  const [datos, setDatos] = useState(null);
  const [nav, setNav]     = useState(() => { const d=new Date(); return { mes:d.getMonth(), año:d.getFullYear() }; });
  const [vista, setVista] = useState("inicio");
  const [tema, setTema]   = useState(() => {
    try { return localStorage.getItem(TEMA_KEY) || "midnight"; } catch { return "midnight"; }
  });
  const [bienvenida, setBienvenida] = useState(() => {
    try { return !localStorage.getItem("lo-bienvenida-vista"); } catch { return false; }
  });
  const cerrarBienvenida = () => {
    try { localStorage.setItem("lo-bienvenida-vista", "1"); } catch {}
    setBienvenida(false);
  };

  // Aplicar el tema al cargar y cada vez que cambie
  useEffect(() => {
    aplicarTema(tema);
    try { localStorage.setItem(TEMA_KEY, tema); } catch {}
  }, [tema]);

  useEffect(() => { cargarDatos().then(setDatos); }, []);
  useEffect(() => { if (datos) guardarDatos(datos); }, [datos]);

  const claveM = claveMes(nav.mes, nav.año);

  const onUpdateDatos = useCallback((fn) => {
    setDatos(d => {
      const copia = JSON.parse(JSON.stringify(d || datosVacios()));
      fn(copia);
      return copia;
    });
  }, []);

  // Wrapper para cambios desde una vista de mes M.
  //
  // Reglas:
  // 1. Antes de aplicar, congela los meses ANTERIORES a M sin snapshot
  //    (para que no les afecte el cambio retroactivamente).
  // 2. Aplica el cambio al catálogo global Y a `copia.meses` (donde viven
  //    pagos/puntuales/km del mes). Esto cubre el "presente" y futuros sin snapshot.
  // 3. Para meses POSTERIORES a M que tengan snapshot, replica SOLO los cambios
  //    de catálogos/bancos/etc. en su snapshot — NO las modificaciones en meses[]
  //    (que son propias del mes M y no se deben aplicar dos veces).
  //    Excepción: si el mes está cerrado manualmente (`cerrado: true`), se respeta.
  const onUpdateDatosMes = useCallback((fn) => {
    setDatos(d => {
      const copia = JSON.parse(JSON.stringify(d || datosVacios()));
      const claveActual = claveMes(nav.mes, nav.año);

      // 1. Congelar meses anteriores sin snapshot (con el estado actual del global)
      congelarMesesAnteriores(copia, claveActual);

      // 2. Aplicar el cambio sobre la copia completa (global + meses[]).
      //    Esto cubre el caso normal: si M no tiene snapshot, los cambios al
      //    catálogo van al global; si los hay sobre meses[M], van a su sitio.
      fn(copia);

      // 3. Si M tiene snapshot, replicar los cambios del catálogo en él.
      //    Y también en los snapshots de meses POSTERIORES a M no cerrados.
      //    En esta fase NO tocamos meses[] (pasamos un objeto separado y descartamos).
      const replicarEnSnapshot = (snapshot) => {
        const mesesDummy = {};  // un meses vacío para descartar escrituras
        const puente = {
          catalogoFijos:     snapshot.catalogoFijos,
          catalogoVariables: snapshot.catalogoVariables,
          catalogoAhorro:    snapshot.catalogoAhorro,
          cuentas:           snapshot.cuentas,
          bancosConfig:      snapshot.bancosConfig,
          ingresosBase:      snapshot.ingresosBase,
          reservaImpCuenta:  snapshot.reservaImpCuenta,
          porcentajeExtra:   snapshot.porcentajeExtra,
          anuales:           snapshot.anuales,
          inversiones:       snapshot.inversiones,
          objetivos:         snapshot.objetivos || [],
          inmuebles:         snapshot.inmuebles || [],
          deudas:            snapshot.deudas || [],
          meses:             mesesDummy,  // ← clave: escrituras en meses se descartan
        };
        fn(puente);
        snapshot.catalogoFijos     = puente.catalogoFijos;
        snapshot.catalogoVariables = puente.catalogoVariables;
        snapshot.catalogoAhorro    = puente.catalogoAhorro;
        snapshot.cuentas           = puente.cuentas;
        snapshot.bancosConfig      = puente.bancosConfig;
        snapshot.ingresosBase      = puente.ingresosBase;
        snapshot.reservaImpCuenta  = puente.reservaImpCuenta;
        snapshot.porcentajeExtra   = puente.porcentajeExtra;
        snapshot.anuales           = puente.anuales;
        snapshot.inversiones       = puente.inversiones;
        snapshot.objetivos         = puente.objetivos;
        snapshot.inmuebles         = puente.inmuebles;
        snapshot.deudas            = puente.deudas;
      };

      // Replicar en snapshot del mes actual (si lo tiene)
      const mesActual = copia.meses[claveActual];
      if (mesActual && mesActual.snapshot && !mesActual.cerrado) {
        replicarEnSnapshot(mesActual.snapshot);
      }

      // Replicar en snapshots de meses posteriores no cerrados
      Object.keys(copia.meses).forEach(k => {
        if (k <= claveActual) return;  // anteriores e igual al actual ya tratados
        const mes = copia.meses[k];
        if (!mes || !mes.snapshot) return;
        if (mes.cerrado) return;  // cierre manual: respetar
        replicarEnSnapshot(mes.snapshot);
      });

      return copia;
    });
  }, [nav.mes, nav.año]);

  const irMes = (delta) => {
    const d = new Date(nav.año, nav.mes + delta);
    setNav({ mes: d.getMonth(), año: d.getFullYear() });
  };

  // Cerrar / reabrir mes manualmente (sólo afecta a la UI: bloquea edición).
  // La auto-congelación ya hace que el pasado sea seguro; este candado es por si
  // el usuario quiere asegurar también el mes actual contra cambios accidentales.
  const cerrarMes = () => {
    if (!confirm("¿Cerrar este mes? Quedará en sólo-lectura hasta que lo reabras. (Los meses anteriores ya están protegidos automáticamente al editar futuros.)")) return;
    onUpdateDatos(d => {
      if (!d.meses[claveM]) d.meses[claveM] = estadoMesVacio();
      d.meses[claveM].cerrado = true;
      // Si no tenía snapshot, lo creamos también para asegurar valores fijos
      if (!d.meses[claveM].snapshot) {
        d.meses[claveM].snapshot = crearSnapshotMes(d);
      }
    });
  };
  const reabrirMes = () => {
    if (!confirm("¿Reabrir este mes? Podrás editarlo de nuevo. El snapshot del mes se conservará intacto.")) return;
    onUpdateDatos(d => {
      if (d.meses[claveM]) {
        d.meses[claveM].cerrado = false;
        // OJO: NO borramos el snapshot. Si el mes ya tenía snapshot (porque editaste
        // futuros), ese snapshot DEBE conservarse para que los cálculos sigan siendo
        // los de ese momento. Reabrir significa solo "permitir edición visual".
      }
    });
  };
  // El UI lock se activa con el flag manual `cerrado`
  const cerrado = datos ? mesCerradoManual(datos, claveM) : false;
  // ¿Tiene snapshot por auto-congelación? Para mostrar un indicador discreto
  const tieneSnapshot = datos ? mesEstaCerrado(datos, claveM) : false;

  if (!datos) return (
    <div style={{ background:V("--bg"), minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="pulse" style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:V("--accent") }}>
        cargando…
      </div>
    </div>
  );

  const VISTAS = [
    { id:"inicio",   label:"Ingresos" },
    { id:"gastos",   label:"Gastos" },
    { id:"cartera",  label:"Cartera" },
    { id:"analisis", label:"Análisis" },
  ];

  // Mantener BANCO_META en sincronía con los bancos del usuario (antes de renderizar hijos)
  sincronizarBancoMeta(datosEfectivosMes(datos, claveM).bancosConfig);

  return (
    <div style={{ background:V("--bg"), minHeight:"100vh", maxWidth:480, margin:"0 auto",
      fontFamily:"'Inter',sans-serif", color:V("--text"), paddingBottom:80 }}>
      <style>{css}</style>

      {bienvenida && <PantallaBienvenida onEntrar={cerrarBienvenida}/>}

      <div style={{
        background:`linear-gradient(180deg, ${V("--header-glow")} 0%, transparent 100%)`,
        borderBottom:`1px solid ${V("--border")}`, padding:"14px 20px 0",
        position:"sticky", top:0, zIndex:10, backdropFilter:"blur(12px)",
      }}>
        {/* Marca */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
          <MarcaLO serifSize={22} sansSize={17} isoSize={20}/>
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <button onClick={()=>irMes(-1)} style={{ background:V("--border"), border:"none",
            color:V("--text-dim"), cursor:"pointer", fontSize:16, width:32, height:32, borderRadius:8,
            display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
          <div style={{ textAlign:"center", display:"flex", alignItems:"center", gap:8 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:V("--text-dim"),
                letterSpacing:"0.1em", textTransform:"uppercase" }}>control mensual</div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:20, fontWeight:800, letterSpacing:"-0.02em" }}>
                {MESES[nav.mes]} <span style={{ color:V("--text-dim"), fontWeight:400, fontSize:16 }}>{nav.año}</span>
              </div>
            </div>
            {/* Candado: indicador clicable de mes cerrado/abierto */}
            <button onClick={cerrado ? reabrirMes : cerrarMes} title={cerrado ? "Reabrir mes" : "Cerrar mes"} style={{
              background: cerrado ? mix(V("--warn"),0.18) : V("--border"),
              border: cerrado ? `1px solid ${mix(V("--warn"),"50")}` : "1px solid transparent",
              color: cerrado ? V("--warn") : V("--text-dim"),
              cursor:"pointer", fontSize:16, width:34, height:34, borderRadius:8,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>{cerrado ? <Icono nombre="candado" size={15} color={V("--warn")}/> : <Icono nombre="candadoAbierto" size={15} color={V("--text-dim")}/>}</button>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <button onClick={()=>irMes(1)} style={{ background:V("--border"), border:"none",
              color:V("--text-dim"), cursor:"pointer", fontSize:16, width:32, height:32, borderRadius:8,
              display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
            <BotonAjustes tema={tema} setTema={setTema}/>
          </div>
        </div>
        <div style={{ display:"flex", gap:3, paddingBottom:14 }}>
          {VISTAS.map(v => (
            <button key={v.id} onClick={() => setVista(v.id)} style={{
              flex:1, padding:"8px 2px", borderRadius:10, border:"none", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              background: vista===v.id ? mix(V("--accent"), "20") : "transparent",
              borderBottom: vista===v.id ? `2px solid ${V("--accent")}` : "2px solid transparent",
              transition:"all 0.2s",
            }}>
              <Icono nombre={v.id === "inicio" ? "ingresos" : v.id}
                size={20} color={vista===v.id ? V("--accent") : V("--text-dim")}/>
              <span style={{ fontFamily:UI, fontSize:9, fontWeight:600,
                color: vista===v.id ? V("--accent") : V("--text-dim"), letterSpacing:"0.02em" }}>{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Banner de mes cerrado */}
      {cerrado && (
        <div style={{
          background:`linear-gradient(90deg, ${mix(V("--warn"),0.15)}, ${mix(V("--warn"),0.06)})`,
          border:`1px solid ${mix(V("--warn"),0.3)}`, borderRadius:10,
          margin:"12px 16px 0", padding:"10px 14px",
          display:"flex", alignItems:"center", gap:10,
        }}>
          <Icono nombre="candado" size={18} color={V("--warn")}/>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:700, color:V("--warn") }}>
              Mes cerrado · sólo lectura
            </div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:V("--text-dim"), marginTop:2 }}>
              Pulsa el candado de arriba para reabrir y editar
            </div>
          </div>
        </div>
      )}

      {/* Contenido de la vista (capa pointer-events:none si está cerrado) */}
      <div style={{
        padding:"16px 16px 0",
        pointerEvents: cerrado ? "none" : "auto",
        opacity: cerrado ? 0.85 : 1,
      }}>
        {vista === "inicio"   && <VistaInicio   datos={datos} claveM={claveM} mesNum={nav.mes} onUpdateDatos={onUpdateDatosMes}/>}
        {vista === "gastos"   && <VistaGastos   datos={datos} claveM={claveM} mesNum={nav.mes} onUpdateDatos={onUpdateDatosMes}/>}
        {vista === "cartera"  && <VistaCartera  datos={datos} claveM={claveM} onUpdateDatos={onUpdateDatosMes}/>}
        {vista === "analisis" && <VistaAnalisis datos={datos} claveM={claveM} mesNum={nav.mes} onUpdateDatos={onUpdateDatosMes}/>}
      </div>
    </div>
  );
}


// ─── Montaje en el DOM ───
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
