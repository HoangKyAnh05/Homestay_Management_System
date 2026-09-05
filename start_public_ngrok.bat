@echo off
title Homestay Public Static Domain (Ngrok - Vinh Vien)
chcp 65001 >nul
echo ======================================================================
echo          KHOI TAO LINK CO DINH CHO HE THONG HOMESTAY (NGROK)
echo ======================================================================
echo.

:: Ten mien tinh vinh vien cua ban:
set NGROK_DOMAIN=reminder-strife-awoke.ngrok-free.dev

:: Kiem tra neu tien trinh ngrok cu dang chay, giai phong de chay moi
for /f "tokens=2" %%i in ('tasklist ^| findstr /i "ngrok.exe"') do (
    echo [*] Dang giai phong tien trinh ngrok cu (PID: %%i)...
    taskkill /F /PID %%i >nul 2>&1
    timeout /t 1 /nobreak >nul
)

echo [*] DANG KET NOI LINK CO DINH: https://%NGROK_DOMAIN%
echo [*] LINK NAY CO DINH VINH VIEN, KHONG BAO GIO DOI KHI KHOI DONG LAI!
echo ======================================================================
echo.

:loop
ngrok http 5173 --url=https://%NGROK_DOMAIN%
echo.
echo [CANH BAO] Ngrok bi ngat ket noi. Tu dong ket noi lai sau 3 giay...
timeout /t 3 /nobreak >nul
goto loop
