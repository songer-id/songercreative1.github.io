@echo off
title Server Preview Mobile - POS Songer Creative
cls
echo ======================================================================
echo       SERVER PREVIEW MOBILE / PERANGKAT LAIN - POS SONGER CREATIVE
echo ======================================================================
echo.
echo Sedang menyiapkan server lokal...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
