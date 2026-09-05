@echo off
title Homestay Backend Spring Boot (:8080)
chcp 65001 >nul
echo ===================================================
echo   KHOI DONG BACKEND SPRING BOOT (PORT 8080)
echo ===================================================
echo.
cd /d "%~dp0homestayManagement"
call mvnw.cmd spring-boot:run
pause
