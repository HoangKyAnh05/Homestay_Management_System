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
echo    [4] Cloudflare Tunnel Web      - Tao link deploy HTTPS cho Frontend
echo    [5] Cloudflare Tunnel Studio   - Tao link deploy HTTPS cho Remotion
echo.
echo  * Luu y: Hay dam bao MySQL (XAMPP / Service) da duoc bat truoc!
echo ======================================================================
echo.
pause

echo.
echo [*] Dang khoi dong Backend Spring Boot (Cong 8080)...
start "Homestay Backend (:8080)" cmd /k "cd /d %~dp0homestayManagement && mvnw.cmd spring-boot:run"

echo [*] Cho Backend khoi tao (5 giay)...
timeout /t 5 /nobreak >nul

echo [*] Dang khoi dong Frontend Vite (Cong 5173)...
start "Homestay Frontend (:5173)" cmd /k "cd /d %~dp0frontendHomestayManagement && npm run dev"

echo [*] Dang khoi dong Remotion Video Studio (Cong 3000)...
start "Remotion Video Studio (:3000)" cmd /k "cd /d %~dp0tool_remotion && node server.mjs"

echo [*] Cho cac server san sang (3 giay)...
timeout /t 3 /nobreak >nul

echo [*] Dang tao link Deploy Cloudflare cho Web Frontend (Cong 5173)...
start "Cloudflare Tunnel Web (:5173)" cmd /k "cd /d %~dp0 && call start_public_tunnel.bat"

echo [*] Dang tao link Deploy Cloudflare cho Remotion Studio (Cong 3000)...
start "Cloudflare Tunnel Studio (:3000)" cmd /k "cd /d %~dp0 && call start_remotion_tunnel.bat"

echo.
echo ======================================================================
echo  DA KHOI DONG TOAN BO CAC DICH VU!
echo  Hay kiem tra 2 cua so Cloudflare Tunnel de lay link https://...trycloudflare.com
echo ======================================================================
echo.
pause
