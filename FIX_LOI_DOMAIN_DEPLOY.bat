@echo off
chcp 65001 > nul
echo ================================================================
echo      CONG CU FIX LOI ERR_SSL_PROTOCOL_ERROR (1-CLICK)
echo ================================================================
echo.
echo Dang kiem tra quyen Administrator...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [THONG BAO] Dang yeu cau quyen Administrator de sua file hosts...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo [OK] Da co quyen Administrator!
echo.
echo Dang kiem tra file hosts...
findstr /i "homestay-sapa.myvnc.com" %WINDIR%\System32\drivers\etc\hosts >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Da co cau hinh cu, dang cap nhat lai tro ve 14.225.253.234...
    powershell -Command "$content = (Get-Content $env:WINDIR\System32\drivers\etc\hosts) | Where-Object { $_ -notmatch 'homestay-sapa\.myvnc\.com' }; Set-Content -Path $env:WINDIR\System32\drivers\etc\hosts -Value $content"
)

echo Dang them: 14.225.253.234 homestay-sapa.myvnc.com vao hosts...
echo 14.225.253.234 homestay-sapa.myvnc.com>> %WINDIR%\System32\drivers\etc\hosts

echo.
echo Dang lam sach DNS Cache cua Windows...
ipconfig /flushdns >nul

echo.
echo ================================================================
echo [THANH CONG] Da fix xong loi ket noi deploy!
echo Bay gio ban hay F5 lai trinh duyet tren trang:
echo https://homestay-sapa.myvnc.com
echo ================================================================
echo.
pause
