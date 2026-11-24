@echo off
echo ===================================================
echo Launching Sales Analytics Dashboard (Full Stack)
echo ===================================================
cd /d "%~dp0"
start "Sales Analytics Backend (Flask:5000)" cmd /k "call backend\venv\Scripts\activate.bat && python backend\app.py"
start "Sales Analytics Frontend (Vite:3000)" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"
echo.
echo Both backend and frontend servers are launching!
echo Frontend UI: http://localhost:3000
echo Backend API: http://localhost:5000/api/health
echo.
pause
