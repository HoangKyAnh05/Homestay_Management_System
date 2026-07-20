@echo off
set SCRIPT_DIR=%~dp0
set VBS_PATH=%SCRIPT_DIR%electron_explanation_app\run_app.vbs
set SHORTCUT_NAME=Homestay Code Flow Explorer

echo Dang tao shortcut tren Desktop cho ung dung...

powershell -NoProfile -Command ^
    "$ws = New-Object -ComObject WScript.Shell; " ^
    "$desktop = [System.Environment]::GetFolderPath('Desktop'); " ^
    "$shortcut = $ws.CreateShortcut(\"$desktop\\%SHORTCUT_NAME%.lnk\"); " ^
    "$shortcut.TargetPath = 'wscript.exe'; " ^
    "$shortcut.Arguments = \"\"\"%VBS_PATH%\"\"\"; " ^
    "$shortcut.WorkingDirectory = \"%SCRIPT_DIR%electron_explanation_app\"; " ^
    "$shortcut.Description = 'Xem luong code Homestay Management System'; " ^
    "$shortcut.IconLocation = 'shell32.dll,24'; " ^
    "$shortcut.Save();"

echo.
echo ============================================================
echo   DA TAO SHORTCUT THANH CONG NGOAI DESKTOP!
echo   Ten: %SHORTCUT_NAME%
echo   Shortcut se chay an Terminal bang VBScript nen ban chi can
echo   double-click la ung dung se tu mo len.
echo ============================================================
pause
