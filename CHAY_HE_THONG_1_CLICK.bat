@echo off
title Khoi dong he thong Homestay (Chay ngam)
chcp 65001 >nul
cd /d "%~dp0"
echo ======================================================================
echo   DANG KHOI DONG TOAN BO HE THONG HOMESTAY (CHAY NGAM HOAN TOAN)...
echo   Cua so nay se tu dong dong sau 2 giay, terminal se tu an het!
echo   Web se tu dong mo tai: https://reminder-strife-awoke.ngrok-free.dev
echo ======================================================================
start wscript.exe "%~dp0run_all_hidden.vbs"
timeout /t 2 /nobreak >nul
exit
