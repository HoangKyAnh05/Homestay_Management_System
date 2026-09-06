Set fso = CreateObject("Scripting.FileSystemObject")
rootDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = rootDir

' Chay file khoi dong he thong voi quyen an hoan toan
cmd = "powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File """ & rootDir & "\start_system_cloudflare.ps1"""
WshShell.Run cmd, 0, False

Set WshShell = Nothing
Set fso = Nothing
