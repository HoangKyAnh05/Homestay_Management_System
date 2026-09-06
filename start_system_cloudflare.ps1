$rootDir = $PSScriptRoot

# 1. Don dep tat ca tien trinh cu
Get-Process cloudflared, ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 8080, 5173, 3000 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1

# 2. Khoi dong Remotion Video Studio (:3000)
$remotionDir = Join-Path $rootDir "tool_remotion"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"cd /d `"$remotionDir`" && node server.mjs`"" -WorkingDirectory $rootDir -WindowStyle Hidden

# 3. Khoi dong Backend Spring Boot (:8080)
$backendDir = Join-Path $rootDir "homestayManagement"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"set JAVA_HOME=D:\jdk&& cd /d `"$backendDir`" && mvnw.cmd spring-boot:run`"" -WorkingDirectory $rootDir -WindowStyle Hidden

# 4. Khoi dong Frontend Vite (:5173)
$frontendDir = Join-Path $rootDir "frontendHomestayManagement"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"cd /d `"$frontendDir`" && npm run dev`"" -WorkingDirectory $rootDir -WindowStyle Hidden

# 5. Cho ca Frontend (:5173) va Backend (:8080) san sang
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    $conn5173 = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 5173 }
    $conn8080 = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 8080 }
    if ($conn5173 -and $conn8080) { break }
}

# 6. Khoi dong Cloudflare Tunnel cho Web Frontend (:5173)
$logFileWeb = Join-Path $rootDir "cloudflare_tunnel.log"
if (Test-Path $logFileWeb) { Remove-Item $logFileWeb -Force -ErrorAction SilentlyContinue }

$cloudflaredExe = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$cfArgsWeb = "/c `"`"$cloudflaredExe`" tunnel --url http://localhost:5173 --logfile `"$logFileWeb`"`""
Start-Process -FilePath "cmd.exe" -ArgumentList $cfArgsWeb -WorkingDirectory $rootDir -WindowStyle Hidden

# 7. Khoi dong Cloudflare Tunnel rieng cho Remotion Studio (:3000)
$logFileRemotion = Join-Path $rootDir "cloudflare_remotion.log"
if (Test-Path $logFileRemotion) { Remove-Item $logFileRemotion -Force -ErrorAction SilentlyContinue }

$cfArgsRemotion = "/c `"`"$cloudflaredExe`" tunnel --url http://localhost:3000 --logfile `"$logFileRemotion`"`""
Start-Process -FilePath "cmd.exe" -ArgumentList $cfArgsRemotion -WorkingDirectory $rootDir -WindowStyle Hidden

# 8. Trich xuat link deploy Cloudflare
$urlWeb = $null
$urlRemotion = $null

for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 500
    if (-not $urlWeb -and (Test-Path $logFileWeb)) {
        $match = Get-Content $logFileWeb -ErrorAction SilentlyContinue | Select-String -Pattern '(https://[a-zA-Z0-9-]+\.trycloudflare\.com)'
        if ($match) { $urlWeb = $match[0].Matches[0].Value }
    }
    if (-not $urlRemotion -and (Test-Path $logFileRemotion)) {
        $match = Get-Content $logFileRemotion -ErrorAction SilentlyContinue | Select-String -Pattern '(https://[a-zA-Z0-9-]+\.trycloudflare\.com)'
        if ($match) { $urlRemotion = $match[0].Matches[0].Value }
    }
    if ($urlWeb -and $urlRemotion) { break }
}

if ($urlWeb) {
    Start-Sleep -Seconds 1
    $linkFile = Join-Path $rootDir "LINK_DEPLOY_HIEN_TAI.txt"
    $info = @"
======================================================================
     HE THONG HOMESTAY DA KHOI DONG THANH CONG (CLOUDFLARE TUNNEL)
======================================================================

 [1] LINK WEB HOMESTAY (Frontend + Backend API - VO HAN BANG THONG):
     $urlWeb

 [2] LINK REMOTION VIDEO STUDIO (Truc tiep):
     $urlRemotion

 [3] LINK REMOTION TREN WEB HOMESTAY:
     $urlWeb/remotion-app/

 * Uu diem: Dung luong vo han, xem video render thoai mai khong bi chan.
 * Moi may tinh, dien thoai deu co the truy cap duoc.
 * De tat he thong: Nhan dup vao file TAT_HE_THONG.bat
======================================================================
"@
    $info | Out-File -FilePath $linkFile -Encoding utf8
    Start-Process $urlWeb
}
