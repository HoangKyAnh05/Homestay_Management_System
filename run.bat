@echo off
title Homestay Code Flow Explorer Launcher
echo ===================================================
echo   Khoi dong Homestay Code Flow Explorer...
echo ===================================================
cd /d "%~dp0\electron_explanation_app"
if not exist node_modules (
    echo Khong tim thay thu muc node_modules. Dang tien hanh cai dat...
    call npm install
)
echo Dang chay ung dung Electron...
call npm start
