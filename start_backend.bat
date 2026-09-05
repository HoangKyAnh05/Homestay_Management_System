@echo off
title Homestay Backend Spring Boot (:8080)
chcp 65001 >nul
echo ===================================================
echo   KHOI DONG BACKEND SPRING BOOT (PORT 8080)
echo ===================================================
echo.

:: Tu dong nhan dien va thiet lap JAVA_HOME
if not defined JAVA_HOME (
    if exist "D:\jdk\bin\java.exe" (
        set "JAVA_HOME=D:\jdk"
    ) else if exist "C:\Program Files\Java\jdk-21\bin\java.exe" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-21"
    )
)

if defined JAVA_HOME (
    set "PATH=%JAVA_HOME%\bin;%PATH%"
    echo [*] Da tu dong thiet lap JAVA_HOME = %JAVA_HOME%
) else (
    echo [CANH BAO] Khong tim thay JAVA_HOME! Hay kiem tra D:\jdk
)

cd /d "%~dp0homestayManagement"
echo [*] Dang chay: mvnw.cmd spring-boot:run ...
echo.
call mvnw.cmd spring-boot:run
pause
