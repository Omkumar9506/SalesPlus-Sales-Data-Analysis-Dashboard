@echo off
echo ===================================================
echo Starting Sales Analytics Flask Backend (Port 5000)
echo ===================================================
cd /d "%~dp0"
call backend\venv\Scripts\activate.bat
python backend\app.py
pause
