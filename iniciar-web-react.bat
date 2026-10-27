@echo off
chcp 65001 >nul
title Datos de España - React
cd /d "%~dp0web-react"

where node >nul 2>nul
if errorlevel 1 (
  echo No encuentro Node.js. Instala la version LTS desde https://nodejs.org y vuelve a abrir este archivo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias la primera vez, tarda un minuto...
  call npm.cmd ci || call npm.cmd install --legacy-peer-deps
  if errorlevel 1 (
    echo Fallo la instalacion.
    pause
    exit /b 1
  )
)

echo.
echo Arrancando la web. Se abrira el navegador en http://localhost:5173
echo Para pararla cierra esta ventana o pulsa Ctrl+C.
echo.
call npm.cmd run dev -- --open
pause
