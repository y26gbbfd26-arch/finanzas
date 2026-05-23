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
const RATIO_EXTRAS = 3/7;
const RESERVA_IMP_DEFAULT = 2000;
const BASE_EMERGENCIA = 2500;

const PROPOSITOS = {
  operativa:  { label: "Operativa",       icono: "💳" },
  emergencia: { label: "Emergencia",      icono: "🛟" },
  anuales:    { label: "Gastos anuales",  icono: "📆" },
  ahorro:     { label: "Ahorro/Objetivo", icono: "🎯" },
  inversion:  { label: "Inversión",       icono: "📈" },
  otros:      { label: "Otros",           icono: "🗂"  },
};

const TIPOS_ACTIVO = {
  etf:     { label:"ETF",     color:"#00A3E0", icono:"📊" },
  accion:  { label:"Acción",  color:"#26D07C", icono:"📈" },
  fondo:   { label:"Fondo",   color:"#FF6B35", icono:"🏦" },
  cripto:  { label:"Cripto",  color:"#E8A838", icono:"₿"  },
  bono:    { label:"Bono",    color:"#B06FE8", icono:"📜" },
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
    cuentaAsignada:null,
    conceptos: [
      { id:"cuota",   nombre:"Cuota anual", importe:600 },
      { id:"derrama", nombre:"Derrama",     importe:700 },
      { id:"desfile", nombre:"Desfile",     importe:350 },
      { id:"otros",   nombre:"Otros",       importe:200 },
    ],
  },
  "BODAS Y CUMPLEAÑOS": {
    icono:"💒",
    cuentaAsignada:null,
    conceptos: [
      { id:"fernando", nombre:"Fernando",    importe:700 },
      { id:"pascu",    nombre:"Pascu",       importe:700 },
      { id:"otras",    nombre:"Otras bodas", importe:300 },
    ],
  },
  "IMPUESTOS": {
    icono:"🏛",
    cuentaAsignada:null,
    conceptos: [
      { id:"ibi",     nombre:"IBI",          importe:600 },
      { id:"vida",    nombre:"Seg. Vida",    importe:400 },
      { id:"hogar",   nombre:"Seg. Hogar",   importe:900 },
      { id:"vado",    nombre:"Vado",         importe:200 },
    ],
  },
  "VIAJES": {
    icono:"✈️",
    cuentaAsignada:null,
    conceptos: [
      { id:"festival", nombre:"Festival", importe:400 },
    ],
  },
  "OTROS": {
    icono:"📦",
    cuentaAsignada:null,
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

const STORAGE_KEY = "finanzas-v7";

function añoActual() { return new Date().getFullYear(); }

function datosVacios() {
  return {
    // ─── Estado actual (no por mes) ───
    catalogoFijos:     GASTOS_FIJOS_DEFAULT.map(g => ({...g})),
    catalogoVariables: GASTOS_VARIABLES_DEFAULT.map(g => ({...g})),
    catalogoAhorro:    GASTOS_AHORRO_DEFAULT.map(g => ({...g})),
    cuentas:           CUENTAS_DEFAULT.map(c => ({...c})),
    bancosTotales:     { BBVA:0, TRADE:0, BANK:0, MYINV:0 },
    ingresosBase:      { nomina:3500, aportFam:650 },
    reservaImp:        RESERVA_IMP_DEFAULT,
    usarExtras:        true,
    inversiones:       [],

    // ─── Por año: gastos anuales del año en curso ───
    anuales:           {
      año: añoActual(),
      catalogo: JSON.parse(JSON.stringify(ANUALES_DEFAULT)),
    },

    // ─── Por mes: solo lo que cambia mes a mes ───
    meses: {},  // { "2026-04": { km, extra, otros, puntuales, pagosFijos, pagosVariables, pagosAhorro, pagosAnuales } }
  };
}

function estadoMesVacio() {
  return {
    km: 0,
    extra: 0,
    otros: 0,
    puntuales: [],         // [{id, nombre, importe, banco, pagado}]
    pagosFijos: {},        // { gastoId: bool }
    pagosVariables: {},
    pagosAhorro: {},
    pagosAnuales: {},      // { categoriaAnual: importe pagado este mes }
  };
}

async function cargarDatos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return datosVacios();
    const cargado = JSON.parse(raw);
    const base = datosVacios();
    if (!cargado.catalogoFijos || !cargado.anuales) return base;
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
// CÁLCULOS
// ═══════════════════════════════════════════════════════

function getMes(datos, claveM) {
  return datos.meses[claveM] || estadoMesVacio();
}

// Lista de gastos efectivos de un mes (con pagado merged):
// los catálogos son globales, pero el pagado/no-pagado se lee del mes
function gastosFijosDeMes(datos, claveM) {
  const mes = getMes(datos, claveM);
  return datos.catalogoFijos
    .filter(g => g.importe > 0)
    .map(g => ({ ...g, pagado: mes.pagosFijos[g.id] || false }));
}
function gastosVariablesDeMes(datos, claveM) {
  const mes = getMes(datos, claveM);
  return datos.catalogoVariables
    .filter(g => g.importe > 0)
    .map(g => ({ ...g, pagado: mes.pagosVariables[g.id] || false }));
}
function gastosAhorroDeMes(datos, claveM) {
  const mes = getMes(datos, claveM);
  return datos.catalogoAhorro
    .filter(g => g.importe > 0)
    .map(g => ({ ...g, pagado: mes.pagosAhorro[g.id] || false }));
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
  const mes = getMes(datos, claveM);
  return (datos.ingresosBase.nomina || 0)
       + (datos.ingresosBase.aportFam || 0)
       + (mes.extra || 0)
       + (mes.otros || 0)
       + calcularIngresoKm(datos, claveM);
}

// Gastos anuales: total, pagado acumulado en TODOS los meses del año actual, pendiente
function totalCategoriaAnual(catData) {
  return catData.conceptos.reduce((a,c) => a + (c.importe || 0), 0);
}

function pagadoCategoriaAnual(datos, categoria) {
  const año = datos.anuales.año;
  let total = 0;
  Object.entries(datos.meses).forEach(([clave, mes]) => {
    if (clave.startsWith(String(año))) {
      total += (mes.pagosAnuales && mes.pagosAnuales[categoria]) || 0;
    }
  });
  return total;
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

// Fórmula del Excel para la aportación mensual a gastos anuales
function calcularAportacionAnual(datos, mesNum) {
  const pendiente = totalAnualesPendiente(datos);
  const reserva = datos.reservaImp || RESERVA_IMP_DEFAULT;
  const mesesRestantes = Math.max(1, 11 - mesNum);  // 0=enero…11=diciembre
  const nomina = datos.ingresosBase.nomina || 0;
  const extrasFactor = datos.usarExtras ? (nomina * RATIO_EXTRAS) : 0;
  return (pendiente - reserva - extrasFactor) / mesesRestantes;
}

// Bancos
function asignadoBanco(cuentas, banco) {
  return cuentas.filter(c => c.banco === banco).reduce((a,c) => a + (c.asignado || 0), 0);
}

function remanenteBanco(bancosTotales, cuentas, banco) {
  return (bancosTotales[banco] || 0) - asignadoBanco(cuentas, banco);
}

// Cuentas con propósito específico (todas las del catálogo)
function cuentaParaAnualesAsignada(datos, categoria) {
  const id = datos.anuales.catalogo[categoria]?.cuentaAsignada;
  return id ? datos.cuentas.find(c => c.id === id) : null;
}

// Inversiones
function calcularPosicion(inv) {
  const invertido = (inv.cantidad || 0) * (inv.precioMedio || 0);
  const valorActual = (inv.cantidad || 0) * (inv.precioActual || 0);
  const plusvalia = valorActual - invertido;
  const pctPlusvalia = invertido > 0 ? (plusvalia / invertido) * 100 : 0;
  return { invertido, valorActual, plusvalia, pctPlusvalia };
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
  const [abierto, setAbierto] = useState(false);
  const [anadiendoEn, setAnadiendoEn] = useState(null);
  const [editandoNombre, setEditandoNombre] = useState(null);

  const totalLiquido = Object.values(datos.bancosTotales).reduce((a,v) => a + (v||0), 0);
  const remanenteTotal = Object.keys(BANCO_META).reduce((a,b) =>
    a + remanenteBanco(datos.bancosTotales, datos.cuentas, b), 0);

  const setTotalBanco = (banco, v) => onUpdateDatos(d => { d.bancosTotales[banco] = v; });
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
      <div onClick={() => setAbierto(a => !a)}
        style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"14px 16px", cursor:"pointer" }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, color:"#6B7A99",
            letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>🏦 Bancos y cuentas</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#8B9DBB" }}>
            total <span style={{ color:"#E8EDF5", fontWeight:700 }}>{totalLiquido.toLocaleString("es-ES",{minimumFractionDigits:0})}€</span>
            {" · "}
            libre <span style={{
              color: remanenteTotal >= 0 ? "#26D07C" : "#FF4757", fontWeight:700,
            }}>{remanenteTotal.toLocaleString("es-ES",{minimumFractionDigits:0})}€</span>
          </div>
        </div>
        <span style={{ color:"#6B7A99", fontSize:14 }}>{abierto ? "▲" : "▼"}</span>
      </div>

      {abierto && (
        <div style={{ padding:"0 14px 14px" }}>
          {Object.entries(BANCO_META).map(([bancoId, meta]) => {
            const total = datos.bancosTotales[bancoId] || 0;
            const asignado = asignadoBanco(datos.cuentas, bancoId);
            const remanente = total - asignado;
            const cuentasBanco = datos.cuentas.filter(c => c.banco === bancoId);

            return (
              <div key={bancoId} style={{ marginBottom:14,
                background:"rgba(255,255,255,0.02)", borderRadius:12,
                border:`1px solid ${meta.color}20`, padding:"10px 12px" }}>

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{
                      width:24, height:24, borderRadius:6, background: meta.color + "25",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:800, color: meta.color,
                    }}>{meta.icono}</div>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:"#CBD5E8" }}>
                      {meta.label}
                    </span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#6B7A99" }}>total</span>
                    <InputMoneda valor={total} onChange={v => setTotalBanco(bancoId, v)} compact ancho={75}/>
                  </div>
                </div>

                {cuentasBanco.length === 0 && (
                  <div style={{ padding:"8px", textAlign:"center", fontFamily:"'Syne',sans-serif",
                    fontSize:11, color:"#6B7A99", fontStyle:"italic" }}>
                    Sin cuentas
                  </div>
                )}
                {cuentasBanco.map(c => {
                  const prop = PROPOSITOS[c.proposito] || PROPOSITOS.otros;
                  const enEdicion = editandoNombre === c.id;
                  return (
                    <div key={c.id} style={{
                      display:"flex", alignItems:"center", gap:6, padding:"6px 0",
                      borderBottom:"1px solid rgba(255,255,255,0.04)",
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
                          {c.nombre}
                          <span style={{ fontSize:9, color:"#6B7A99", marginLeft:5 }}>{prop.label}</span>
                        </span>
                      )}
                      <SelectorProposito value={c.proposito} onChange={p => actualizarCuenta(c.id, { proposito: p })}/>
                      <InputMoneda valor={c.asignado} onChange={v => actualizarCuenta(c.id, { asignado: v })} compact ancho={55}/>
                      <button onClick={() => eliminarCuenta(c.id)} style={{ background:"none", border:"none",
                        cursor:"pointer", color:"#FF475760", fontSize:13, padding:"0 2px" }}>×</button>
                    </div>
                  );
                })}

                <div style={{
                  marginTop:8, padding:"8px 10px", borderRadius:8,
                  background: remanente >= 0 ? "rgba(38,208,124,0.06)" : "rgba(255,71,87,0.08)",
                  border: `1px solid ${remanente >= 0 ? "#26D07C25" : "#FF475730"}`,
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:"#8B9DBB" }}>
                      asignado <span style={{ color:"#CBD5E8", fontFamily:"'JetBrains Mono',monospace" }}>
                        {asignado.toLocaleString("es-ES",{minimumFractionDigits:0})}€
                      </span>
                    </span>
                    <span style={{
                      fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700,
                      color: remanente >= 0 ? "#26D07C" : "#FF4757",
                    }}>
                      🔓 {remanente >= 0 ? "+" : ""}{remanente.toLocaleString("es-ES",{minimumFractionDigits:0})}€ libre
                    </span>
                  </div>
                  {remanente < 0 && (
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#FF4757", marginTop:4 }}>
                      ⚠ Has asignado más de lo que tienes en el banco
                    </div>
                  )}
                </div>

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

  const guardar = () => {
    if (!nombre.trim()) return;
    onGuardar({ nombre: nombre.trim(), proposito, asignado });
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
  const totalIngresos = calcularIngresosMes(datos, claveM);
  const ingresoKm = calcularIngresoKm(datos, claveM);
  const aportacion = calcularAportacionAnual(datos, mesNum);
  const pendienteAnual = totalAnualesPendiente(datos);

  // Cuenta de anuales: si hay alguna cuenta asignada en alguna categoría, usamos la primera
  // (pero como cada categoría tiene su cuenta, mostramos un resumen agregado de las asignadas)
  const cuentasParaAnuales = datos.cuentas.filter(c => c.proposito === "anuales");
  const saldoAnualesTotal = cuentasParaAnuales.reduce((a,c) => a + c.asignado, 0);

  const mes = getMes(datos, claveM);

  const setIngresoBase = (campo, v) => onUpdateDatos(d => { d.ingresosBase[campo] = v; });
  const setMesField = (campo, v) => onUpdateDatos(d => {
    if (!d.meses[claveM]) d.meses[claveM] = estadoMesVacio();
    d.meses[claveM][campo] = v;
  });
  const setReservaImp = (v) => onUpdateDatos(d => { d.reservaImp = v; });
  const setUsarExtras = (v) => onUpdateDatos(d => { d.usarExtras = v; });

  return (
    <div className="slide-in">
      {/* Aviso aportación anual */}
      <div style={{
        background:"linear-gradient(135deg, #26D07C15, #00A3E015)",
        border:"1px solid #26D07C30", borderRadius:18, padding:"16px 18px", marginBottom:14,
      }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
          color:"#26D07C", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>
          💡 Aportación a gastos anuales
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:10 }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:800, color:"#26D07C" }}>
              {Math.max(0, aportacion).toFixed(2)}€
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#6B7A99", marginTop:2 }}>
              al mes hasta noviembre
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:"#FF6B35" }}>
              {pendienteAnual.toLocaleString("es-ES",{minimumFractionDigits:0})}€
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#6B7A99" }}>
              pendiente este año
            </div>
          </div>
        </div>
        {cuentasParaAnuales.length > 0 && (
          <div style={{ padding:"8px 12px", background:"rgba(255,255,255,0.04)", borderRadius:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:"#8B9DBB" }}>
                Reservado en cuentas de anuales
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700,
                color: saldoAnualesTotal >= pendienteAnual ? "#26D07C" : "#FF8C42" }}>
                {saldoAnualesTotal.toLocaleString("es-ES",{minimumFractionDigits:0})}€
              </span>
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, color:"#6B7A99", marginTop:2 }}>
              {saldoAnualesTotal >= pendienteAnual
                ? `✅ Ya está todo cubierto`
                : `⚠ Faltan ${(pendienteAnual - saldoAnualesTotal).toFixed(0)}€ para cubrir lo pendiente`}
            </div>
          </div>
        )}
      </div>

      {/* Ingresos del mes */}
      <div style={{ background:"rgba(255,255,255,0.025)", borderRadius:14, padding:"14px 16px", marginBottom:12,
        border:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, color:"#6B7A99",
          letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>Ingresos del mes</div>

        {[
          { key:"nomina",   label:"Nómina",              valor:datos.ingresosBase.nomina,   onChange:v => setIngresoBase("nomina", v) },
          { key:"aportFam", label:"Aportación familiar", valor:datos.ingresosBase.aportFam, onChange:v => setIngresoBase("aportFam", v) },
          { key:"extra",    label:"Extra del mes",       valor:mes.extra,                   onChange:v => setMesField("extra", v) },
          { key:"otros",    label:"Otros",               valor:mes.otros,                   onChange:v => setMesField("otros", v) },
        ].map(({ key, label, valor, onChange }) => (
          <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:13, color:"#CBD5E8" }}>{label}</span>
            <InputMoneda valor={valor} onChange={onChange} compact />
          </div>
        ))}

        <div style={{ padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, color:"#CBD5E8" }}>Km coche trabajo</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#6B7A99", marginTop:2 }}>
                {TARIFA_KM.toFixed(2).replace(".",",")}€/km · <span style={{ color:"#26D07C" }}>+{ingresoKm.toLocaleString("es-ES",{minimumFractionDigits:2})}€</span>
              </div>
            </div>
            <InputNumero valor={mes.km} onChange={v => setMesField("km", v)} sufijo="km" compact />
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"#CBD5E8" }}>TOTAL</span>
          <Num v={totalIngresos} decimals={2} color="#26D07C" size={15}/>
        </div>
      </div>

      {/* Bloque bancos colapsable */}
      <BloqueBancos datos={datos} onUpdateDatos={onUpdateDatos}/>

      {/* Config aportación */}
      <div style={{ background:"rgba(255,255,255,0.025)", borderRadius:14, padding:"14px 16px",
        border:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, color:"#6B7A99",
          letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>Configuración aportación anual</div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:13, color:"#CBD5E8" }}>Usar ingresos extra</span>
          <button onClick={() => setUsarExtras(!datos.usarExtras)} style={{
            padding:"5px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11,
            fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            background: datos.usarExtras ? "#26D07C25" : "rgba(255,255,255,0.06)",
            color: datos.usarExtras ? "#26D07C" : "#6B7A99",
          }}>{datos.usarExtras ? "SÍ" : "NO"}</button>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:13, color:"#CBD5E8" }}>Reserva impuestos</span>
          <InputMoneda valor={datos.reservaImp} onChange={setReservaImp} compact />
        </div>

        <div style={{ marginTop:10, fontFamily:"'Syne',sans-serif", fontSize:10, color:"#6B7A99",
          padding:"8px 10px", background:"rgba(0,163,224,0.06)", borderRadius:6, lineHeight:1.5 }}>
          📐 Fórmula: (anuales pendientes − reserva imp. {datos.usarExtras ? "− nómina×3/7" : ""}) ÷ ({11-mesNum} meses hasta noviembre)
        </div>
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

  const totalAño = totalAnualesYear(datos);
  const totalPagado = totalAnualesPagado(datos);
  const totalPendiente = totalAño - totalPagado;
  const mes = getMes(datos, claveM);

  // Año en curso del catálogo de anuales
  const añoCatalogo = datos.anuales.año;
  const añoAhora = añoActual();

  const setPagoMes = (categoria, valor) => onUpdateDatos(d => {
    if (!d.meses[claveM]) d.meses[claveM] = estadoMesVacio();
    if (!d.meses[claveM].pagosAnuales) d.meses[claveM].pagosAnuales = {};
    d.meses[claveM].pagosAnuales[categoria] = valor;
  });

  const setCuentaAsignada = (categoria, idCuenta) => onUpdateDatos(d => {
    d.anuales.catalogo[categoria].cuentaAsignada = idCuenta;
  });

  const setConceptoImporte = (categoria, conceptoId, valor) => onUpdateDatos(d => {
    const conceptos = d.anuales.catalogo[categoria].conceptos;
    const idx = conceptos.findIndex(c => c.id === conceptoId);
    if (idx >= 0) conceptos[idx].importe = valor;
  });

  const setConceptoNombre = (categoria, conceptoId, nombre) => onUpdateDatos(d => {
    const conceptos = d.anuales.catalogo[categoria].conceptos;
    const idx = conceptos.findIndex(c => c.id === conceptoId);
    if (idx >= 0) conceptos[idx].nombre = nombre;
  });

  const eliminarConcepto = (categoria, conceptoId) => onUpdateDatos(d => {
    d.anuales.catalogo[categoria].conceptos =
      d.anuales.catalogo[categoria].conceptos.filter(c => c.id !== conceptoId);
  });

  const añadirConcepto = (categoria, data) => {
    onUpdateDatos(d => {
      d.anuales.catalogo[categoria].conceptos.push({
        ...data, id: `concepto-${Date.now()}`,
      });
    });
    setAnadiendoConceptoEn(null);
  };

  const eliminarBloque = (categoria) => onUpdateDatos(d => {
    delete d.anuales.catalogo[categoria];
  });

  const añadirBloque = (nombre) => {
    onUpdateDatos(d => {
      d.anuales.catalogo[nombre] = { icono:"📁", cuentaAsignada:null, conceptos:[] };
    });
    setAnadiendoBloque(false);
  };

  const reiniciarAño = () => {
    if (!confirm(`¿Reiniciar gastos anuales a ${añoAhora}? Se mantendrán los bloques y conceptos pero los pagos volverán a cero.`)) return;
    onUpdateDatos(d => {
      d.anuales.año = añoAhora;
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
      {Object.entries(datos.anuales.catalogo).map(([cat, info]) => {
        const total = totalCategoriaAnual(info);
        const pagado = pagadoCategoriaAnual(datos, cat);
        const pendiente = total - pagado;
        const cuentaAsignada = cuentaParaAnualesAsignada(datos, cat);
        const saldoCuenta = cuentaAsignada ? cuentaAsignada.asignado : 0;
        const cobertura = saldoCuenta - pendiente;
        const pagoMes = mes.pagosAnuales?.[cat] || 0;

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

              {/* Conceptos */}
              <div style={{ marginTop:12, padding:"6px 8px", background:"rgba(255,255,255,0.02)", borderRadius:8 }}>
                {info.conceptos.map(c => (
                  <FilaConcepto key={c.id} concepto={c}
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

              {/* Cuenta asignada */}
              <div style={{ marginTop:10, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:"#6B7A99" }}>Cuenta asignada</span>
                  <SelectorCuenta value={info.cuentaAsignada} cuentas={datos.cuentas}
                    onChange={id => setCuentaAsignada(cat, id)}/>
                </div>
                {cuentaAsignada && (
                  <div style={{
                    padding:"8px 10px", borderRadius:6,
                    background: cobertura >= 0 ? "rgba(38,208,124,0.06)" : "rgba(255,140,66,0.08)",
                    border: `1px solid ${cobertura >= 0 ? "#26D07C25" : "#FF8C4230"}`,
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:"#8B9DBB" }}>
                        saldo en la cuenta
                      </span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:600,
                        color: BANCO_META[cuentaAsignada.banco].color }}>
                        {saldoCuenta.toLocaleString("es-ES",{minimumFractionDigits:0})}€
                      </span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
                      <span style={{ fontFamily:"'Syne',sans-serif", fontSize:10,
                        color: cobertura >= 0 ? "#26D07C" : "#FF8C42" }}>
                        {cobertura >= 0
                          ? `✅ Cubre (sobra ${cobertura.toFixed(0)}€)`
                          : `⚠ Faltan ${Math.abs(cobertura).toFixed(0)}€`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pago de este mes */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                marginTop:10, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, color:"#CBD5E8" }}>
                    Pagado este mes
                  </div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, color:"#6B7A99" }}>
                    se suma al acumulado del año
                  </div>
                </div>
                <InputMoneda valor={pagoMes} onChange={v => setPagoMes(cat, v)} compact />
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

function FilaConcepto({ concepto, onNombre, onImporte, onEliminar }) {
  const [editando, setEditando] = useState(false);
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"3px 0" }}>
      {editando ? (
        <input value={concepto.nombre}
          onChange={e => onNombre(e.target.value)}
          onBlur={() => setEditando(false)}
          autoFocus
          style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)",
            borderRadius:5, padding:"2px 6px", color:"#E8EDF5", fontSize:11, outline:"none",
            fontFamily:"'Syne',sans-serif", marginRight:6 }}
        />
      ) : (
        <span onClick={() => setEditando(true)} style={{
          flex:1, fontFamily:"'Syne',sans-serif", fontSize:11, color:"#CBD5E8",
          cursor:"pointer", marginRight:6,
        }}>{concepto.nombre}</span>
      )}
      <InputMoneda valor={concepto.importe} onChange={onImporte} compact ancho={50}/>
      <button onClick={onEliminar} style={{ background:"none", border:"none",
        cursor:"pointer", color:"#FF475760", fontSize:13, padding:"0 4px" }}>×</button>
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
  const { invertido, valorActual, plusvalia, pctPlusvalia } = calcularPosicion(inv);
  const tipo = TIPOS_ACTIVO[inv.tipo] || TIPOS_ACTIVO.etf;
  const ganando = plusvalia >= 0;
  const [editando, setEditando] = useState(false);

  return (
    <div style={{
      background:"rgba(255,255,255,0.025)", borderRadius:12,
      border:`1px solid ${tipo.color}25`, padding:"12px 14px", marginBottom:8,
      position:"relative", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background: tipo.color }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
            <span style={{
              fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
              color: tipo.color, background: tipo.color+"20",
              padding:"2px 6px", borderRadius:4,
            }}>{tipo.icono} {tipo.label}</span>
            {inv.ticker && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color:"#6B7A99", fontWeight:600 }}>{inv.ticker}</span>
            )}
          </div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600,
            color:"#CBD5E8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {inv.nombre}
          </div>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={() => setEditando(e => !e)} style={{
            background:"rgba(255,255,255,0.06)", border:"none",
            color:"#6B7A99", cursor:"pointer", fontSize:11, padding:"2px 6px", borderRadius:4,
          }}>{editando ? "✓" : "✎"}</button>
          <button onClick={onEliminar} style={{
            background:"none", border:"none", color:"#FF475760",
            cursor:"pointer", fontSize:16, padding:"0 2px",
          }}>×</button>
        </div>
      </div>

      {editando ? (
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }}>
          <input value={inv.nombre} placeholder="Nombre del activo"
            onChange={e => onUpdate({ ...inv, nombre: e.target.value })}
            style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:6, padding:"6px 10px", color:"#E8EDF5", fontSize:12, outline:"none",
              fontFamily:"'Syne',sans-serif" }}/>
          <input value={inv.ticker || ""} placeholder="Ticker"
            onChange={e => onUpdate({ ...inv, ticker: e.target.value.toUpperCase() })}
            style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:6, padding:"6px 10px", color:"#E8EDF5", fontSize:12, outline:"none",
              fontFamily:"'JetBrains Mono',monospace" }}/>
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
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, color:"#6B7A99", marginBottom:2 }}>Cantidad</div>
              <InputNumero valor={inv.cantidad} onChange={v => onUpdate({ ...inv, cantidad: v })}
                compact ancho={50} step={0.0001}/>
            </div>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, color:"#6B7A99", marginBottom:2 }}>P. medio</div>
              <InputMoneda valor={inv.precioMedio} onChange={v => onUpdate({ ...inv, precioMedio: v })}
                compact ancho={50}/>
            </div>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, color:"#6B7A99", marginBottom:2 }}>P. actual</div>
              <InputMoneda valor={inv.precioActual} onChange={v => onUpdate({ ...inv, precioActual: v })}
                compact ancho={50}/>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700,
                color: ganando ? "#26D07C" : "#FF4757" }}>
                {valorActual.toLocaleString("es-ES",{minimumFractionDigits:2})}€
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#6B7A99", marginTop:2 }}>
                invertido {invertido.toLocaleString("es-ES",{minimumFractionDigits:0})}€
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{
                fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700,
                color: ganando ? "#26D07C" : "#FF4757",
                background: ganando ? "#26D07C15" : "#FF475715",
                padding:"3px 8px", borderRadius:5, display:"inline-block",
              }}>
                {ganando ? "+" : ""}{plusvalia.toLocaleString("es-ES",{minimumFractionDigits:2})}€
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, marginTop:2,
                color: ganando ? "#26D07C" : "#FF4757", fontWeight:600 }}>
                {ganando ? "+" : ""}{pctPlusvalia.toFixed(2)}%
              </div>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between",
            paddingTop:6, borderTop:"1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#6B7A99" }}>
              {inv.cantidad?.toLocaleString("es-ES",{maximumFractionDigits:4}) || 0} ud × {inv.precioActual?.toLocaleString("es-ES",{minimumFractionDigits:2}) || 0}€
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#6B7A99" }}>
              medio {inv.precioMedio?.toLocaleString("es-ES",{minimumFractionDigits:2}) || 0}€
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function FormularioAnadirInversion({ onGuardar, onCancelar }) {
  const [nombre, setNombre]             = useState("");
  const [ticker, setTicker]             = useState("");
  const [tipo, setTipo]                 = useState("etf");
  const [cantidad, setCantidad]         = useState(0);
  const [precioMedio, setPrecioMedio]   = useState(0);
  const [precioActual, setPrecioActual] = useState(0);

  const guardar = () => {
    if (!nombre.trim()) return;
    onGuardar({
      id: `inv-${Date.now()}`,
      nombre: nombre.trim(), ticker: ticker.trim().toUpperCase() || null,
      tipo, cantidad, precioMedio,
      precioActual: precioActual || precioMedio,
    });
  };

  return (
    <div style={{ marginTop:8, padding:"14px", background:"rgba(255,255,255,0.03)", borderRadius:12,
      border:"1px solid rgba(255,255,255,0.08)" }}>
      <input placeholder="Nombre" value={nombre}
        onChange={e => setNombre(e.target.value)}
        style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:8, padding:"8px 10px", color:"#E8EDF5", fontSize:13, outline:"none",
          fontFamily:"'Syne',sans-serif", marginBottom:8 }}/>
      <input placeholder="Ticker (opcional)" value={ticker}
        onChange={e => setTicker(e.target.value)}
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
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:10 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#6B7A99", marginBottom:3 }}>Cantidad</div>
          <InputNumero valor={cantidad} onChange={setCantidad} compact ancho={60} step={0.0001}/>
        </div>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#6B7A99", marginBottom:3 }}>P. medio</div>
          <InputMoneda valor={precioMedio} onChange={setPrecioMedio} compact ancho={60}/>
        </div>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#6B7A99", marginBottom:3 }}>P. actual</div>
          <InputMoneda valor={precioActual} onChange={setPrecioActual} compact ancho={60}/>
        </div>
      </div>
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

function VistaAnalisis({ datos, claveM, mesNum }) {
  const totalIngresos = calcularIngresosMes(datos, claveM);
  const { fijos, vars, ahorro, puntuales, total: totalGastos } = calcularGastoMensualTotal(datos, claveM);
  const aportacion = calcularAportacionAnual(datos, mesNum);
  const margen = totalIngresos - totalGastos;
  const tasaAhorro = totalIngresos > 0 ? (ahorro / totalIngresos) * 100 : 0;

  const cartera = calcularTotalCartera(datos.inversiones || []);
  const liquidez = Object.values(datos.bancosTotales).reduce((a,v) => a + (v||0), 0);
  const patrimonio = liquidez + cartera.valorActual;

  const saldoEmergencia = datos.cuentas
    .filter(c => c.proposito === "emergencia")
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
          <div style={{ flex: cartera.valorActual || 1, height:8, background:"#B06FE8", borderRadius:4 }}/>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#00A3E0" }}>
            Líquido {liquidez.toLocaleString("es-ES",{minimumFractionDigits:0})}€
          </span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#B06FE8" }}>
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

      {/* Distribución de gastos */}
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

  const irMes = (delta) => {
    const d = new Date(nav.año, nav.mes + delta);
    setNav({ mes: d.getMonth(), año: d.getFullYear() });
  };

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
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#6B7A99",
              letterSpacing:"0.12em", textTransform:"uppercase" }}>control mensual</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, letterSpacing:"-0.02em" }}>
              {MESES[nav.mes]} <span style={{ color:"#6B7A99", fontWeight:400, fontSize:16 }}>{nav.año}</span>
            </div>
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

      <div style={{ padding:"16px 16px 0" }}>
        {vista === "inicio"      && <VistaInicio      datos={datos} claveM={claveM} mesNum={nav.mes} onUpdateDatos={onUpdateDatos}/>}
        {vista === "gastos"      && <VistaGastos      datos={datos} claveM={claveM} onUpdateDatos={onUpdateDatos}/>}
        {vista === "anuales"     && <VistaAnuales     datos={datos} claveM={claveM} onUpdateDatos={onUpdateDatos}/>}
        {vista === "inversiones" && <VistaInversiones datos={datos} onUpdateDatos={onUpdateDatos}/>}
        {vista === "analisis"    && <VistaAnalisis    datos={datos} claveM={claveM} mesNum={nav.mes}/>}
      </div>
    </div>
  );
}


// ─── Montaje en el DOM ───
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
