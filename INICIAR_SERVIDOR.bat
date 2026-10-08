@echo off
cd /d "%~dp0"
echo Iniciando servidor SCADA PTAR Bellavista...
python -m uvicorn server:app --host 0.0.0.0 --port 8000
pause
