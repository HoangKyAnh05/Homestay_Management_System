@echo off
title Homestay Frontend Vite (:5173)
chcp 65001 >nul
echo ===================================================
echo   KHOI DONG FRONTEND VITE REACT (PORT 5173)
echo ===================================================
echo.
cd /d "%~dp0frontendHomestayManagement"
call npm run dev
pause
