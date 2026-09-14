$rootDir = $PSScriptRoot
$cloudflaredExe = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$logFileWeb = Join-Path $rootDir "cloudflare_tunnel.log"

Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

if (Test-Path $logFileWeb) { Remove-Item $logFileWeb -Force -ErrorAction SilentlyContinue }

$cfArgsWeb = "/c `"`"$cloudflaredExe`" tunnel --url http://localhost:5173 --logfile `"$logFileWeb`"`""
Start-Process -FilePath "cmd.exe" -ArgumentList $cfArgsWeb -WorkingDirectory $rootDir -WindowStyle Hidden

$urlWeb = $null

for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 500
    if (-not $urlWeb -and (Test-Path $logFileWeb)) {
        $match = Get-Content $logFileWeb -ErrorAction SilentlyContinue | Select-String -Pattern '(https://[a-zA-Z0-9-]+\.trycloudflare\.com)'
        if ($match) { $urlWeb = $match[0].Matches[0].Value }
    }
    if ($urlWeb) { break }
}

if ($urlWeb) {
    $linkFile = Join-Path $rootDir "LINK_DEPLOY_HIEN_TAI.txt"
    $info = @"
======================================================================
     HE THONG HOMESTAY DA KHOI DONG THANH CONG (CLOUDFLARE TUNNEL)
======================================================================

 [1] LINK WEB HOMESTAY (Frontend + Backend API - VO HAN BANG THONG):
     $urlWeb

 * Uu diem: Dung luong vo han, xem video render thoai mai khong bi chan.
 * Moi may tinh, dien thoai deu co the truy cap duoc.
 * De tat he thong: Nhan dup vao file TAT_HE_THONG.bat
======================================================================
"@
    $info | Out-File -FilePath $linkFile -Encoding utf8
    Write-Output "TUNNEL_READY"
    Write-Output "WEB: $urlWeb"
} else {
    Write-Output "TUNNEL_FAILED"
}
