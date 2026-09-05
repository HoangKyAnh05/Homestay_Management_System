@echo off
title Remotion Video Studio Server (:3000 - Auto Recovery)
chcp 65001 >nul
echo ========================================================
echo   KHOI DONG REMOTION VIDEO STUDIO CHO HOMESTAY (AUTO-RETRY)
echo ========================================================
echo Dang khoi dong may chu Remotion tai port 3000...
echo.
cd /d "%~dp0\tool_remotion"

:loop
node server.mjs
echo.
echo [CANH BAO] Remotion Server bi ngat ket noi. Tu dong khoi dong lai sau 2 giay...
timeout /t 2 /nobreak >nul
goto loop
