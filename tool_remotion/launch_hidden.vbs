Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = scriptDir

electronExe = scriptDir & "\node_modules\electron\dist\electron.exe"

If fso.FileExists(electronExe) Then
    ' electron.exe la ung dung GUI native, chay truc tiep khong he co man hinh den cmd
    WshShell.Run chr(34) & electronExe & chr(34) & " .", 1, False
Else
    WshShell.Run "cmd /c npm run build && npx electron .", 1, False
End If

Set WshShell = Nothing
Set fso = Nothing
