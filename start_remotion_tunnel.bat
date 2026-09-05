@echo off
title Remotion Studio Public Tunnel (Cloudflare - Port 3000)
chcp 65001 >nul
echo ======================================================================
echo       KHOI TAO LINK CLOUDFLARE CHO REMOTION STUDIO (PORT 3000)
echo ======================================================================
echo.
echo [*] Dang ket noi Cloudflare Tunnel den Remotion Studio (Cong 3000)...
echo [*] Giao thuc toi uu (QUIC) giup giu ket noi on dinh, khong bi ngat.
echo.
echo Chu y: Hay copy link https://...trycloudflare.com khi hien len man hinh!
echo ======================================================================
echo.

:loop
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:3000
echo.
echo [CANH BAO] Ket noi bi gian doan. Dang tu dong ket noi lai sau 3 giay...
timeout /t 3 /nobreak >nul
goto loop
