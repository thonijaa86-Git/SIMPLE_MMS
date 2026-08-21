@echo off
title SIMPLE MMS - Maintenance Management System
setlocal enabledelayedexpansion

:: Pastikan bekerja di direktori tempat script ini berada
cd /d "%~dp0"

set PORT=8000
set URL=http://localhost:%PORT%

echo ========================================================
echo   SIMPLE MMS - Maintenance Management System
echo ========================================================
echo.
echo Memeriksa server lokal...

:: Cek Python
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Menggunakan Python HTTP Server di port %PORT%...
    start "" "%URL%"
    echo Server aktif di %URL%
    echo Tekan Ctrl+C di terminal ini untuk mematikan server.
    echo --------------------------------------------------------
    python -m http.server %PORT%
    goto end
)

:: Cek py launcher
where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Menggunakan Python (py) HTTP Server di port %PORT%...
    start "" "%URL%"
    echo Server aktif di %URL%
    echo Tekan Ctrl+C di terminal ini untuk mematikan server.
    echo --------------------------------------------------------
    py -m http.server %PORT%
    goto end
)

:: Cek Node / NPX
where npx >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Menggunakan Node.js / NPX serve di port %PORT%...
    start "" "%URL%"
    echo Server aktif di %URL%
    echo Tekan Ctrl+C di terminal ini untuk mematikan server.
    echo --------------------------------------------------------
    npx --yes serve -l %PORT% .
    goto end
)

:: Fallback PowerShell Web Server sederhana jika tidak ada Python & Node
echo [INFO] Python atau Node.js tidak ditemukan, menjalankan via PowerShell...
start "" "%URL%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:8000/'); $listener.Start(); Write-Host 'Server aktif di http://localhost:8000 (PowerShell fallback)'; while($listener.IsListening){ $context = $listener.GetContext(); $req = $context.Request; $res = $context.Response; $urlPath = $req.Url.LocalPath.TrimStart('/'); if([string]::IsNullOrEmpty($urlPath)){$urlPath='index.html'}; $file = Join-Path (Get-Location) $urlPath; if(Test-Path $file -PathType Leaf){ $bytes = [System.IO.File]::ReadAllBytes($file); $ext = [System.IO.Path]::GetExtension($file); $mime = switch($ext){ '.html'{'text/html'} '.css'{'text/css'} '.js'{'application/javascript'} '.json'{'application/json'} '.png'{'image/png'} '.jpg'{'image/jpeg'} '.svg'{'image/svg+xml'} default{'application/octet-stream'} }; $res.ContentType = $mime; $res.ContentLength64 = $bytes.Length; $res.OutputStream.Write($bytes, 0, $bytes.Length) } else { $res.StatusCode = 404 }; $res.OutputStream.Close() }"

:end
pause
