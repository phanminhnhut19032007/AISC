Set oShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

Dim scriptDir : scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
Dim lockFile  : lockFile  = scriptDir & "\.renteasy_lock"

' ==========================================
' CHONG CHAY NHIEU LAN CUNG LUC (MUTEX)
' ==========================================
If fso.FileExists(lockFile) Then
    MsgBox "RENTEASY dang duoc khoi dong hoac da chay. Vui long doi hoac tat truoc!", 48, "RENTEASY"
    WScript.Quit
End If

' Tao file khoa
Dim f : Set f = fso.CreateTextFile(lockFile, True)
f.WriteLine Now()
f.Close

' ==========================================
' BUOC 0: Don dep cac tien trinh cu
' ==========================================
oShell.Run """" & scriptDir & "\kill_servers.bat""", 0, True
WScript.Sleep 2500

' ==========================================
' BUOC 1: Khoi dong Backend (FastAPI) - Tu dong tim Python / venv bat ky thu muc nao
' ==========================================
Dim pyCmd
If fso.FileExists(scriptDir & "\smartrent-backend\venv\Scripts\python.exe") Then
    pyCmd = ".\venv\Scripts\python.exe"
Else
    pyCmd = "python"
End If

oShell.Run "cmd /k ""cd /d """ & scriptDir & "\smartrent-backend"" && set DATABASE_URL=sqlite+aiosqlite:///./smartrent_demo.db && set DATABASE_URL_SYNC=sqlite:///./smartrent_demo.db && set PYTHONIOENCODING=utf-8 && " & pyCmd & " -m uvicorn app.main:app --host 127.0.0.1 --port 8000""", 1, False

' ==========================================
' BUOC 2: Khoi dong Frontend (Next.js) - Duong dan dong linh hoat
' ==========================================
oShell.Run "cmd /k ""cd /d """ & scriptDir & "\smartrent-frontend"" && npm run dev""", 1, False

' ==========================================
' BUOC 3: Doi 5 giay cho server san sang
' ==========================================
WScript.Sleep 5000

' ==========================================
' BUOC 4: Mo trinh duyet (Coc Coc -> Edge -> Chrome -> Mac dinh)
' ==========================================
Dim coccocPath1 : coccocPath1 = "C:\Program Files\CocCoc\Browser\Application\browser.exe"
Dim coccocPath2 : coccocPath2 = oShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\CocCoc\Browser\Application\browser.exe"
Dim coccocPath3 : coccocPath3 = "C:\Program Files (x86)\CocCoc\Browser\Application\browser.exe"

If fso.FileExists(coccocPath1) Then
    oShell.Run """" & coccocPath1 & """ http://localhost:3000", 1, False
ElseIf fso.FileExists(coccocPath2) Then
    oShell.Run """" & coccocPath2 & """ http://localhost:3000", 1, False
ElseIf fso.FileExists(coccocPath3) Then
    oShell.Run """" & coccocPath3 & """ http://localhost:3000", 1, False
Else
    oShell.Run "explorer.exe http://localhost:3000", 1, False
End If

' ==========================================
' XOA FILE KHOA KHI XONG
' ==========================================
If fso.FileExists(lockFile) Then fso.DeleteFile lockFile
