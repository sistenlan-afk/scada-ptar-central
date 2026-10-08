from datetime import datetime, timezone
from pathlib import Path
import json, sqlite3
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE=Path(__file__).resolve().parent
WEB=BASE
DB=BASE/'SCADA_PTAR_CENTRAL.db'

def conn():
    c=sqlite3.connect(DB); c.row_factory=sqlite3.Row; return c

def init():
    with conn() as c:
        c.execute("""CREATE TABLE IF NOT EXISTS registros_sync(
          sync_uuid TEXT PRIMARY KEY, tabla TEXT NOT NULL, device_id TEXT,
          fecha_hora TEXT, operador TEXT, datos_json TEXT NOT NULL,
          recibido_en TEXT NOT NULL)""")
        c.execute('CREATE INDEX IF NOT EXISTS idx_sync_tabla_fecha ON registros_sync(tabla,fecha_hora)')
        c.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init()
    yield

app=FastAPI(
    title='SCADA PTAR Bellavista - Servidor Central',
    version='1.0',
    lifespan=lifespan
)

# 🔥 ESTO CORRIGE EL PROBLEMA DE SINCRONIZACIÓN (Habilita CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite que cualquier dispositivo o celular se conecte
    allow_credentials=True,
    allow_methods=["*"],  # Permite envíos POST y consultas GET
    allow_headers=["*"],
)

class Payload(BaseModel):
    device_id: str|None=None
    registros: list[dict]

@app.get('/')
def home(): return FileResponse(WEB/'index.html')

@app.get('/styles.css')
def css(): return FileResponse(WEB/'styles.css', media_type='text/css')

@app.get('/app.js')
def js(): return FileResponse(WEB/'app.js', media_type='application/javascript')

@app.get('/manifest.json')
def manifest(): return FileResponse(WEB/'manifest.json', media_type='application/json')

@app.get('/sw.js')
def sw(): return FileResponse(WEB/'sw.js',media_type='application/javascript',headers={'Service-Worker-Allowed':'/'})

@app.get('/api/health')
def health(): return {'ok':True,'server_time':datetime.now(timezone.utc).isoformat()}

@app.post('/api/sync')
def sync(payload:Payload):
    confirmed=[]; duplicates=[]; now=datetime.now(timezone.utc).isoformat()
    with conn() as c:
        for r in payload.registros:
            uid=str(r.get('sync_uuid') or r.get('id') or '')
            if not uid: continue
            exists=c.execute('SELECT 1 FROM registros_sync WHERE sync_uuid=?',(uid,)).fetchone()
            if exists:
                duplicates.append(uid); confirmed.append(uid); continue
            datos=dict(r); tabla=datos.pop('tabla',r.get('tabla','desconocida'))
            operador=str(datos.get('operador') or datos.get('responsable') or '')
            fecha=str(datos.get('fecha') or datos.get('fecha_hora') or '')
            c.execute('INSERT INTO registros_sync(sync_uuid,tabla,device_id,fecha_hora,operador,datos_json,recibido_en) VALUES(?,?,?,?,?,?,?)',
                      (uid,tabla,payload.device_id or r.get('device_id'),fecha,operador,json.dumps(datos,ensure_ascii=False),now))
            confirmed.append(uid)
        c.commit()
    return {'ok':True,'confirmados':confirmed,'duplicados':duplicates,'mensaje':f'{len(confirmed)} registros confirmados por el servidor.'}

@app.get('/api/registros')
def registros(tabla:str|None=None,limit:int=500):
    limit=max(1,min(limit,5000))
    with conn() as c:
        if tabla:
            rows=c.execute('SELECT * FROM registros_sync WHERE tabla=? ORDER BY recibido_en DESC LIMIT ?',(tabla,limit)).fetchall()
        else:
            rows=c.execute('SELECT * FROM registros_sync ORDER BY recibido_en DESC LIMIT ?',(limit,)).fetchall()
    out=[]
    for r in rows:
        d=dict(r); d['datos']=json.loads(d.pop('datos_json')); out.append(d)
    return {'registros':out,'cantidad':len(out)}
