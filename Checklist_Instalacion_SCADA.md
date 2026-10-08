# Guía de Requerimientos e Instalación - SCADA PTAR

Este documento contiene la lista de verificación (checklist) y los pasos técnicos ejecutados para la configuración y compilación del entorno de desarrollo del sistema **SCADA PTAR Bellavista (v4)**.

## 1. Entorno de Trabajo y Directorios
El proyecto se encuentra alojado y configurado en la ruta local de la máquina operativa:
* **Ruta del Proyecto:** `C:\Users\joel\Desktop\proyectos\ultimos arreglos`
* **Acceso vía Consola (PowerShell):** Se validó la navegación correcta al directorio usando el comando `cd`.

## 2. Librerías y Dependencias de Python (`requirements_SCADA_PTAR.txt`)
Se instalaron con éxito los paquetes requeridos por el script principal para la gestión de la Planta de Tratamiento de Aguas Residuales. Las librerías clave instaladas son:

* **`matplotlib`**: Utilizada para el despliegue de los gráficos de flujo, curvas de aforo y el comportamiento analítico en la interfaz de usuario.
* **`reportlab`**: Encargada del diseño estructurado, maquetación y exportación automatizada de los reportes de planta a formato **PDF**.
* **`openpyxl`**: Motor de lectura y escritura para la manipulación y almacenamiento de históricos consolidados de aforos en hojas de cálculo **Excel**.
* **`sqlite3`**: Base de datos relacional local integrada de forma nativa para el registro permanente de datos.

## 3. Compilación y Despliegue de Producción
Para la entrega formal y operación independiente en planta sin necesidad de consolas de código, se empaquetó el entorno ejecutable:
1. **Herramienta:** `pyinstaller` (Instalada mediante `pip install pyinstaller`).
2. **Comando de compilación:** 
   ```bash
   pyinstaller --onefile --windowed SCADA_PTAR_BELLAVISTA_COMPLETO_v4.py
   ```
3. **Resultado:** Proceso finalizado con éxito (`Build complete!`). El archivo ejecutable autónomo quedó generado en la ruta:
   `..\ultimos arreglos\dist\SCADA_PTAR_BELLAVISTA_COMPLETO_v4.exe`

---
*Nota de Distribución: Para asegurar la lectura de históricos y la generación de PDF, el archivo .exe debe ejecutarse preferiblemente en el directorio raíz junto con sus carpetas de 'Reportes' y archivos de datos (.db).*
