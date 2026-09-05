@echo off
title Homestay Backend Spring Boot (:8080)
chcp 65001 >nul
echo ===================================================
echo   KHOI DONG BACKEND SPRING BOOT (PORT 8080)
echo ===================================================
echo.

:: Uu tien thu muc JDK hop le co bin\java.exe
if exist "D:\jdk\bin\java.exe" (
    set "JAVA_HOME=D:\jdk"
) else if exist "C:\Program Files\Java\jdk-21\bin\java.exe" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-21"
) else if not exist "%JAVA_HOME%\bin\java.exe" (
    echo [CANH BAO] Duong dan JAVA_HOME hien tai khong co bin\java.exe!
)

set "PATH=%JAVA_HOME%\bin;%PATH%"
echo [*] JAVA_HOME chuan: %JAVA_HOME%
echo.

cd /d "%~dp0homestayManagement"
echo [*] Dang khoi dong Spring Boot...
echo.
call mvnw.cmd spring-boot:run
pause
