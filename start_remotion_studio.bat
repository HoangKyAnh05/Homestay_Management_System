@echo off
title Remotion Video Studio Server (:3000)
chcp 65001 >nul
echo ========================================================
echo   KHOI DONG REMOTION VIDEO STUDIO CHO HOMESTAY
echo ========================================================
echo.

:: Kiem tra neu port 3000 dang bi chiem boi tien trinh cu, giai phong port tranh loi EADDRINUSE
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [*] Phat hien port 3000 dang duoc su dung boi PID %%a. Dang giai phong de khoi dong moi...
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 1 /nobreak >nul
)

cd /d "%~dp0tool_remotion"
echo [*] Dang khoi dong Remotion Server tai cong 3000...
echo.

:loop
node server.mjs
echo.
echo [CANH BAO] Remotion Server bi ngat ket noi. Tu dong khoi dong lai sau 2 giay...
timeout /t 2 /nobreak >nul
goto loop
