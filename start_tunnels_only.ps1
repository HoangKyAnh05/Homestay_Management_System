$rootDir = $PSScriptRoot
$cloudflaredExe = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$logFileWeb = Join-Path $rootDir "cloudflare_tunnel.log"
$logFileRemotion = Join-Path $rootDir "cloudflare_remotion.log"

Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

if (Test-Path $logFileWeb) { Remove-Item $logFileWeb -Force -ErrorAction SilentlyContinue }
if (Test-Path $logFileRemotion) { Remove-Item $logFileRemotion -Force -ErrorAction SilentlyContinue }

$cfArgsWeb = "/c `"`"$cloudflaredExe`" tunnel --url http://localhost:5173 --logfile `"$logFileWeb`"`""
Start-Process -FilePath "cmd.exe" -ArgumentList $cfArgsWeb -WorkingDirectory $rootDir -WindowStyle Hidden

$cfArgsRemotion = "/c `"`"$cloudflaredExe`" tunnel --url http://localhost:3000 --logfile `"$logFileRemotion`"`""
Start-Process -FilePath "cmd.exe" -ArgumentList $cfArgsRemotion -WorkingDirectory $rootDir -WindowStyle Hidden

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
    Write-Output "TUNNEL_READY"
    Write-Output "WEB: $urlWeb"
    Write-Output "REMOTION: $urlRemotion"
} else {
    Write-Output "TUNNEL_FAILED"
}
