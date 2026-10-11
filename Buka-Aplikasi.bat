@echo off
title POS By Songer Creative - Percetakan Terpadu
cls
echo ======================================================================
echo           POS BY SONGER CREATIVE - PERCETAKAN TERPADU
echo ======================================================================
echo.
echo  Pilih Antarmuka yang Ingin Anda Buka:
echo.
echo   [1] Buka Toko Online Pembeli (index.html)
echo   [2] Buka Admin Panel & Kasir POS (admin.html)
echo   [3] Buka Server Preview HP / Perangkat Lain (Satu Wi-Fi)
echo   [4] Keluar
echo.
echo ======================================================================
set /p choice="Masukkan nomor pilihan [1/2/3/4]: "

if "%choice%"=="1" (
    echo Membuka Toko Online Pembeli...
    start "" "%~dp0index.html"
    exit
)
if "%choice%"=="2" (
    echo Membuka Admin Panel & Kasir POS...
    start "" "%~dp0admin.html"
    exit
)
if "%choice%"=="3" (
    echo Memulai Server Preview HP...
    call "%~dp0Buka-Preview-HP.bat"
    exit
)
if "%choice%"=="4" (
    exit
)

echo Pilihan tidak valid.
pause
