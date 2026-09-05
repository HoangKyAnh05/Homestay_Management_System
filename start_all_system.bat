@echo off
title Homestay Management System - Master Launcher
chcp 65001 >nul
cls
echo ======================================================================
echo    HOMESTAY MANAGEMENT SYSTEM - TRINH KHOI DONG TOAN BO HE THONG
echo ======================================================================
echo.
echo  He thong bao gom:
echo    [1] Backend Spring Boot        - Cong 8080 (API, DB, Auth)
echo    [2] Frontend Vite React        - Cong 5173 (Web khach & Admin)
echo    [3] Remotion Video Studio      - Cong 3000 (Studio Video AI)
echo    [4] Ngrok Static Tunnel Web    - Link Deploy CO DINH VINH VIEN
echo    [5] Cloudflare Tunnel Studio   - Link Deploy HTTPS cho Remotion
echo.
echo  * Luu y: Hay dam bao MySQL (XAMPP / Service) da duoc bat truoc!
echo ======================================================================
echo.
pause

echo.
echo [*] Dang khoi dong Backend Spring Boot (Cong 8080)...
start "Homestay Backend (:8080)" cmd /k "cd /d %~dp0 && call start_backend.bat"

echo [*] Cho Backend khoi tao (5 giay)...
timeout /t 5 /nobreak >nul

echo [*] Dang khoi dong Frontend Vite (Cong 5173)...
start "Homestay Frontend (:5173)" cmd /k "cd /d %~dp0 && call start_frontend.bat"

echo [*] Dang khoi dong Remotion Video Studio (Cong 3000)...
start "Remotion Video Studio (:3000)" cmd /k "cd /d %~dp0 && call start_remotion_studio.bat"

echo [*] Cho cac server san sang (3 giay)...
timeout /t 3 /nobreak >nul

echo [*] Dang tao link Deploy CO DINH VINH VIEN cho Web Frontend (Cong 5173)...
start "Ngrok Static Domain (:5173)" cmd /k "cd /d %~dp0 && call start_public_ngrok.bat"

echo [*] Dang tao link Deploy Cloudflare cho Remotion Studio (Cong 3000)...
start "Cloudflare Tunnel Studio (:3000)" cmd /k "cd /d %~dp0 && call start_remotion_tunnel.bat"

echo.
echo ======================================================================
echo  DA KHOI DONG TOAN BO CAC DICH VU!
echo  Link Web Co Dinh Vinh Vien: https://reminder-strife-awoke.ngrok-free.dev
echo ======================================================================
echo.
pause
