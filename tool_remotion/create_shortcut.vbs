Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set oWS = CreateObject("WScript.Shell")

electronExe = scriptDir & "\node_modules\electron\dist\electron.exe"
iconPath = scriptDir & "\assets\app-icon.ico"

' Danh sach cac duong dan Desktop
desktopPaths = Array(oWS.SpecialFolders("Desktop"), "C:\Users\Admin\Desktop")

For Each dPath in desktopPaths
    If fso.FolderExists(dPath) Then
        sLinkFile = dPath & "\Remotion AI Video Editor.lnk"
        
        ' Xoa shortcut cu neu co
        If fso.FileExists(sLinkFile) Then
            On Error Resume Next
            fso.DeleteFile(sLinkFile)
            On Error Goto 0
        End If

        ' Tao shortcut moi tro truc tiep vao electron.exe de mo app ngay lap tuc
        Set oLink = oWS.CreateShortcut(sLinkFile)
        oLink.TargetPath = electronExe
        oLink.Arguments = "."
        oLink.WorkingDirectory = scriptDir
        oLink.Description = "Remotion AI Video Auto-Editor Desktop App"
        
        If fso.FileExists(iconPath) Then
            oLink.IconLocation = iconPath & ",0"
        Else
            oLink.IconLocation = electronExe & ",0"
        End If
        
        oLink.Save
        Set oLink = Nothing
    End If
Next

Set oWS = Nothing
Set fso = Nothing
