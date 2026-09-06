@echo off
title Khoi dong he thong Homestay (Chay ngam 1-Click)
chcp 65001 >nul
cd /d "%~dp0"
cls
echo ======================================================================
echo   DANG KHOI DONG TOAN BO HE THONG HOMESTAY (CHAY NGAM HOAN TOAN)...
echo   Cua so nay se tu dong dong ngay sau do, terminal se tu an het!
echo   Web se tu dong mo len trinh duyet voi bang thong vo han Cloudflare.
echo ======================================================================
start wscript.exe "%~dp0run_all_hidden.vbs"
ping 127.0.0.1 -n 3 >nul
exit
