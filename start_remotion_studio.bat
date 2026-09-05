@echo off
title Remotion Video Studio Server (:3000)
echo ========================================================
echo   KHOI DONG REMOTION VIDEO STUDIO CHO HOMESTAY
echo ========================================================
echo Dang khoi dong may chu Remotion tai port 3000...
echo.
cd /d "%~dp0\tool_remotion"
node server.mjs
pause
