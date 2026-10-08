const DB_NAME = "scada_ptar_bellavista_local";
const STORE = "registros";
const DEVICE_KEY = "scada_device_id";
const API_SYNC = "/api/sync";
const $ = id => document.getElementById(id);
let db;

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 3 | 8)).toString(16);
  });
}
function deviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) { id = uuid(); localStorage.setItem(DEVICE_KEY, id); }
  return id;
}
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, {keyPath:"id"});
      store.createIndex("estado", "estado", {unique:false});
      store.createIndex("fecha_hora", "fecha_hora", {unique:false});
    };
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}
function allRecords() {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result.sort((a,b) => b.fecha_hora.localeCompare(a.fecha_hora)));
    req.onerror = () => reject(req.error);
  });
}
function putRecord(record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
function updateRecord(id, changes) {
  return new Promise(async (resolve, reject) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const req = store.get(id);
      req.onsuccess = () => store.put({...req.result, ...changes});
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    } catch(e) { reject(e); }
  });
}
function setFields() {
  const type = $("tipo").value;
  let fields = [];
  if (type.startsWith("ph_")) fields = [
    ["ph", "Valor de pH", "number", "0.01"],
    ["temperatura_c", "Temperatura (°C)", "number", "0.1"]
  ];
  else if (type === "aforo") fields = [
    ["volumen_l", "Volumen (L)", "number", "0.01"],
    ["tiempo_s", "Tiempo (s)", "number", "0.01"]
  ];
  else if (type === "lavado") fields = [
    ["unidad", "Unidad lavada", "text", null],
    ["estado", "Estado", "select", null],
    ["tiempo", "Tiempo empleado", "text", null]
  ];
  else fields = [
    ["categoria", "Categoría de novedad", "text", null],
    ["prioridad", "Prioridad", "select_priority", null]
  ];
  $("dynamicFields").innerHTML = '<div class="field-grid">' + fields.map(([id,label,type,step]) => {
    let input;
    if (type === "select") input = `<select id="f_${id}"><option>Completado</option><option>Parcial</option><option>Pendiente</option></select>`;
    else if (type === "select_priority") input = `<select id="f_${id}"><option>Baja</option><option>Media</option><option>Alta</option></select>`;
    else input = `<input id="f_${id}" type="${type}" ${step ? `step="${step}"` : ""} ${type==="number" ? 'required' : 'required'}>`;
    return `<label>${label}${input}</label>`;
  }).join("") + "</div>";
}
function valueFor(id) {
  const el = $("f_" + id);
  if (!el) return "";
  return el.type === "number" ? Number(el.value) : el.value.trim();
}
function collectData() {
  const type = $("tipo").value;
  let keys = type.startsWith("ph_") ? ["ph","temperatura_c"] :
    type === "aforo" ? ["volumen_l","tiempo_s"] :
    type === "lavado" ? ["unidad","estado","tiempo"] : ["categoria","prioridad"];
  const datos = {};
  keys.forEach(k => datos[k] = valueFor(k));
  datos.observaciones = $("observaciones").value.trim();
  return datos;
}
function typeName(t) {
  return ({ph_entrada:"pH de entrada",ph_salida:"pH de salida",aforo:"Aforo",lavado:"Lavado de unidades",novedad:"Novedad"})[t] || t;
}
async function render() {
  const rows = await allRecords();
  const pending = rows.filter(r => r.estado_sync !== "sincronizado").length;
  $("counts").textContent = `${pending} pendientes · ${rows.length-pending} sincronizados`;
  $("records").innerHTML = rows.slice(0,100).map(r => `
    <article class="record">
      <div class="record-top"><b>${typeName(r.tipo)}</b><span class="badge ${r.estado_sync==="sincronizado"?"synced":""}">${r.estado_sync==="sincronizado"?"Sincronizado":"Pendiente"}</span></div>
      <small>${r.fecha_hora.replace("T"," ")} · ${escapeHtml(r.operador)}</small>
      <div>${escapeHtml(JSON.stringify(r.datos))}</div>
    </article>`).join("") || "<p>No hay registros guardados en este dispositivo.</p>";
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
async function checkConnection() {
  if (!navigator.onLine) { $("connection").textContent = "Sin conexión · modo local"; return false; }
  try {
    const r = await fetch("/api/health", {cache:"no-store"});
    if (!r.ok) throw new Error();
    $("connection").textContent = "Conectado";
    return true;
  } catch {
    $("connection").textContent = "Sin servidor · modo local";
    return false;
  }
}
async function syncPending() {
  if (!(await checkConnection())) {
    $("syncMessage").textContent = "No hay conexión con el servidor. Los datos siguen guardados en este dispositivo.";
    return;
  }
  const rows = (await allRecords()).filter(r => r.estado_sync !== "sincronizado");
  if (!rows.length) { $("syncMessage").textContent = "No hay registros pendientes."; return; }
  $("syncMessage").textContent = "Sincronizando…";
  const payload = {device_id:deviceId(), registros: rows.map(r => ({
    sync_uuid:r.id, tabla:r.tipo, fecha:r.fecha_hora, operador:r.operador,
    datos:r.datos, device_id:r.dispositivo_id
  }))};
  try {
    const response = await fetch(API_SYNC, {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("El servidor rechazó la sincronización.");
    const result = await response.json();
    const confirmed = new Set(result.confirmados || []);
    for (const row of rows) if (confirmed.has(row.id)) await updateRecord(row.id, {estado_sync:"sincronizado"});
    $("syncMessage").textContent = `Sincronización terminada: ${confirmed.size} registros confirmados.`;
    await render();
  } catch (e) {
    $("syncMessage").textContent = "No se pudo sincronizar. Los registros permanecen guardados para reintentar.";
  }
}
$("tipo").addEventListener("change", setFields);
$("recordForm").addEventListener("submit", async event => {
  event.preventDefault();
  const record = {
    id:uuid(), tipo:$("tipo").value, fecha_hora:$("fechaHora").value,
    operador:$("operador").value.trim(), datos:collectData(),
    dispositivo_id:deviceId(), estado_sync:"pendiente",
    creado_local:new Date().toISOString()
  };
  if (!record.operador) { alert("Escribe el nombre del operador."); return; }
  await putRecord(record);
  $("recordForm").reset();
  $("fechaHora").value = new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
  setFields();
  await render();
  $("syncMessage").textContent = "Registro guardado localmente. Sincroniza cuando haya conexión.";
});
$("syncBtn").addEventListener("click", syncPending);
$("refreshBtn").addEventListener("click", render);
window.addEventListener("online", checkConnection);
window.addEventListener("online", () => syncPending());
(async () => {
  try {
    await openDB();
    setFields();
    $("fechaHora").value = new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
    await render();
    await checkConnection();
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
  } catch(e) {
    $("syncMessage").textContent = "No se pudo iniciar el almacenamiento local del navegador.";
  }
})();
