@echo off
title Homestay Public Tunnel (Cloudflare - Auto Reconnect)
chcp 65001 >nul
echo ======================================================================
echo       KHOI TAO LINK CLOUDFLARE CHO HE THONG HOMESTAY (ON DINH)
echo ======================================================================
echo.
echo [*] Dang ket noi Cloudflare Tunnel den Frontend (Cong 5173)...
echo [*] Giao thuc toi uu (QUIC) giup giu ket noi on dinh, khong bi ngat.
echo.
echo Chu y: Hay copy link https://...trycloudflare.com khi hien len man hinh!
echo ======================================================================
echo.

:loop
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:5173
echo.
echo [CANH BAO] Ket noi bi gian doan. Dang tu dong ket noi lai sau 3 giay...
timeout /t 3 /nobreak >nul
goto loop
