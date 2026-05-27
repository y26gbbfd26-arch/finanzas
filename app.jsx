const { useState, useEffect, useCallback } = React;


// ═══════════════════════════════════════════════════════
// CONSTANTES Y DATOS BASE
// ═══════════════════════════════════════════════════════

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const BANCO_META = {
  BBVA:  { color: "#00A3E0", label: "BBVA",            icono: "B" },
  TRADE: { color: "#26D07C", label: "Trade Republic",  icono: "T" },
  BANK:  { color: "#FF6B35", label: "Bankinter",        icono: "K" },
  MYINV: { color: "#B06FE8", label: "MyInvestor",       icono: "M" },
};

const TARIFA_KM = 0.20;
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
      { id:"necesidad", label:"Necesidades", pct:50, color:"#00A3E0", incluye:["necesidad"] },
      { id:"deseo",     label:"Deseos",      pct:30, color:"#FF6B35", incluye:["deseo"] },
      { id:"ahorro",    label:"Ahorro",      pct:20, color:"#26D07C", incluye:["ahorro","deuda"] },
    ],
  },
  "70_20_10": {
    nombre: "70 / 20 / 10",
    autor: "Pragmática",
    descripcion: "70% gastos vitales, 20% ahorro, 10% deuda o donación.",
    categorias: [
      { id:"gastos",  label:"Gastos",  pct:70, color:"#00A3E0", incluye:["necesidad","deseo"] },
      { id:"ahorro",  label:"Ahorro",  pct:20, color:"#26D07C", incluye:["ahorro"] },
      { id:"deuda",   label:"Deuda/Dar", pct:10, color:"#FF6B35", incluye:["deuda","dar"] },
    ],
  },
  "jars": {
    nombre: "6 Botes (JARS)",
    autor: "T. Harv Eker",
    descripcion: "Divide cada euro en 6 cuentas con propósitos distintos.",
    categorias: [
      { id:"necesidad",  label:"Necesidades",       pct:55, color:"#00A3E0", incluye:["necesidad"] },
      { id:"ocio",       label:"Ocio/Placer",       pct:10, color:"#FF6B35", incluye:["deseo"] },
      { id:"ahorro",     label:"Ahorro l/p",        pct:10, color:"#26D07C", incluye:["ahorro"] },
      { id:"educacion",  label:"Educación",         pct:10, color:"#E8A838", incluye:["educacion"] },
      { id:"libertad",   label:"Libertad financiera", pct:10, color:"#B06FE8", incluye:["libertad"] },
      { id:"dar",        label:"Dar / Donar",       pct:5,  color:"#8B9DBB", incluye:["dar"] },
    ],
  },
  "80_20": {
    nombre: "80 / 20",
    autor: "Pareto / Ramit Sethi",
    descripcion: "El máximo: 80% para vivir, 20% para ahorrar e invertir.",
    categorias: [
      { id:"gastos",  label:"Gastos",  pct:80, color:"#00A3E0", incluye:["necesidad","deseo","deuda"] },
      { id:"ahorro",  label:"Ahorro",  pct:20, color:"#26D07C", incluye:["ahorro"] },
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
  operativa:  { label: "Operativa",       icono: "💳" },
  emergencia: { label: "Emergencia",      icono: "🛟" },
  anuales:    { label: "Gastos anuales",  icono: "📆" },
  ahorro:     { label: "Ahorro/Objetivo", icono: "🎯" },
  inversion:  { label: "Inversión",       icono: "📈" },
  otros:      { label: "Otros",           icono: "🗂"  },
};

const TIPOS_ACTIVO = {
  fondo:   { label:"Fondo",       color:"#FF6B35", icono:"🏦" },
  etf:     { label:"ETF",         color:"#00A3E0", icono:"📊" },
  accion:  { label:"Acción",      color:"#26D07C", icono:"📈" },
  cripto:  { label:"Cripto",      color:"#E8A838", icono:"₿"  },
  bono:    { label:"Bono",        color:"#B06FE8", icono:"📜" },
  pension: { label:"Plan/Pensión", color:"#8B9DBB", icono:"🛡", soloValor:true },
};

// ─────────────────────────────────────────────────────
// Datos iniciales (solo se cargan si no hay storage)
// ─────────────────────────────────────────────────────

const GASTOS_FIJOS_DEFAULT = [
  { id:"hipoteca",    nombre:"Hipoteca",                importe:600,   banco:"BANK" },
  { id:"prestamo",    nombre:"Préstamo EFE",            importe:83.33, banco:"BANK" },
  { id:"autonomo",    nombre:"Autónomo HNA",            importe:100,   banco:"BBVA" },
  { id:"comida",      nombre:"Comida y gastos comunes", importe:1200,  banco:"BANK" },
  { id:"gasolina",    nombre:"Gasolina",                importe:100,   banco:"BBVA" },
  { id:"crossfit",    nombre:"Crossfit / Gimnasio",     importe:50,    banco:"BBVA" },
];

const GASTOS_VARIABLES_DEFAULT = [
  { id:"icloud",    nombre:"iCloud",       importe:9.99,  banco:"BBVA" },
  { id:"cancer",    nombre:"Asoc. Cáncer", importe:5,     banco:"BBVA" },
  { id:"dazn",      nombre:"DAZN",         importe:14.99, banco:"BBVA" },
  { id:"applecare", nombre:"AppleCare",    importe:11.99, banco:"BBVA" },
];

const GASTOS_AHORRO_DEFAULT = [
  { id:"ahorro_neto", nombre:"Ahorro neto",            importe:1000, banco:"TRADE" },
  { id:"fondo_comun", nombre:"Fondo común (pareja)",   importe:500,  banco:"BANK"  },
  { id:"aport_anual", nombre:"Reserva gastos anuales", importe:300,  banco:"TRADE" },
];

const ANUALES_DEFAULT = {
  "MOROS DE ELDA": {
    icono:"🥁",
    conceptos: [
      { id:"cuota",   nombre:"Cuota anual", importe:600 },
      { id:"derrama", nombre:"Derrama",     importe:700 },
      { id:"desfile", nombre:"Desfile",     importe:350 },
      { id:"otros",   nombre:"Otros",       importe:200 },
    ],
  },
  "BODAS Y CUMPLEAÑOS": {
    icono:"💒",
    conceptos: [
      { id:"fernando", nombre:"Fernando",    importe:700 },
      { id:"pascu",    nombre:"Pascu",       importe:700 },
      { id:"otras",    nombre:"Otras bodas", importe:300 },
    ],
  },
  "IMPUESTOS": {
    icono:"🏛",
    conceptos: [
      { id:"ibi",     nombre:"IBI",          importe:600 },
      { id:"vida",    nombre:"Seg. Vida",    importe:400 },
      { id:"hogar",   nombre:"Seg. Hogar",   importe:900 },
      { id:"vado",    nombre:"Vado",         importe:200 },
    ],
  },
  "VIAJES": {
    icono:"✈️",
    conceptos: [
      { id:"festival", nombre:"Festival", importe:400 },
    ],
  },
  "OTROS": {
    icono:"📦",
    conceptos: [
      { id:"medicos", nombre:"Médicos",     importe:100 },
      { id:"coche",   nombre:"Coche",       importe:1700 },
      { id:"casa",    nombre:"Gastos casa", importe:3000 },
    ],
  },
};

const CUENTAS_DEFAULT = [
  { id:"bbva-op",   banco:"BBVA",  nombre:"Cuenta nómina",    proposito:"operativa",  asignado:0 },
  { id:"bank-op",   banco:"BANK",  nombre:"Cuenta hipoteca",  proposito:"operativa",  asignado:0 },
  { id:"trade-em",  banco:"TRADE", nombre:"Fondo emergencia", proposito:"emergencia", asignado:0 },
  { id:"trade-an",  banco:"TRADE", nombre:"Reserva anuales",  proposito:"anuales",    asignado:0 },
  { id:"myinv-inv", banco:"MYINV", nombre:"Cartera",          proposito:"inversion",  asignado:0 },
];

// ═══════════════════════════════════════════════════════
// STORAGE Y ESTADO
// ═══════════════════════════════════════════════════════

const STORAGE_KEY = "finanzas-v9";

function añoActual() { return new Date().getFullYear(); }

// Configuración por defecto de cada banco: modo "suma" (total = suma cuentas)
// o "reserva" (total manual, libre = total - asignaciones)
const BANCOS_CONFIG_DEFAULT = {
  BBVA:  { modo: "suma",    total: 0 },
  TRADE: { modo: "reserva", total: 0 },
  BANK:  { modo: "suma",    total: 0 },
  MYINV: { modo: "suma",    total: 0 },
};

// Ingresos base por defecto (todos editables, eliminables, ampliables)
const INGRESOS_BASE_DEFAULT = [
  { id: "nomina",  nombre: "Nómina",              importe: 3500 },
  { id: "aportFam", nombre: "Aportación familiar", importe: 650 },
];

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
    ingresosMes: {},       // { fuenteId: importe } para fuentes editables del mes (paga extra, etc.)
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
    return { ...base, ...cargado, meses: cargado.meses || {} };
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
  return d.catalogoAhorro
    .filter(g => g.importe > 0)
    .map(g => ({ ...g, pagado: (mes.pagosAhorro && mes.pagosAhorro[g.id]) || false }));
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
  // Suma de fuentes del mes (extras puntuales que el usuario haya añadido)
  const totalMes = Object.values(mes.ingresosMes || {}).reduce((a, v) => a + (v || 0), 0);
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
  const mesesRestantes = Math.max(1, 11 - mesNum);  // 0=enero…11=diciembre
  const nominaRef = (d.ingresosBase && d.ingresosBase[0]) ? (d.ingresosBase[0].importe || 0) : 0;
  const pct = (d.porcentajeExtra || 0) / 100;
  const extrasFactor = nominaRef * pct;
  return (pendiente - reserva - extrasFactor) / mesesRestantes;
}

// Bancos
function asignadoBanco(cuentas, banco) {
  return cuentas.filter(c => c.banco === banco).reduce((a,c) => a + (c.asignado || 0), 0);
}

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
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
  body { background:#0A0E17; }
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

function Num({ v, decimals=0, color, size=14, mono=true, suffix="€" }) {
  const formatted = typeof v === "number"
    ? v.toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : v;
  return (
    <span style={{
      fontFamily: mono ? "'JetBrains Mono', monospace" : "'Syne', sans-serif",
      fontSize: size, color: color || "#E8EDF5", fontWeight: 500,
    }}>{formatted}{suffix}</span>
  );
}

function BarraProgreso({ valor, maximo, color="#00A3E0", altura=6 }) {
  const pct = maximo > 0 ? Math.min(100, (valor/maximo)*100) : 0;
  const excede = pct >= 100;
  return (
    <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:99, height:altura, overflow:"hidden" }}>
      <div style={{
        width:`${pct}%`, height:"100%", borderRadius:99,
        background: excede ? "#FF4757" : color,
        transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: excede ? "0 0 8px #FF475780" : `0 0 6px ${color}60`,
      }}/>
    </div>
  );
}

function InputMoneda({ valor, onChange, placeholder="0", compact=false, ancho }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:3,
      background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
      borderRadius:8, padding: compact ? "4px 8px" : "7px 10px",
    }}>
      <span style={{ color:"#6B7A99", fontFamily:"'JetBrains Mono',monospace", fontSize: compact?11:13 }}>€</span>
      <input type="number" min="0" step="0.01" value={valor||""} placeholder={placeholder}
        onChange={e => onChange(parseFloat(e.target.value)||0)}
        style={{
          background:"transparent", border:"none", outline:"none",
          width: ancho || (compact ? 65 : 85),
          color:"#E8EDF5", fontFamily:"'JetBrains Mono',monospace", fontSize: compact?12:14,
          textAlign:"right",
        }}
      />
    </div>
  );
}

function InputNumero({ valor, onChange, placeholder="0", sufijo="", compact=false, ancho=85, step=1 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:3,
      background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
      borderRadius:8, padding: compact ? "4px 8px" : "7px 10px",
    }}>
      <input type="number" min="0" step={step} value={valor||""} placeholder={placeholder}
        onChange={e => {
          const v = parseFloat(e.target.value);
          onChange(isNaN(v) ? 0 : v);
        }}
        style={{
          background:"transparent", border:"none", outline:"none", width: ancho,
          color:"#E8EDF5", fontFamily:"'JetBrains Mono',monospace", fontSize: compact?12:14,
          textAlign:"right",
        }}
      />
      {sufijo && <span style={{ color:"#6B7A99", fontFamily:"'JetBrains Mono',monospace", fontSize: compact?11:13 }}>{sufijo}</span>}
    </div>
  );
}

function SelectorBanco({ value, onChange, compact=true }) {
  const [abierto, setAbierto] = useState(false);
  const meta = BANCO_META[value] || { color:"#6B7A99", label:"?" };
  return (
    <div style={{ position:"relative" }}>
      <button onClick={(e) => { e.stopPropagation(); setAbierto(a => !a); }} style={{
        fontFamily:"'JetBrains Mono',monospace", fontSize: compact?9:11, fontWeight:600,
        color: meta.color, background: meta.color + "20",
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
            background:"#0F1521", border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:8, padding:4, boxShadow:"0 8px 24px rgba(0,0,0,0.4)", minWidth:140,
          }}>
            {Object.entries(BANCO_META).map(([id, m]) => (
              <button key={id} onClick={() => { onChange(id); setAbierto(false); }} style={{
                display:"flex", alignItems:"center", gap:8, width:"100%",
                padding:"6px 10px", borderRadius:6, border:"none", cursor:"pointer",
                background: id === value ? m.color + "15" : "transparent",
                fontFamily:"'Syne',sans-serif", fontSize:12, color:"#CBD5E8", textAlign:"left",
              }}>
                <span style={{
                  width:18, height:18, borderRadius:4, background: m.color + "25",
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
        fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:600,
        color: meta ? meta.color : "#6B7A99",
        background: meta ? meta.color + "15" : "rgba(255,255,255,0.05)",
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
            background:"#0F1521", border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:8, padding:4, boxShadow:"0 8px 24px rgba(0,0,0,0.4)",
            minWidth:220, maxHeight:280, overflowY:"auto",
          }}>
            <button onClick={() => { onChange(null); setAbierto(false); }} style={{
              display:"block", width:"100%", padding:"6px 10px", borderRadius:6,
              border:"none", cursor:"pointer", background:"transparent",
              fontFamily:"'Syne',sans-serif", fontSize:12, color:"#6B7A99",
              textAlign:"left", fontStyle:"italic",
            }}>— Sin asignar —</button>
            {cuentas.map(c => {
              const m = BANCO_META[c.banco];
              return (
                <button key={c.id} onClick={() => { onChange(c.id); setAbierto(false); }} style={{
                  display:"flex", alignItems:"center", gap:8, width:"100%",
                  padding:"6px 10px", borderRadius:6, border:"none", cursor:"pointer",
                  background: c.id === value ? m.color + "15" : "transparent",
                  fontFamily:"'Syne',sans-serif", fontSize:12, color:"#CBD5E8",
                  textAlign:"left",
                }}>
                  <span style={{
                    width:18, height:18, borderRadius:4, background: m.color + "25",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:10, fontWeight:800, color: m.color, flexShrink:0,
                  }}>{m.icono}</span>
                  <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {c.nombre}
                  </span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#6B7A99" }}>
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
        background:"rgba(255,255,255,0.05)", color:"#CBD5E8",
      }}>{prop.icono} ▾</button>
      {abierto && (
        <>
          <div onClick={() => setAbierto(false)} style={{ position:"fixed", inset:0, zIndex:50 }}/>
          <div style={{
            position:"absolute", top:"calc(100% + 4px)", right:0, zIndex:51,
            background:"#0F1521", border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:8, padding:4, boxShadow:"0 8px 24px rgba(0,0,0,0.4)", minWidth:140,
          }}>
            {Object.entries(PROPOSITOS).map(([id, p]) => (
              <button key={id} onClick={() => { onChange(id); setAbierto(false); }} style={{
                display:"flex", alignItems:"center", gap:6, width:"100%",
                padding:"5px 8px", borderRadius:5, border:"none", cursor:"pointer",
                background: id === value ? "rgba(38,208,124,0.15)" : "transparent",
                fontFamily:"'Syne',sans-serif", fontSize:11, color:"#CBD5E8", textAlign:"left",
              }}>
                <span>{p.icono}</span> <span>{p.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BotonAnadir({ onClick, label, color="#26D07C" }) {
  return (
    <button onClick={onClick} style={{
      width:"100%", marginTop:8, padding:10, borderRadius:10,
      border:`1.5px dashed ${color}50`, background:"transparent",
      color, cursor:"pointer", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:600,
    }}>+ {label}</button>
  );
}

// Fila de gasto del catálogo: importe y banco son globales, pagado es del mes
function FilaGastoCatalogo({ gasto, onPagado, onImporte, onBanco, onEliminar }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:8, padding:"9px 0",
      borderBottom:"1px solid rgba(255,255,255,0.04)",
    }}>
      <button onClick={onPagado} style={{
        width:20, height:20, borderRadius:5, flexShrink:0, cursor:"pointer",
        border: gasto.pagado ? "none" : "1.5px solid rgba(255,255,255,0.2)",
        background: gasto.pagado ? "#26D07C" : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {gasto.pagado && <span style={{ fontSize:11, color:"#0A0E17", fontWeight:900 }}>✓</span>}
      </button>

      <span style={{
        flex:1, fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:500, minWidth:0,
        color: gasto.pagado ? "#4CAF7D" : "#CBD5E8",
        textDecoration: gasto.pagado ? "line-through" : "none",
        opacity: gasto.pagado ? 0.7 : 1,
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
      }}>{gasto.nombre}</span>

      <SelectorBanco value={gasto.banco} onChange={onBanco}/>
      <InputMoneda valor={gasto.importe} onChange={onImporte} compact ancho={55}/>

      <button onClick={onEliminar} style={{ background:"none", border:"none",
        cursor:"pointer", color:"#FF475760", fontSize:14, padding:"0 2px" }}>×</button>
    </div>
  );
}

function FormularioAnadirGasto({ tipo, onGuardar, onCancelar, colorAccion="#26D07C" }) {
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
        style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:8, padding:"8px 10px", color:"#E8EDF5", fontSize:13, outline:"none",
          fontFamily:"'Syne',sans-serif", marginBottom:8 }}
      />
      <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
        {Object.keys(BANCO_META).map(b => (
          <button key={b} onClick={() => setBanco(b)} style={{
            padding:"4px 10px", borderRadius:8, border:"none", cursor:"pointer", fontSize:10,
            fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            background: banco===b ? BANCO_META[b].color : "rgba(255,255,255,0.06)",
            color: banco===b ? "#0A0E17" : "#6B7A99",
          }}>{b}</button>
        ))}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <InputMoneda valor={importe} onChange={setImporte}/>
        <button onClick={guardar} style={{
          flex:1, background:colorAccion, color:"#0A0E17", border:"none", borderRadius:8,
          fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer",
        }}>Guardar</button>
        <button onClick={onCancelar} style={{
          padding:"0 12px", background:"rgba(255,255,255,0.06)", color:"#6B7A99",
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
    onUpdateDatos(d => {
      d.cuentas.push({ ...data, banco, id: `cuenta-${Date.now()}` });
    });
    setAnadiendoEn(null);
  };

  return (
    <div style={{ background:"rgba(255,255,255,0.025)", borderRadius:14, marginBottom:12,
      border:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" }}>

      {/* Cabecera con resumen */}
      <div onClick={() => setAbierto(a => !a)}
        style={{ padding:"14px 16px", cursor:"pointer",
          borderBottom: abierto ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:abierto ? 10 : 0 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, color:"#6B7A99",
            letterSpacing:"0.1em", textTransform:"uppercase" }}>🏦 Bancos y cuentas</div>
          <span style={{ color:"#6B7A99", fontSize:14 }}>{abierto ? "▲" : "▼"}</span>
        </div>

        {/* Resumen siempre visible */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6 }}>
          <div style={{ textAlign:"center", background:"rgba(0,163,224,0.08)", borderRadius:8, padding:"8px 4px" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:"#00A3E0" }}>
              {totalLiquido.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:8, color:"#6B7A99", marginTop:2 }}>Líquido</div>
          </div>
          <div style={{ textAlign:"center", background:"rgba(176,111,232,0.08)", borderRadius:8, padding:"8px 4px" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:"#B06FE8" }}>
              {totalCompartido.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:8, color:"#6B7A99", marginTop:2 }}>
              🤝 50% ({saldoCompartido.toLocaleString("es-ES",{minimumFractionDigits:0})}€)
            </div>
          </div>
          <div style={{ textAlign:"center", background:"rgba(255,107,53,0.08)", borderRadius:8, padding:"8px 4px" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:"#FF6B35" }}>
              {totalAsignado.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:8, color:"#6B7A99", marginTop:2 }}>Asignado</div>
          </div>
          <div style={{ textAlign:"center",
            background: libreTotal >= 0 ? "rgba(38,208,124,0.08)" : "rgba(255,71,87,0.08)",
            borderRadius:8, padding:"8px 4px" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700,
              color: libreTotal >= 0 ? "#26D07C" : "#FF4757" }}>
              {libreTotal >= 0 ? "+" : ""}{libreTotal.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:8, color:"#6B7A99", marginTop:2 }}>Libre</div>
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
                      width:24, height:24, borderRadius:6, background: meta.color + "25",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:800, color: meta.color,
                    }}>{meta.icono}</div>
                    <div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:"#CBD5E8" }}>
                        {meta.label}
                      </div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#6B7A99", marginTop:1 }}>
                        {esSuma ? "🧮 suma de cuentas" : "🎯 total manual + reservas"}
                      </div>
                    </div>
                  </div>
                  {/* Toggle modo: suma / reserva */}
                  <button onClick={() => setModoBanco(bancoId, esSuma ? "reserva" : "suma")} style={{
                    padding:"3px 8px", borderRadius:5, border:"none", cursor:"pointer", fontSize:9,
                    fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
                    background: "rgba(255,255,255,0.06)", color:"#8B9DBB",
                  }}>{esSuma ? "→ reserva" : "→ suma"}</button>
                </div>

                {/* Total del banco: editable si reserva, display si suma */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  marginBottom:10, padding:"6px 8px", borderRadius:6,
                  background: meta.color + "10" }}>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:"#8B9DBB" }}>
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
                  <div style={{ padding:"8px", textAlign:"center", fontFamily:"'Syne',sans-serif",
                    fontSize:11, color:"#6B7A99", fontStyle:"italic" }}>
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
                      borderBottom:"1px solid rgba(255,255,255,0.04)",
                      background: esCompartida ? "rgba(176,111,232,0.04)" : "transparent",
                    }}>
                      <span style={{ fontSize:12, width:18, textAlign:"center" }}>{prop.icono}</span>
                      {enEdicion ? (
                        <input value={c.nombre}
                          onChange={e => actualizarCuenta(c.id, { nombre: e.target.value })}
                          onBlur={() => setEditandoNombre(null)}
                          autoFocus
                          style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid "+meta.color+"40",
                            borderRadius:5, padding:"3px 6px", color:"#E8EDF5", fontSize:12, outline:"none",
                            fontFamily:"'Syne',sans-serif", minWidth:0 }}
                        />
                      ) : (
                        <span onClick={() => setEditandoNombre(c.id)} style={{
                          flex:1, fontFamily:"'Syne',sans-serif", fontSize:12, color:"#CBD5E8",
                          cursor:"pointer", minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        }}>
                          {esCompartida && <span style={{ marginRight:4 }}>🤝</span>}
                          {c.nombre}
                          <span style={{ fontSize:9, color:"#6B7A99", marginLeft:5 }}>
                            {prop.label}{esCompartida ? " · 50%" : ""}
                          </span>
                        </span>
                      )}
                      {/* Botón pequeño para alternar compartida */}
                      <button onClick={() => actualizarCuenta(c.id, { compartida: !esCompartida })} title={esCompartida ? "Quitar compartida" : "Marcar compartida"} style={{
                        fontSize:11, padding:"2px 5px", borderRadius:4, border:"none", cursor:"pointer",
                        background: esCompartida ? "rgba(176,111,232,0.2)" : "rgba(255,255,255,0.05)",
                        color: esCompartida ? "#B06FE8" : "#6B7A99",
                      }}>🤝</button>
                      <SelectorProposito value={c.proposito} onChange={p => actualizarCuenta(c.id, { proposito: p })}/>
                      <InputMoneda valor={c.asignado} onChange={v => actualizarCuenta(c.id, { asignado: v })} compact ancho={55}/>
                      <button onClick={() => eliminarCuenta(c.id)} style={{ background:"none", border:"none",
                        cursor:"pointer", color:"#FF475760", fontSize:13, padding:"0 2px" }}>×</button>
                    </div>
                  );
                })}

                {/* Solo en modo reserva: indicador de libre */}
                {!esSuma && cuentasBanco.length > 0 && (
                  <div style={{
                    marginTop:8, padding:"8px 10px", borderRadius:8,
                    background: libre >= 0 ? "rgba(38,208,124,0.06)" : "rgba(255,71,87,0.08)",
                    border: `1px solid ${libre >= 0 ? "#26D07C25" : "#FF475730"}`,
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:"#8B9DBB" }}>
                        reservado <span style={{ color:"#CBD5E8", fontFamily:"'JetBrains Mono',monospace" }}>
                          {asignado.toLocaleString("es-ES",{minimumFractionDigits:0})}€
                        </span>
                      </span>
                      <span style={{
                        fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700,
                        color: libre >= 0 ? "#26D07C" : "#FF4757",
                      }}>
                        🔓 {libre >= 0 ? "+" : ""}{libre.toLocaleString("es-ES",{minimumFractionDigits:0})}€ libre
                      </span>
                    </div>
                    {libre < 0 && (
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#FF4757", marginTop:4 }}>
                        ⚠ Has reservado más de lo que tienes en el banco
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FormularioAnadirCuenta({ onGuardar, onCancelar, colorAccion="#26D07C" }) {
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
        style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:6, padding:"6px 10px", color:"#E8EDF5", fontSize:12, outline:"none",
          fontFamily:"'Syne',sans-serif", marginBottom:6 }}
      />
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
        {Object.entries(PROPOSITOS).map(([id, p]) => (
          <button key={id} onClick={() => setProposito(id)} style={{
            padding:"3px 7px", borderRadius:5, border:"none", cursor:"pointer", fontSize:10,
            fontFamily:"'Syne',sans-serif", fontWeight:600,
            background: proposito === id ? colorAccion + "25" : "rgba(255,255,255,0.05)",
            color: proposito === id ? colorAccion : "#6B7A99",
          }}>{p.icono} {p.label}</button>
        ))}
      </div>

      {/* Toggle compartida */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"6px 0", marginBottom:8 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:"#CBD5E8" }}>
            🤝 Cuenta compartida
          </div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, color:"#6B7A99", marginTop:1 }}>
            no suma al banco · cuenta el 50% en patrimonio
          </div>
        </div>
        <button onClick={() => setCompartida(c => !c)} style={{
          padding:"3px 10px", borderRadius:16, border:"none", cursor:"pointer", fontSize:10,
          fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
          background: compartida ? "rgba(176,111,232,0.2)" : "rgba(255,255,255,0.06)",
          color: compartida ? "#B06FE8" : "#6B7A99",
        }}>{compartida ? "SÍ" : "NO"}</button>
      </div>

      <div style={{ display:"flex", gap:6 }}>
        <InputMoneda valor={asignado} onChange={setAsignado} compact ancho={70}/>
        <button onClick={guardar} style={{
          flex:1, background:colorAccion, color:"#0A0E17", border:"none", borderRadius:6,
          fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer",
        }}>Crear</button>
        <button onClick={onCancelar} style={{
          padding:"0 10px", background:"rgba(255,255,255,0.06)", color:"#6B7A99",
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
  const aportacion = calcularAportacionAnual(datos, mesNum, claveM);
  const pendienteAnual = totalAnualesPendiente(dEf);

  const [anadiendoFuente, setAnadiendoFuente] = useState(false);

  const mes = getMes(datos, claveM);

  const cuentaReservaImp = dEf.cuentas.find(c => c.id === dEf.reservaImpCuenta);
  const saldoReservaImp = cuentaReservaImp ? cuentaReservaImp.asignado : 0;
  const pct = dEf.porcentajeExtra || 0;

  // Setters (no se llaman si el mes está cerrado, gracias al pointer-events:none de App)
  const setIngresoBaseCampo = (id, campo, valor) => onUpdateDatos(d => {
    d.ingresosBase = d.ingresosBase.map(f => f.id === id ? { ...f, [campo]: valor } : f);
  });
  const eliminarIngreso = (id) => onUpdateDatos(d => {
    d.ingresosBase = d.ingresosBase.filter(f => f.id !== id);
  });
  const añadirIngreso = (nombre, importe) => {
    onUpdateDatos(d => {
      d.ingresosBase.push({ id: `ing-${Date.now()}`, nombre, importe });
    });
    setAnadiendoFuente(false);
  };
  const setKm = (v) => onUpdateDatos(d => {
    if (!d.meses[claveM]) d.meses[claveM] = estadoMesVacio();
    d.meses[claveM].km = v;
  });
  const setReservaImpCuenta = (id) => onUpdateDatos(d => { d.reservaImpCuenta = id; });
  const setPorcentajeExtra = (v) => onUpdateDatos(d => {
    d.porcentajeExtra = Math.max(0, Math.min(100, v));
  });

  return (
    <div className="slide-in">

      {/* 1. BANCOS (primer bloque, info principal) */}
      <BloqueBancos datos={dEf} onUpdateDatos={onUpdateDatos}/>

      {/* 2. INGRESOS DEL MES */}
      <div style={{ background:"rgba(255,255,255,0.025)", borderRadius:14, padding:"14px 16px", marginBottom:12,
        border:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, color:"#6B7A99",
            letterSpacing:"0.1em", textTransform:"uppercase" }}>Ingresos del mes</div>
          <Num v={totalIngresos} decimals={0} color="#26D07C" size={14}/>
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
            background:"rgba(255,255,255,0.03)", color:"#6B7A99",
            fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:600, marginTop:4,
          }}>+ Añadir fuente de ingreso</button>
        )}

        {/* Km (no se hereda) */}
        <div style={{ padding:"9px 0", marginTop:4, borderTop:"1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, color:"#CBD5E8" }}>
                Km coche trabajo
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"#FF8C42",
                  background:"rgba(255,140,66,0.12)", padding:"1px 5px", borderRadius:3, marginLeft:5 }}>SOLO MES</span>
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#6B7A99", marginTop:2 }}>
                {TARIFA_KM.toFixed(2).replace(".",",")}€/km · <span style={{ color:"#26D07C" }}>+{ingresoKm.toLocaleString("es-ES",{minimumFractionDigits:2})}€</span>
              </div>
            </div>
            <InputNumero valor={mes.km} onChange={setKm} sufijo="km" compact />
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"#CBD5E8" }}>TOTAL</span>
          <Num v={totalIngresos} decimals={2} color="#26D07C" size={15}/>
        </div>
      </div>

      {/* 3. APORTACIÓN A GASTOS ANUALES (al final, más pequeña) */}
      <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:12, padding:"12px 14px",
        border:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, color:"#6B7A99",
            letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Aportación gastos anuales
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700, color:"#26D07C" }}>
              {Math.max(0, aportacion).toFixed(0)}€<span style={{ fontSize:10, color:"#6B7A99", marginLeft:3 }}>/mes</span>
            </div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#FF6B35" }}>
              pendiente {pendienteAnual.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </div>
          </div>
        </div>

        {/* % del extra a destinar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:"#CBD5E8" }}>% del extra a destinar</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#6B7A99", marginTop:1 }}>
              del sueldo extra anual
            </div>
          </div>
          <InputNumero valor={pct} onChange={setPorcentajeExtra} sufijo="%" compact ancho={45} step={0.1}/>
        </div>

        {/* Cuenta vinculada */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:"#CBD5E8" }}>Cuenta de la reserva</span>
          <SelectorCuenta value={datos.reservaImpCuenta} cuentas={datos.cuentas}
            onChange={setReservaImpCuenta}/>
        </div>

        {/* Reserva impuestos = saldo de la cuenta */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0" }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:"#CBD5E8" }}>Reserva impuestos</div>
            {cuentaReservaImp ? (
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, color:"#6B7A99", marginTop:1 }}>
                desde {cuentaReservaImp.nombre}
              </div>
            ) : (
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, color:"#FF8C42", marginTop:1 }}>
                sin cuenta asignada
              </div>
            )}
          </div>
          <span style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700,
            color: cuentaReservaImp ? "#26D07C" : "#6B7A99",
          }}>
            {saldoReservaImp.toLocaleString("es-ES",{minimumFractionDigits:0})}€
          </span>
        </div>

        <div style={{ marginTop:8, fontFamily:"'Syne',sans-serif", fontSize:9, color:"#6B7A99",
          padding:"6px 8px", background:"rgba(0,163,224,0.05)", borderRadius:5, lineHeight:1.4 }}>
          📐 (pendiente − reserva imp.{pct > 0 ? ` − ${pct.toFixed(2)}% del extra` : ""}) ÷ {11-mesNum} meses
        </div>
      </div>
    </div>
  );
}

// Fila editable de una fuente de ingreso fija
function FilaIngreso({ fuente, onNombre, onImporte, onEliminar }) {
  const [editando, setEditando] = useState(false);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 0",
      borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
      {editando ? (
        <input value={fuente.nombre}
          onChange={e => onNombre(e.target.value)}
          onBlur={() => setEditando(false)}
          autoFocus
          style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)",
            borderRadius:5, padding:"3px 6px", color:"#E8EDF5", fontSize:13, outline:"none",
            fontFamily:"'Syne',sans-serif", minWidth:0 }}
        />
      ) : (
        <span onClick={() => setEditando(true)} style={{
          flex:1, fontFamily:"'Syne',sans-serif", fontSize:13, color:"#CBD5E8",
          cursor:"pointer", minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        }}>
          {fuente.nombre}
        </span>
      )}
      <InputMoneda valor={fuente.importe} onChange={onImporte} compact />
      <button onClick={onEliminar} style={{ background:"none", border:"none",
        cursor:"pointer", color:"#FF475760", fontSize:14, padding:"0 2px" }}>×</button>
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
        style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:6, padding:"6px 10px", color:"#E8EDF5", fontSize:12, outline:"none",
          fontFamily:"'Syne',sans-serif", marginBottom:6 }}
      />
      <div style={{ display:"flex", gap:6 }}>
        <InputMoneda valor={importe} onChange={setImporte} compact ancho={70}/>
        <button onClick={guardar} style={{
          flex:1, background:"#26D07C", color:"#0A0E17", border:"none", borderRadius:6,
          fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer",
        }}>Añadir</button>
        <button onClick={onCancelar} style={{
          padding:"0 10px", background:"rgba(255,255,255,0.06)", color:"#6B7A99",
          border:"none", borderRadius:6, cursor:"pointer", fontSize:12,
        }}>✕</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// VISTA GASTOS MENSUALES
// ═══════════════════════════════════════════════════════

function VistaGastos({ datos, claveM, onUpdateDatos }) {
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
    onUpdateDatos(d => {
      d[catalogo].push({ ...data, id: `${catalogo}-${Date.now()}` });
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
    onUpdateDatos(d => {
      if (!d.meses[claveM]) d.meses[claveM] = estadoMesVacio();
      d.meses[claveM].puntuales.push({ ...data, id: `punt-${Date.now()}`, pagado:false });
    });
    setAnadiendo(null);
  };

  const Section = ({ id, titulo, icono, total, children }) => (
    <div style={{ background:"rgba(255,255,255,0.025)", borderRadius:14, marginBottom:10,
      border:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" }}>
      <div onClick={() => setSeccionAbierta(s => ({...s,[id]:!s[id]}))}
        style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"12px 14px", cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16 }}>{icono}</span>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"#CBD5E8" }}>{titulo}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Num v={total} decimals={2} color="#E8A838" size={13}/>
          <span style={{ color:"#6B7A99", fontSize:12 }}>{seccionAbierta[id] ? "▲" : "▼"}</span>
        </div>
      </div>
      {seccionAbierta[id] && <div style={{ padding:"0 14px 12px" }}>{children}</div>}
    </div>
  );

  return (
    <div className="slide-in">
      {/* Resumen */}
      <div style={{ background:"rgba(255,255,255,0.025)", borderRadius:14, padding:"14px 16px",
        border:"1px solid rgba(255,255,255,0.06)", marginBottom:14 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
          {[
            { label:"Gastos", v:tGastos,    color:"#E8A838" },
            { label:"Pagado", v:totalPagado,color:"#26D07C" },
            { label:"Remanente", v:remanente,color: remanente >= 0 ? "#26D07C" : "#FF4757" },
          ].map(({ label, v, color }) => (
            <div key={label} style={{ textAlign:"center", background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"10px 4px" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:600, color }}>
                {v.toLocaleString("es-ES",{minimumFractionDigits:0})}€
              </div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, color:"#6B7A99", marginTop:3 }}>{label}</div>
            </div>
          ))}
        </div>
        <BarraProgreso valor={totalPagado} maximo={tGastos||1} color="#26D07C" altura={6}/>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#6B7A99", marginTop:6, textAlign:"center" }}>
          {tGastos > 0 ? ((totalPagado/tGastos)*100).toFixed(0) : 0}% pagado · ingresos {totalIngresos.toLocaleString("es-ES",{minimumFractionDigits:0})}€
        </div>
      </div>

      <div style={{ background:"rgba(255,140,66,0.05)", border:"1px solid rgba(255,140,66,0.15)",
        borderRadius:10, padding:"8px 12px", marginBottom:10,
        fontFamily:"'Syne',sans-serif", fontSize:10, color:"#FF8C42", lineHeight:1.5 }}>
        ℹ️ Editar importe/banco cambia el catálogo global. Los checks de pagado son del mes y quedan registrados como histórico.
      </div>

      {/* FIJOS */}
      <Section id="fijos" titulo="Gastos Fijos" icono="🏠" total={tFijos}>
        {fijos.length === 0 && (
          <div style={{ padding:"12px 0", textAlign:"center", fontFamily:"'Syne',sans-serif",
            fontSize:12, color:"#6B7A99", fontStyle:"italic" }}>Sin gastos fijos activos</div>
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
            onCancelar={() => setAnadiendo(null)} colorAccion="#26D07C"/>
        ) : (
          <BotonAnadir onClick={() => setAnadiendo("fijos")} label="Añadir gasto fijo" color="#26D07C"/>
        )}
      </Section>

      {/* VARIABLES */}
      <Section id="variables" titulo="Gastos Variables" icono="📱" total={tVars}>
        {variables.length === 0 && (
          <div style={{ padding:"12px 0", textAlign:"center", fontFamily:"'Syne',sans-serif",
            fontSize:12, color:"#6B7A99", fontStyle:"italic" }}>Sin gastos variables activos</div>
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
            onCancelar={() => setAnadiendo(null)} colorAccion="#00A3E0"/>
        ) : (
          <BotonAnadir onClick={() => setAnadiendo("variables")} label="Añadir gasto variable" color="#00A3E0"/>
        )}
      </Section>

      {/* AHORRO */}
      <Section id="ahorro" titulo="Ahorro" icono="💰" total={tAhorro}>
        {ahorro.length === 0 && (
          <div style={{ padding:"12px 0", textAlign:"center", fontFamily:"'Syne',sans-serif",
            fontSize:12, color:"#6B7A99", fontStyle:"italic" }}>Sin partidas de ahorro activas</div>
        )}
        {ahorro.map(g => (
          <FilaGastoCatalogo key={g.id} gasto={g}
            onPagado={() => togglePagado("pagosAhorro", g.id)}
            onImporte={v => cambiarCatalogoGasto("catalogoAhorro", g.id, "importe", v)}
            onBanco={b => cambiarCatalogoGasto("catalogoAhorro", g.id, "banco", b)}
            onEliminar={() => eliminarDelCatalogo("catalogoAhorro", g.id)}
          />
        ))}
        {anadiendo === "ahorro" ? (
          <FormularioAnadirGasto tipo="ahorro"
            onGuardar={d => añadirAlCatalogo("catalogoAhorro", d)}
            onCancelar={() => setAnadiendo(null)} colorAccion="#E8A838"/>
        ) : (
          <BotonAnadir onClick={() => setAnadiendo("ahorro")} label="Añadir partida de ahorro" color="#E8A838"/>
        )}
      </Section>

      {/* PUNTUALES */}
      <Section id="puntuales" titulo="Gastos Puntuales" icono="⚡" total={tPunt}>
        {puntuales.length === 0 && (
          <div style={{ padding:"12px 0", textAlign:"center", fontFamily:"'Syne',sans-serif",
            fontSize:12, color:"#6B7A99", fontStyle:"italic" }}>Sin gastos puntuales este mes</div>
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
            onCancelar={() => setAnadiendo(null)} colorAccion="#FF6B35"/>
        ) : (
          <BotonAnadir onClick={() => setAnadiendo("puntuales")} label="Añadir gasto puntual" color="#FF6B35"/>
        )}
      </Section>
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
    onUpdateDatos(d => {
      d.anuales.catalogo[categoria].conceptos.push({
        ...data, id: `concepto-${Date.now()}`, pagado: 0, cerrado: false,
      });
    });
    setAnadiendoConceptoEn(null);
  };

  const eliminarBloque = (categoria) => onUpdateDatos(d => {
    delete d.anuales.catalogo[categoria];
  });

  const añadirBloque = (nombre) => {
    onUpdateDatos(d => {
      d.anuales.catalogo[nombre] = { icono:"📁", conceptos:[] };
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
      <div style={{ background:"rgba(255,255,255,0.025)", borderRadius:14, padding:"14px 16px",
        border:"1px solid rgba(255,255,255,0.06)", marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, color:"#6B7A99",
            letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Gastos anuales {añoCatalogo}
          </div>
          {añoCatalogo < añoAhora && (
            <button onClick={reiniciarAño} style={{
              padding:"4px 10px", borderRadius:6, border:"1px solid #FF8C4250",
              background:"#FF8C4215", color:"#FF8C42", cursor:"pointer", fontSize:10,
              fontFamily:"'Syne',sans-serif", fontWeight:600,
            }}>⟳ Reiniciar a {añoAhora}</button>
          )}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
          {[
            { label:"Total año", v:totalAño,       color:"#CBD5E8" },
            { label:"Pagado",    v:totalPagado,    color:"#26D07C" },
            { label:"Pendiente", v:totalPendiente, color:"#FF6B35" },
          ].map(({ label, v, color }) => (
            <div key={label} style={{ textAlign:"center", background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"10px 4px" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:600, color }}>
                {v.toLocaleString("es-ES",{minimumFractionDigits:0})}€
              </div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, color:"#6B7A99", marginTop:3 }}>{label}</div>
            </div>
          ))}
        </div>
        <BarraProgreso valor={totalPagado} maximo={totalAño||1} color="#26D07C" altura={5}/>
      </div>

      {/* Bloques */}
      {Object.entries(dEf.anuales.catalogo).map(([cat, info]) => {
        const total = totalCategoriaAnual(info);
        const pagado = pagadoCategoriaAnual(dEf, cat);
        const pendiente = total - pagado;

        return (
          <div key={cat} style={{ background:"rgba(255,255,255,0.025)", borderRadius:14,
            border:"1px solid rgba(255,255,255,0.06)", marginBottom:10, overflow:"hidden" }}>
            <div style={{ padding:"12px 14px" }}>
              {/* Cabecera */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:16 }}>{info.icono}</span>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"#CBD5E8" }}>{cat}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Num v={total} decimals={0} color="#CBD5E8" size={13}/>
                  <button onClick={() => {
                    if (confirm(`¿Eliminar el bloque "${cat}" entero?`)) eliminarBloque(cat);
                  }} style={{ background:"none", border:"none", color:"#FF475760",
                    cursor:"pointer", fontSize:14 }}>×</button>
                </div>
              </div>
              <BarraProgreso valor={pagado} maximo={total||1} color="#26D07C" altura={4}/>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#26D07C" }}>
                  pagado {pagado.toLocaleString("es-ES",{minimumFractionDigits:0})}€
                </span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#FF6B35" }}>
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
                    background:"none", border:"none", color:"#6B7A99", cursor:"pointer",
                    fontFamily:"'Syne',sans-serif", fontSize:10, padding:"4px 0", marginTop:2,
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
        <BotonAnadir onClick={() => setAnadiendoBloque(true)} label="Añadir nuevo bloque" color="#B06FE8"/>
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
          background: cerrado ? "#26D07C" : "transparent",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {cerrado && <span style={{ fontSize:9, color:"#0A0E17", fontWeight:900 }}>✓</span>}
        </button>

        {editando ? (
          <input value={concepto.nombre}
            onChange={e => onNombre(e.target.value)}
            onBlur={() => setEditando(false)}
            autoFocus
            style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)",
              borderRadius:5, padding:"2px 6px", color:"#E8EDF5", fontSize:11, outline:"none",
              fontFamily:"'Syne',sans-serif" }}
          />
        ) : (
          <span onClick={() => setEditando(true)} style={{
            flex:1, fontFamily:"'Syne',sans-serif", fontSize:11,
            color: cerrado ? "#4CAF7D" : "#CBD5E8",
            textDecoration: cerrado ? "line-through" : "none",
            opacity: cerrado ? 0.7 : 1,
            cursor:"pointer", minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>
            {concepto.nombre}
            {cerrado && concepto.mesPago && (
              <span style={{ fontSize:8, color:"#26D07C", marginLeft:5, opacity:0.8 }}>
                {concepto.mesPago}
              </span>
            )}
          </span>
        )}
        <InputMoneda valor={importe} onChange={onImporte} compact ancho={45}/>
        <button onClick={onEliminar} style={{ background:"none", border:"none",
          cursor:"pointer", color:"#FF475760", fontSize:13, padding:"0 4px" }}>×</button>
      </div>

      {/* Sub-fila: pagado parcial + barra de progreso (solo si no está cerrado) */}
      {!cerrado && (
        <div style={{ display:"flex", alignItems:"center", gap:8, paddingLeft:22 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#6B7A99", minWidth:42 }}>
            pagado
          </span>
          <InputMoneda valor={pagado} onChange={onPagadoImporte} compact ancho={45}/>
          <div style={{ flex:1, minWidth:0 }}>
            <BarraProgreso valor={pagado} maximo={importe || 1} color="#26D07C" altura={3}/>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:2 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"#6B7A99" }}>
                {pct.toFixed(0)}%
              </span>
              {pendiente > 0 && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"#FF8C42" }}>
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
        style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:5, padding:"4px 8px", color:"#E8EDF5", fontSize:11, outline:"none",
          fontFamily:"'Syne',sans-serif" }}
      />
      <InputMoneda valor={importe} onChange={setImporte} compact ancho={50}/>
      <button onClick={() => { if (nombre.trim()) onGuardar({ nombre: nombre.trim(), importe }); }} style={{
        background:"#26D07C", color:"#0A0E17", border:"none", borderRadius:5,
        padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif",
      }}>✓</button>
      <button onClick={onCancelar} style={{
        background:"rgba(255,255,255,0.06)", color:"#6B7A99", border:"none", borderRadius:5,
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
        style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:6, padding:"6px 10px", color:"#E8EDF5", fontSize:13, outline:"none",
          fontFamily:"'Syne',sans-serif", marginBottom:8 }}
      />
      <div style={{ display:"flex", gap:6 }}>
        <button onClick={() => { if (nombre.trim()) onGuardar(nombre.trim()); }} style={{
          flex:1, background:"#B06FE8", color:"#0A0E17", border:"none", borderRadius:6,
          fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer", padding:"6px",
        }}>Crear bloque</button>
        <button onClick={onCancelar} style={{
          padding:"0 10px", background:"rgba(255,255,255,0.06)", color:"#6B7A99",
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
      background:"rgba(255,255,255,0.025)", borderRadius:12,
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
            }}>{tipo.icono} {tipo.label}</span>
            {inv.entidad && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color:"#6B7A99", fontWeight:600 }}>{inv.entidad}</span>
            )}
          </div>
          {editandoMeta ? (
            <input value={inv.nombre} placeholder="Nombre"
              onChange={e => onUpdate({ ...inv, nombre: e.target.value })}
              onBlur={() => setEditandoMeta(false)}
              autoFocus
              style={{ width:"100%", background:"rgba(255,255,255,0.06)",
                border:"1px solid rgba(255,255,255,0.15)", borderRadius:5,
                padding:"3px 6px", color:"#E8EDF5", fontSize:13, outline:"none",
                fontFamily:"'Syne',sans-serif" }}
            />
          ) : (
            <div onClick={() => setEditandoMeta(true)} style={{
              fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600,
              color:"#CBD5E8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              cursor:"pointer",
            }}>
              {inv.nombre}
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={() => setEditandoMeta(m => !m)} style={{
            background:"rgba(255,255,255,0.06)", border:"none",
            color:"#6B7A99", cursor:"pointer", fontSize:11, padding:"2px 6px", borderRadius:4,
          }}>{editandoMeta ? "✓" : "✎"}</button>
          <button onClick={onEliminar} style={{
            background:"none", border:"none", color:"#FF475760",
            cursor:"pointer", fontSize:16, padding:"0 2px",
          }}>×</button>
        </div>
      </div>

      {/* Selector de tipo (solo en edición) */}
      {editandoMeta && (
        <div style={{ marginBottom:10 }}>
          <input value={inv.entidad || ""} placeholder="Entidad (ej. HNA, MyInvestor, Trade)"
            onChange={e => onUpdate({ ...inv, entidad: e.target.value })}
            style={{ width:"100%", background:"rgba(255,255,255,0.06)",
              border:"1px solid rgba(255,255,255,0.1)", borderRadius:6,
              padding:"6px 10px", color:"#E8EDF5", fontSize:12, outline:"none",
              fontFamily:"'JetBrains Mono',monospace", marginBottom:6 }}
          />
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {Object.entries(TIPOS_ACTIVO).map(([id, t]) => (
              <button key={id} onClick={() => onUpdate({ ...inv, tipo: id })} style={{
                padding:"3px 8px", borderRadius:6, border:"none", cursor:"pointer", fontSize:10,
                fontFamily:"'Syne',sans-serif", fontWeight:600,
                background: inv.tipo === id ? t.color + "25" : "rgba(255,255,255,0.05)",
                color: inv.tipo === id ? t.color : "#6B7A99",
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
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#6B7A99", marginBottom:2 }}>
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
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, color:"#6B7A99", marginBottom:3 }}>
                Inversión inicial
              </div>
              <InputMoneda valor={inv.invertido} onChange={v => onUpdate({ ...inv, invertido: v })} compact ancho={75}/>
            </div>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, color:"#6B7A99", marginBottom:3 }}>
                Posición actual
              </div>
              <InputMoneda valor={inv.valorActual} onChange={v => onUpdate({ ...inv, valorActual: v })} compact ancho={75}/>
            </div>
          </div>

          {/* Plusvalía */}
          <div style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"8px 10px", borderRadius:6,
            background: ganando ? "rgba(38,208,124,0.08)" : "rgba(255,71,87,0.08)",
            border: `1px solid ${ganando ? "#26D07C20" : "#FF475720"}`,
          }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:"#8B9DBB" }}>
              plusvalía
            </span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700,
                color: ganando ? "#26D07C" : "#FF4757" }}>
                {ganando ? "+" : ""}{plusvalia.toLocaleString("es-ES",{minimumFractionDigits:2})}€
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:600,
                color: ganando ? "#26D07C" : "#FF4757", opacity:0.8 }}>
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
        style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:8, padding:"8px 10px", color:"#E8EDF5", fontSize:13, outline:"none",
          fontFamily:"'Syne',sans-serif", marginBottom:8 }}/>
      <input placeholder="Entidad (ej. HNA, MyInvestor, Trade…)" value={entidad}
        onChange={e => setEntidad(e.target.value)}
        style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:8, padding:"8px 10px", color:"#E8EDF5", fontSize:13, outline:"none",
          fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}/>

      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:10 }}>
        {Object.entries(TIPOS_ACTIVO).map(([id, t]) => (
          <button key={id} onClick={() => setTipo(id)} style={{
            padding:"4px 10px", borderRadius:6, border:"none", cursor:"pointer", fontSize:11,
            fontFamily:"'Syne',sans-serif", fontWeight:600,
            background: tipo === id ? t.color + "25" : "rgba(255,255,255,0.05)",
            color: tipo === id ? t.color : "#6B7A99",
          }}>{t.icono} {t.label}</button>
        ))}
      </div>

      {soloValor ? (
        // Planes/pensión: sólo posición
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#6B7A99", marginBottom:3 }}>
            Posición del fondo
          </div>
          <InputMoneda valor={valorActual} onChange={setValorActual} compact ancho={80}/>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#6B7A99", marginBottom:3 }}>
              Inversión inicial
            </div>
            <InputMoneda valor={invertido} onChange={setInvertido} compact ancho={75}/>
          </div>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#6B7A99", marginBottom:3 }}>
              Posición actual
            </div>
            <InputMoneda valor={valorActual} onChange={setValorActual} compact ancho={75}/>
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:8 }}>
        <button onClick={guardar} style={{
          flex:1, background:"#26D07C", color:"#0A0E17", border:"none", borderRadius:8,
          fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", padding:"8px",
        }}>Añadir</button>
        <button onClick={onCancelar} style={{
          padding:"0 14px", background:"rgba(255,255,255,0.06)", color:"#6B7A99",
          border:"none", borderRadius:8, cursor:"pointer", fontSize:13,
        }}>✕</button>
      </div>
    </div>
  );
}

function VistaInversiones({ datos, onUpdateDatos }) {
  const [anadiendo, setAnadiendo] = useState(false);
  const inversiones = datos.inversiones || [];
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
          ? "linear-gradient(135deg, #26D07C20, #00A3E015)"
          : "linear-gradient(135deg, #FF475720, #FF6B3515)",
        border: `1px solid ${ganando ? "#26D07C30" : "#FF475730"}`,
        borderRadius:18, padding:"18px 20px", marginBottom:14,
      }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
          color: ganando ? "#26D07C" : "#FF4757", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>
          📈 Cartera total
        </div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:28, fontWeight:800,
          color: ganando ? "#26D07C" : "#FF4757", letterSpacing:"-0.02em" }}>
          {total.valorActual.toLocaleString("es-ES",{minimumFractionDigits:2})}€
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#6B7A99" }}>
            invertido {total.invertido.toLocaleString("es-ES",{minimumFractionDigits:0})}€
          </span>
          <div style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700,
            color: ganando ? "#26D07C" : "#FF4757",
            background: ganando ? "#26D07C20" : "#FF475720",
            padding:"4px 10px", borderRadius:6,
          }}>
            {ganando ? "+" : ""}{total.plusvalia.toLocaleString("es-ES",{minimumFractionDigits:2})}€ · {ganando ? "+" : ""}{pctTotal.toFixed(2)}%
          </div>
        </div>
      </div>

      {inversiones.length > 0 && (
        <div style={{ background:"rgba(255,255,255,0.025)", borderRadius:14, padding:"14px 16px",
          border:"1px solid rgba(255,255,255,0.06)", marginBottom:14 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, color:"#6B7A99",
            letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>Distribución por tipo</div>
          {Object.entries(porTipo)
            .filter(([_, v]) => v.valorActual > 0)
            .sort((a,b) => b[1].valorActual - a[1].valorActual)
            .map(([tipoId, v]) => {
              const t = TIPOS_ACTIVO[tipoId];
              const pct = total.valorActual > 0 ? (v.valorActual / total.valorActual) * 100 : 0;
              return (
                <div key={tipoId} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12, color:"#CBD5E8" }}>
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

      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, color:"#6B7A99",
        letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
        Posiciones ({inversiones.length})
      </div>

      {inversiones.length === 0 && (
        <div style={{ padding:"24px", textAlign:"center", fontFamily:"'Syne',sans-serif",
          fontSize:13, color:"#6B7A99", fontStyle:"italic",
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
        <BotonAnadir onClick={() => setAnadiendo(true)} label="Añadir posición" color="#26D07C"/>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// VISTA ANÁLISIS
// ═══════════════════════════════════════════════════════

function VistaAnalisis({ datos, claveM, mesNum, onUpdateDatos }) {
  // Datos efectivos (snapshot si el mes está cerrado)
  const dEf = datosEfectivosMes(datos, claveM);

  const totalIngresos = calcularIngresosMes(datos, claveM);
  const { fijos, vars, ahorro, puntuales, total: totalGastos } = calcularGastoMensualTotal(datos, claveM);
  const aportacion = calcularAportacionAnual(datos, mesNum, claveM);
  const margen = totalIngresos - totalGastos;
  const tasaAhorro = totalIngresos > 0 ? (ahorro / totalIngresos) * 100 : 0;

  const cartera = calcularTotalCartera(dEf.inversiones || []);
  // Patrimonio: líquido propio + 50% compartido + inversiones
  const liquidez = Object.keys(BANCO_META).reduce((a, b) => a + totalBanco(dEf.bancosConfig, dEf.cuentas, b), 0);
  const liquidezCompartida = patrimonioCompartido(dEf.cuentas);
  const patrimonio = liquidez + liquidezCompartida + cartera.valorActual;

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
      {/* Patrimonio */}
      <div style={{ background:"linear-gradient(135deg, #00A3E020, #B06FE815)",
        border:"1px solid #00A3E030", borderRadius:18, padding:"18px 20px", marginBottom:14 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, color:"#00A3E0",
          letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>
          💰 Patrimonio total
        </div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:28, fontWeight:800,
          color:"#E8EDF5", letterSpacing:"-0.02em" }}>
          {patrimonio.toLocaleString("es-ES",{minimumFractionDigits:0})}€
        </div>
        <div style={{ display:"flex", gap:6, marginTop:10 }}>
          <div style={{ flex: liquidez || 1, height:8, background:"#00A3E0", borderRadius:4 }}/>
          {liquidezCompartida > 0 && (
            <div style={{ flex: liquidezCompartida, height:8, background:"#B06FE8", borderRadius:4, opacity:0.7 }}/>
          )}
          <div style={{ flex: cartera.valorActual || 1, height:8, background:"#E8A838", borderRadius:4 }}/>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, flexWrap:"wrap", gap:6 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#00A3E0" }}>
            Líquido {liquidez.toLocaleString("es-ES",{minimumFractionDigits:0})}€
          </span>
          {liquidezCompartida > 0 && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#B06FE8" }}>
              🤝 {liquidezCompartida.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </span>
          )}
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#E8A838" }}>
            Inversión {cartera.valorActual.toLocaleString("es-ES",{minimumFractionDigits:0})}€
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {[
          { label:"Tasa de ahorro", v:`${tasaAhorro.toFixed(1)}%`, sub:`${ahorro.toLocaleString("es-ES",{minimumFractionDigits:0})}€/mes`, color: tasaAhorro >= 20 ? "#26D07C" : "#FF8C42", ok: tasaAhorro >= 20 },
          { label:"Remanente mes", v:`${margen.toLocaleString("es-ES",{minimumFractionDigits:0})}€`, sub:"tras todos los gastos", color: margen >= 0 ? "#00A3E0" : "#FF4757", ok: margen >= 0 },
          { label:"Aportación anual", v:`${Math.max(0,aportacion).toFixed(0)}€`, sub:`hasta noviembre`, color:"#E8A838", ok:true },
          { label:"Cobertura SOS", v:`${(saldoEmergencia/BASE_EMERGENCIA).toFixed(1)} meses`, sub:`base ${BASE_EMERGENCIA.toLocaleString("es-ES")}€/mes`, color:"#B06FE8", ok: saldoEmergencia >= BASE_EMERGENCIA * 4 },
        ].map(({ label, v, sub, color, ok }) => (
          <div key={label} style={{ background:"rgba(255,255,255,0.025)", borderRadius:14, padding:"14px 12px",
            border:`1px solid ${color}25` }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, color:"#6B7A99",
              letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>{label}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color, marginBottom:3 }}>{v}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#6B7A99", lineHeight:1.4 }}>{sub}</div>
            <div style={{ marginTop:6, fontFamily:"'Syne',sans-serif", fontSize:10,
              color: ok ? "#26D07C" : "#FF8C42" }}>{ok ? "✅ en objetivo" : "⚠ revisar"}</div>
          </div>
        ))}
      </div>

      {/* TEORÍAS DEL AHORRO */}
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

      {/* Distribución de gastos (por tipo) */}
      <div style={{ background:"rgba(255,255,255,0.025)", borderRadius:14, padding:"14px 16px",
        border:"1px solid rgba(255,255,255,0.06)", marginBottom:12 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, color:"#6B7A99",
          letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>
          Distribución de gastos
        </div>
        {[
          { label:"Fijos",     v:fijos,     color:"#26D07C" },
          { label:"Variables", v:vars,      color:"#00A3E0" },
          { label:"Ahorro",    v:ahorro,    color:"#E8A838" },
          { label:"Puntuales", v:puntuales, color:"#FF6B35" },
        ].filter(b => b.v > 0).map(({ label, v, color }) => {
          const pct = totalGastos > 0 ? (v/totalGastos)*100 : 0;
          return (
            <div key={label} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12, color:"#CBD5E8" }}>{label}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color }}>
                  {v.toLocaleString("es-ES",{minimumFractionDigits:0})}€ · {pct.toFixed(0)}%
                </span>
              </div>
              <BarraProgreso valor={v} maximo={totalGastos||1} color={color} altura={5}/>
            </div>
          );
        })}
      </div>

      {/* Flujo por banco */}
      <div style={{ background:"rgba(255,255,255,0.025)", borderRadius:14, padding:"14px 16px",
        border:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, color:"#6B7A99",
          letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>
          Flujo de gastos por banco
        </div>
        {Object.entries(BANCO_META).map(([banco, meta]) => {
          const v = totalGastosBanco[banco] || 0;
          const pct = totalGastos > 0 ? (v/totalGastos)*100 : 0;
          if (v === 0) return null;
          return (
            <div key={banco} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12, color:"#CBD5E8" }}>{meta.label}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:meta.color }}>
                  {v.toLocaleString("es-ES",{minimumFractionDigits:0})}€ · {pct.toFixed(0)}%
                </span>
              </div>
              <BarraProgreso valor={v} maximo={totalGastos||1} color={meta.color} altura={5}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BLOQUE TEORÍAS DEL AHORRO
// ═══════════════════════════════════════════════════════

const CLASIFICACIONES_DISPONIBLES = [
  { id:"necesidad", label:"Necesidad", color:"#00A3E0" },
  { id:"deseo",     label:"Deseo",     color:"#FF6B35" },
  { id:"ahorro",    label:"Ahorro",    color:"#26D07C" },
  { id:"deuda",     label:"Deuda",     color:"#FF4757" },
  { id:"educacion", label:"Educación", color:"#E8A838" },
  { id:"libertad",  label:"Libertad",  color:"#B06FE8" },
  { id:"dar",       label:"Dar",       color:"#8B9DBB" },
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
    <div style={{ background:"rgba(255,255,255,0.025)", borderRadius:14,
      border:"1px solid rgba(255,255,255,0.06)", marginBottom:12, overflow:"hidden" }}>

      {/* Cabecera */}
      <div style={{ padding:"14px 16px" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, color:"#6B7A99",
          letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
          📐 Teoría del ahorro
        </div>

        {/* Selector de teoría */}
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:10 }}>
          {Object.entries(TEORIAS_AHORRO).map(([id, t]) => (
            <button key={id} onClick={() => setTeoriaSel(id)} style={{
              padding:"4px 10px", borderRadius:6, border:"none", cursor:"pointer", fontSize:11,
              fontFamily:"'Syne',sans-serif", fontWeight:600,
              background: teoriaSel === id ? "rgba(38,208,124,0.2)" : "rgba(255,255,255,0.05)",
              color: teoriaSel === id ? "#26D07C" : "#6B7A99",
            }}>{t.nombre}</button>
          ))}
        </div>

        {/* Descripción */}
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:"#8B9DBB",
          marginBottom:12, lineHeight:1.5, fontStyle:"italic" }}>
          {teoria.descripcion}
          <span style={{ fontSize:9, color:"#6B7A99", marginLeft:5 }}>— {teoria.autor}</span>
        </div>

        {/* Categorías con barras */}
        {totalesCategoria.map(cat => {
          const dentro = Math.abs(cat.pctReal - cat.pct) <= 5;
          const excede = cat.pctReal > cat.pct + 5;
          return (
            <div key={cat.id} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <div>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:600, color:"#CBD5E8" }}>
                    {cat.label}
                  </span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                    color:"#6B7A99", marginLeft:6 }}>
                    meta {cat.pct}%
                  </span>
                </div>
                <div style={{ textAlign:"right" }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700,
                    color: excede ? "#FF4757" : dentro ? "#26D07C" : "#FF8C42" }}>
                    {cat.pctReal.toFixed(1)}%
                  </span>
                </div>
              </div>
              <BarraProgreso valor={cat.pctReal} maximo={100} color={excede ? "#FF4757" : cat.color} altura={6}/>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#6B7A99" }}>
                  real {cat.real.toLocaleString("es-ES",{minimumFractionDigits:0})}€
                </span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#6B7A99" }}>
                  objetivo {cat.objetivoEur.toLocaleString("es-ES",{minimumFractionDigits:0})}€
                </span>
              </div>
            </div>
          );
        })}

        {/* Toggle para ver/editar la clasificación de cada gasto */}
        <button onClick={() => setMostrarDetalle(d => !d)} style={{
          width:"100%", marginTop:6, padding:"8px", borderRadius:8, border:"none", cursor:"pointer",
          background:"rgba(255,255,255,0.04)", color:"#8B9DBB",
          fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:600,
        }}>
          {mostrarDetalle ? "▲ Ocultar clasificación de gastos" : "▼ Ver / re-clasificar gastos"}
        </button>

        {/* Detalle: cada gasto con su clasificación editable */}
        {mostrarDetalle && (
          <div style={{ marginTop:10, padding:"10px", background:"rgba(255,255,255,0.02)", borderRadius:8 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#6B7A99", marginBottom:8, lineHeight:1.4 }}>
              Por defecto: fijos = necesidad, variables = deseo, ahorro = ahorro. Puedes re-clasificar gastos individualmente (ej. el gimnasio como deseo en lugar de necesidad).
            </div>
            {gastos.map(g => (
              <div key={`${g.tipoOrigen}-${g.id}`} style={{
                display:"flex", alignItems:"center", gap:6, padding:"5px 0",
                borderBottom:"1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{
                  fontFamily:"'Syne',sans-serif", fontSize:11, color:"#CBD5E8", flex:1, minWidth:0,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>{g.nombre}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#6B7A99" }}>
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
        fontFamily:"'Syne',sans-serif", fontSize:9, fontWeight:600,
        color: actual.color, background: actual.color + "20",
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
            background:"#0F1521", border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:8, padding:4, boxShadow:"0 8px 24px rgba(0,0,0,0.4)", minWidth:120,
          }}>
            {CLASIFICACIONES_DISPONIBLES.map(c => (
              <button key={c.id} onClick={() => { onChange(c.id); setAbierto(false); }} style={{
                display:"block", width:"100%", padding:"5px 10px", borderRadius:5,
                border:"none", cursor:"pointer",
                background: c.id === value ? c.color + "15" : "transparent",
                fontFamily:"'Syne',sans-serif", fontSize:11, color: c.color,
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


function BotonAjustes() {
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
          background: "rgba(255,255,255,0.06)", border: "none",
          color: "#6B7A99", cursor: "pointer", fontSize: 14,
          width: 32, height: 32, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
        }
      }, "⚙"),
      abierto && React.createElement(React.Fragment, null,
        React.createElement("div", {
          onClick: () => setAbierto(false),
          style: { position: "fixed", inset: 0, zIndex: 100 }
        }),
        React.createElement("div", {
          style: {
            position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 101,
            background: "#0F1521", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, padding: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            minWidth: 200,
          }
        },
          React.createElement("button", {
            onClick: () => { descargarBackup(); setAbierto(false); },
            style: {
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "8px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: "transparent", fontFamily: "'Syne',sans-serif",
              fontSize: 12, color: "#CBD5E8", textAlign: "left",
            }
          }, "💾 Exportar backup"),
          React.createElement("button", {
            onClick: () => fileRef.current?.click(),
            style: {
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "8px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: "transparent", fontFamily: "'Syne',sans-serif",
              fontSize: 12, color: "#CBD5E8", textAlign: "left",
            }
          }, "📂 Importar backup"),
          React.createElement("input", {
            ref: fileRef, type: "file", accept: "application/json",
            onChange: handleImport, style: { display: "none" }
          }),
          React.createElement("div", {
            style: { height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }
          }),
          React.createElement("button", {
            onClick: () => { forzarActualizacion(); },
            style: {
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "8px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: "transparent", fontFamily: "'Syne',sans-serif",
              fontSize: 12, color: "#00A3E0", textAlign: "left",
            }
          }, "🔄 Forzar actualización"),
          React.createElement("div", {
            style: { height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }
          }),
          React.createElement("button", {
            onClick: () => { reiniciarTodo(); },
            style: {
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "8px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: "transparent", fontFamily: "'Syne',sans-serif",
              fontSize: 12, color: "#FF4757", textAlign: "left",
            }
          }, "🗑 Reiniciar todo")
        )
      )
    )
  );
}

function App() {
  const [datos, setDatos] = useState(null);
  const [nav, setNav]     = useState(() => { const d=new Date(); return { mes:d.getMonth(), año:d.getFullYear() }; });
  const [vista, setVista] = useState("inicio");

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

  // Wrapper específico para cambios desde una vista de mes M:
  // - ANTES de aplicar el cambio, congela todos los meses anteriores a M
  //   que aún no tuvieran snapshot. Así los cambios solo afectan a M y futuros.
  // - Si el mes M ya tiene snapshot (por auto-congelación previa), aplica
  //   los cambios sobre ese snapshot (para no afectar a meses posteriores que
  //   también puedan tener su propio snapshot).
  // - Si M no tiene snapshot (es el "presente" o un futuro sin congelar),
  //   los cambios van a los catálogos globales y se propagan al futuro.
  const onUpdateDatosMes = useCallback((fn) => {
    setDatos(d => {
      const copia = JSON.parse(JSON.stringify(d || datosVacios()));
      const claveActual = claveMes(nav.mes, nav.año);
      // Primero: congelar meses anteriores que no tuvieran snapshot
      congelarMesesAnteriores(copia, claveActual);
      // Si este mes ya tiene snapshot, redirigimos el cambio al snapshot
      const mes = copia.meses[claveActual];
      if (mes && mes.snapshot) {
        // Construimos un "objeto puente" que para los catálogos apunta al snapshot
        // pero para todo lo demás (meses, etc.) apunta al objeto raíz.
        const puente = {
          // Estos campos los va a leer y escribir la función fn, redirigidos al snapshot:
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
          // Estos siguen siendo los de la raíz (para pagos, puntuales, km del mes):
          meses:             copia.meses,
        };
        fn(puente);
        // Volcamos las modificaciones del puente al snapshot
        mes.snapshot.catalogoFijos     = puente.catalogoFijos;
        mes.snapshot.catalogoVariables = puente.catalogoVariables;
        mes.snapshot.catalogoAhorro    = puente.catalogoAhorro;
        mes.snapshot.cuentas           = puente.cuentas;
        mes.snapshot.bancosConfig      = puente.bancosConfig;
        mes.snapshot.ingresosBase      = puente.ingresosBase;
        mes.snapshot.reservaImpCuenta  = puente.reservaImpCuenta;
        mes.snapshot.porcentajeExtra   = puente.porcentajeExtra;
        mes.snapshot.anuales           = puente.anuales;
        mes.snapshot.inversiones       = puente.inversiones;
      } else {
        // Sin snapshot: cambios al catálogo global (propagan a futuros)
        fn(copia);
      }
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
    <div style={{ background:"#0A0E17", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="pulse" style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:"#26D07C" }}>
        cargando…
      </div>
    </div>
  );

  const VISTAS = [
    { id:"inicio",      icono:"🏦", label:"Inicio" },
    { id:"gastos",      icono:"📋", label:"Gastos" },
    { id:"anuales",     icono:"📆", label:"Anuales" },
    { id:"inversiones", icono:"📈", label:"Invertir" },
    { id:"analisis",    icono:"📊", label:"Análisis" },
  ];

  return (
    <div style={{ background:"#0A0E17", minHeight:"100vh", maxWidth:480, margin:"0 auto",
      fontFamily:"'Syne',sans-serif", color:"#E8EDF5", paddingBottom:80 }}>
      <style>{css}</style>

      <div style={{
        background:"linear-gradient(180deg,rgba(38,208,124,0.06) 0%,transparent 100%)",
        borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"18px 20px 0",
        position:"sticky", top:0, zIndex:10, backdropFilter:"blur(12px)",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <button onClick={()=>irMes(-1)} style={{ background:"rgba(255,255,255,0.06)", border:"none",
            color:"#6B7A99", cursor:"pointer", fontSize:16, width:32, height:32, borderRadius:8,
            display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
          <div style={{ textAlign:"center", display:"flex", alignItems:"center", gap:8 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#6B7A99",
                letterSpacing:"0.12em", textTransform:"uppercase" }}>control mensual</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, letterSpacing:"-0.02em" }}>
                {MESES[nav.mes]} <span style={{ color:"#6B7A99", fontWeight:400, fontSize:16 }}>{nav.año}</span>
              </div>
            </div>
            {/* Candado: indicador clicable de mes cerrado/abierto */}
            <button onClick={cerrado ? reabrirMes : cerrarMes} title={cerrado ? "Reabrir mes" : "Cerrar mes"} style={{
              background: cerrado ? "rgba(255,140,66,0.18)" : "rgba(255,255,255,0.06)",
              border: cerrado ? "1px solid #FF8C4250" : "1px solid transparent",
              color: cerrado ? "#FF8C42" : "#6B7A99",
              cursor:"pointer", fontSize:16, width:34, height:34, borderRadius:8,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>{cerrado ? "🔒" : "🔓"}</button>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <button onClick={()=>irMes(1)} style={{ background:"rgba(255,255,255,0.06)", border:"none",
              color:"#6B7A99", cursor:"pointer", fontSize:16, width:32, height:32, borderRadius:8,
              display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
            <BotonAjustes/>
          </div>
        </div>
        <div style={{ display:"flex", gap:3, paddingBottom:14 }}>
          {VISTAS.map(v => (
            <button key={v.id} onClick={() => setVista(v.id)} style={{
              flex:1, padding:"7px 2px", borderRadius:10, border:"none", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:2,
              background: vista===v.id ? "rgba(38,208,124,0.12)" : "transparent",
              borderBottom: vista===v.id ? "2px solid #26D07C" : "2px solid transparent",
              transition:"all 0.2s",
            }}>
              <span style={{ fontSize:14 }}>{v.icono}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:600,
                color: vista===v.id ? "#26D07C" : "#6B7A99", letterSpacing:"0.05em" }}>{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Banner de mes cerrado */}
      {cerrado && (
        <div style={{
          background:"linear-gradient(90deg, rgba(255,140,66,0.15), rgba(255,140,66,0.06))",
          border:"1px solid rgba(255,140,66,0.3)", borderRadius:10,
          margin:"12px 16px 0", padding:"10px 14px",
          display:"flex", alignItems:"center", gap:10,
        }}>
          <span style={{ fontSize:18 }}>🔒</span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"#FF8C42" }}>
              Mes cerrado · sólo lectura
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#8B9DBB", marginTop:2 }}>
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
        {vista === "inicio"      && <VistaInicio      datos={datos} claveM={claveM} mesNum={nav.mes} onUpdateDatos={onUpdateDatosMes}/>}
        {vista === "gastos"      && <VistaGastos      datos={datos} claveM={claveM} onUpdateDatos={onUpdateDatosMes}/>}
        {vista === "anuales"     && <VistaAnuales     datos={datos} claveM={claveM} onUpdateDatos={onUpdateDatosMes}/>}
        {vista === "inversiones" && <VistaInversiones datos={datos} onUpdateDatos={onUpdateDatosMes}/>}
        {vista === "analisis"    && <VistaAnalisis    datos={datos} claveM={claveM} mesNum={nav.mes} onUpdateDatos={onUpdateDatosMes}/>}
      </div>
    </div>
  );
}


// ─── Montaje en el DOM ───
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
