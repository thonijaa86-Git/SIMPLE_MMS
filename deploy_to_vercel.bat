@echo off
title Sync & Update ke Vercel (via GitHub)
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ========================================================
echo   SYNC & AUTO-DEPLOY KE VERCEL VIA GITHUB
echo ========================================================
echo.

:: Cek perubahan git
git status --short > "%TEMP%\git_changes.tmp"
set /p CHANGES=<"%TEMP%\git_changes.tmp"
del "%TEMP%\git_changes.tmp" 2>nul

if "%CHANGES%"=="" (
    echo [INFO] Tidak ada file yang berubah.
    echo Website Vercel Anda sudah sinkron dengan versi terbaru.
    echo.
    pause
    exit /b 0
)

echo Perubahan yang terdeteksi:
git status --short
echo.
echo --------------------------------------------------------
set "COMMIT_MSG="
set /p COMMIT_MSG="Masukkan catatan update (tekan Enter untuk default): "

if "!COMMIT_MSG!"=="" (
    set COMMIT_MSG=update: perbaikan dan pembaruan otomatis %date% %time%
)

echo.
echo [1/3] Menambahkan file yang diedit...
git add .

echo [2/3] Menyimpan perubahan (commit)...
git commit -m "!COMMIT_MSG!"

echo [3/3] Mengirim (push) ke GitHub...
git push origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   BERHASIL DI-PUSH KE GITHUB!
    echo   Vercel sedang otomatis meng-update website Anda.
    echo   Buka dashboard Vercel atau refresh link web Anda 
    echo   dalam 15-30 detik.
    echo ========================================================
) else (
    echo.
    echo [ERROR] Gagal mengirim ke GitHub. Periksa koneksi internet Anda.
)

echo.
pause
