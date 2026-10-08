SCADA PTAR BELLAVISTA - VERSION COMPLETA v4

1. Copie estos archivos en la misma carpeta:
   - SCADA_PTAR_BELLAVISTA_COMPLETO_v4.py
   - SCADA_PTAR_BELLAVISTA.db

2. Instale dependencias desde CMD/PowerShell:
   py -m pip install -r requirements_SCADA_PTAR.txt

3. Ejecute:
   py SCADA_PTAR_BELLAVISTA_COMPLETO_v4.py

Funciones incorporadas en esta version:
- Base SQLite central.
- Persistencia de pH, aforos, dosificacion, mantenimiento, lavado, novedades y horometros.
- Centro de Analitica con KPIs y graficas desde SQLite.
- Centro de Reportes.
- Exportacion HTML.
- Exportacion Excel si openpyxl esta instalado.
- Exportacion PDF si reportlab esta instalado.
- Scroll y compactacion de modulos.

Importante:
La aplicacion es un sistema de escritorio con funciones tipo SCADA. La conexion futura a PLC/sensores se puede agregar sin cambiar la arquitectura de base de datos.
