Set WshShell = CreateObject("WScript.Shell")
' Run the batch file hidden (0 = hide window, false = don't wait for execution to complete)
WshShell.Run "cmd.exe /c """ & WshShell.CurrentDirectory & "\..\run.bat""", 0, false
