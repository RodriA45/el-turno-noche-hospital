@echo off
title El Turno Noche: Hospital San Anselmo
cls

echo ===================================================================
echo             EL TURNO NOCHE: HOSPITAL SAN ANSELMO (3D)
echo             Videojuego de Terror Psicologico Episodico
echo ===================================================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando instalacion de Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    echo Por favor descarga e instala Node.js desde: https://nodejs.org/
    echo Luego de instalarlo, vuelve a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)
echo       Node.js detectado correctamente.
echo.

echo [2/3] Verificando e instalando dependencias del proyecto...
if not exist "node_modules" (
    echo       Instalando paquetes por primera vez (Three.js, Vite)...
    call npm install
) else (
    echo       Dependencias ya presentes. Comprobando actualizaciones...
    call npm install --prefer-offline --no-audit
)

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Ocurrio un fallo al instalar las dependencias.
    pause
    exit /b 1
)
echo       Dependencias listas.
echo.

echo [3/3] Iniciando el servidor y abriendo el navegador automaticamente...
echo.
echo -------------------------------------------------------------------
echo   El juego se abrira en tu navegador en: http://127.0.0.1:5173/
echo   (Manten esta ventana abierta mientras estes jugando)
echo   (Para cerrar el servidor, presiona Ctrl + C o cierra esta ventana)
echo -------------------------------------------------------------------
echo.

call npm run dev -- --open --host 127.0.0.1 --port 5173

pause