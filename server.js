const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const DATA_FILE = path.join(__dirname, 'data.json');

// Crear data.json si no existe
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function leerDatos() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE)); } 
    catch { return []; }
}
function guardarDatos(datos) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(datos, null, 2));
}

// API: El celular y el PC leen de aquí
app.get('/api/datos', (req, res) => {
    res.json(leerDatos());
});

// API: El celular y el PC escriben aquí
app.post('/api/datos', (req, res) => {
    const datos = leerDatos();
    const nuevo = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        ...req.body
    };
    datos.push(nuevo);
    guardarDatos(datos);
    res.json({ok: true, dato: nuevo});
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('SCADA Central listo en puerto', PORT));
