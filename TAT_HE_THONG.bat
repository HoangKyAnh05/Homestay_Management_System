@echo off
title Dung toan bo he thong Homestay
chcp 65001 >nul
cd /d "%~dp0"
cls
echo ======================================================================
echo          DANG DUNG TOAN BO HE THONG HOMESTAY VA TUNNEL...
echo ======================================================================
echo.

echo [*] Dang dong tien trinh Cloudflare Tunnel va Ngrok...
taskkill /F /IM cloudflared.exe >nul 2>&1
taskkill /F /IM ngrok.exe >nul 2>&1

echo [*] Dang giai phong cac cong 8080 (Backend), 5173 (Frontend), 3000 (Remotion)...
powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 8080, 5173, 3000 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo.
echo ======================================================================
echo   DA DUNG THANH CONG TOAN BO HE THONG! CAC CONG DA DUOC GIAI PHONG.
echo   Cua so nay se tu dong dong sau 2 giay...
echo ======================================================================
ping 127.0.0.1 -n 3 >nul
exit
