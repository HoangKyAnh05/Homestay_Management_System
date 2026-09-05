@echo off
title Homestay Public Static Domain (Ngrok)
chcp 65001 >nul
echo ======================================================================
echo          KHOI TAO LINK CO DINH CHO HE THONG HOMESTAY (NGROK)
echo ======================================================================
echo.

:: Nhập thông tin cấu hình cố định tại đây nếu muốn tự động chạy luôn:
set NGROK_DOMAIN=
set NGROK_AUTHTOKEN=

:: Kiểm tra và áp dụng authtoken nếu đã điền sẵn ở trên
if not "%NGROK_AUTHTOKEN%"=="" (
    call ngrok config add-authtoken %NGROK_AUTHTOKEN% >nul 2>&1
)

:: Nếu chưa điền sẵn thông tin trong file, yêu cầu người dùng nhập
if "%NGROK_DOMAIN%"=="" (
    echo [HUONG DAN NHAN DOMAIN CO DINH MIEN PHI 100%%]:
    echo 1. Truy cap: https://dashboard.ngrok.com (Dang nhap nhanh bang Google)
    echo 2. Vao muc 'Domains' -^> Bam 'Claim your free domain' (VD: abc.ngrok-free.app)
    echo 3. Vao muc 'Your Authtoken' -^> Copy doan token
    echo.
    set /p INPUT_AUTHTOKEN=">> Dan Authtoken cua ban (roi an Enter, neu da luu thi an Enter bo qua): "
    if not "%INPUT_AUTHTOKEN%"=="" (
        call ngrok config add-authtoken %INPUT_AUTHTOKEN%
    )
    echo.
    set /p INPUT_DOMAIN=">> Dan Ten Mien Co Dinh cua ban (VD: abc.ngrok-free.app): "
    set NGROK_DOMAIN=%INPUT_DOMAIN%
)

if "%NGROK_DOMAIN%"=="" (
    echo [LOI] Ban chua nhap ten mien. Vui long chay lai file va nhap domain.
    pause
    exit /b
)

echo.
echo ======================================================================
echo   DANG CHAY LINK CO DINH: https://%NGROK_DOMAIN%
echo   LINK NAY HOAT DONG VINH VIEN, KHONG BAO GIO DOI HOAC MAT KET NOI!
echo ======================================================================
echo.

ngrok http --url=%NGROK_DOMAIN% 5173

pause
