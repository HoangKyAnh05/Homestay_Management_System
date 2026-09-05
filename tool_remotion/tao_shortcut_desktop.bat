@echo off
chcp 65001 >nul
echo Đang tạo Shortcut Desktop cho Remotion AI Video Auto-Editor...

powershell -NoProfile -ExecutionPolicy Bypass -Command "& { $sh = New-Object -ComObject WScript.Shell; $target = $sh.CreateShortcut([System.IO.Path]::Combine($sh.SpecialFolders('Desktop'), 'Remotion AI Video Editor.lnk')); $target.TargetPath = '%~dp0node_modules\electron\dist\electron.exe'; $target.Arguments = '.'; $target.WorkingDirectory = '%~dp0'; $target.IconLocation = '%~dp0assets\app-icon.ico,0'; $target.Description = 'Remotion AI Video Auto-Editor Desktop App'; $target.Save(); }"

if exist "C:\Users\Admin\Desktop" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "& { $sh = New-Object -ComObject WScript.Shell; $target = $sh.CreateShortcut('C:\Users\Admin\Desktop\Remotion AI Video Editor.lnk'); $target.TargetPath = '%~dp0node_modules\electron\dist\electron.exe'; $target.Arguments = '.'; $target.WorkingDirectory = '%~dp0'; $target.IconLocation = '%~dp0assets\app-icon.ico,0'; $target.Description = 'Remotion AI Video Auto-Editor Desktop App'; $target.Save(); }"
)

echo [OK] Đã tạo thành công Shortcut trên Màn hình chính Desktop!
pause
