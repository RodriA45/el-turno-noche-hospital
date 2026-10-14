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
if errorlevel 1 goto no_node
echo       Node.js detectado correctamente.
echo.

echo [2/3] Verificando dependencias...
if exist "node_modules" goto deps_ok
echo       Instalando dependencias necesarias por primera vez...
call npm install
if errorlevel 1 goto err_install
:deps_ok
echo       Dependencias listas.
echo.

echo [3/3] Iniciando el servidor y abriendo el navegador...
echo.
echo -------------------------------------------------------------------
echo   El juego se abrira en: http://127.0.0.1:5173/
echo   Manten esta ventana abierta mientras juegues.
echo   Para cerrar el juego, presiona Ctrl + C o cierra esta ventana.
echo -------------------------------------------------------------------
echo.

call npm run dev -- --open --host 127.0.0.1 --port 5173
goto fin

:no_node
echo.
echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
echo Por favor descarga e instala Node.js desde: https://nodejs.org/
echo Luego de instalarlo, vuelve a ejecutar este archivo.
echo.
pause
exit /b 1

:err_install
echo.
echo [ERROR] Ocurrio un fallo al instalar las dependencias con npm.
pause
exit /b 1

:fin
pause