SCADA PTAR BELLAVISTA — BASE PWA OFFLINE + API DE SINCRONIZACIÓN
================================================================

IMPORTANTE
----------
Este paquete es una BASE INICIAL para desarrollar el módulo móvil y la sincronización.
No sustituye todavía el programa Tkinter de Windows ni está conectado automáticamente
a la base de datos de producción existente.

QUÉ INCLUYE
-----------
- Interfaz web adaptable a celular, tableta y computador.
- PWA instalable desde un navegador compatible.
- Formularios para pH, aforos, lavados y novedades.
- Guardado local en el navegador mediante IndexedDB.
- Cola de registros pendientes de sincronización.
- API de ejemplo con FastAPI y SQLite.
- Identificadores únicos para evitar duplicar registros cuando se reintenta la sincronización.

REQUISITOS PARA PROBAR EN UN COMPUTADOR
---------------------------------------
Python 3.10 o posterior.

1. Extraiga el ZIP en una carpeta.
2. Abra una terminal en esa carpeta.
3. Instale dependencias:
   pip install -r requirements.txt
4. Inicie la API:
   uvicorn server:app --host 127.0.0.1 --port 8000
5. Abra en el navegador:
   http://127.0.0.1:8000

LIMITACIONES IMPORTANTES
-----------------------
- Para que los dispositivos compartan datos, la API debe desplegarse en un servidor accesible
  desde los dispositivos, con HTTPS, autenticación, copias de seguridad y controles de acceso.
- En la prueba local, la dirección 127.0.0.1 solo funciona en el mismo computador.
- El envío automático de datos desde Windows todavía debe integrarse en el programa de escritorio.
- Antes de usar datos reales, hay que definir los límites de pH aprobados por la PTAR, usuarios,
  permisos, política de conflictos y servidor de producción.
- El funcionamiento sin conexión depende de que la PWA se haya abierto y cargado al menos
  una vez en el dispositivo.
