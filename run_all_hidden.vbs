Set fso = CreateObject("Scripting.FileSystemObject")
rootDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = rootDir

' 1. Don dep tien trinh ngrok cu va cac port cu neu co
WshShell.Run "cmd /c taskkill /F /IM ngrok.exe >nul 2>&1", 0, True
WshShell.Run "powershell -WindowStyle Hidden -Command ""Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 8080, 5173, 3000 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }""", 0, True

WScript.Sleep 1000

' 2. Khoi dong Backend Spring Boot (:8080) chay ngam hoan toan
WshShell.Run "cmd /c ""set JAVA_HOME=D:\jdk&& set PATH=D:\jdk\bin;%PATH%&& cd /d """ & rootDir & "\homestayManagement"" && mvnw.cmd spring-boot:run""", 0, False

WScript.Sleep 5000

' 3. Khoi dong Frontend Vite (:5173) chay ngam hoan toan
WshShell.Run "cmd /c ""cd /d """ & rootDir & "\frontendHomestayManagement"" && npm run dev""", 0, False

' 4. Khoi dong Remotion Video Studio (:3000) chay ngam hoan toan
WshShell.Run "cmd /c ""cd /d """ & rootDir & "\tool_remotion"" && node server.mjs""", 0, False

WScript.Sleep 3000

' 5. Khoi dong Ngrok Tunnel voi link co dinh vinh vien chay ngam hoan toan
WshShell.Run "cmd /c ""ngrok http 5173 --url=https://reminder-strife-awoke.ngrok-free.dev""", 0, False

WScript.Sleep 3000

' 6. Tu dong mo link deploy Ngrok tren trinh duyet mac dinh
WshShell.Run "cmd /c start https://reminder-strife-awoke.ngrok-free.dev", 0, False

Set WshShell = Nothing
Set fso = Nothing
