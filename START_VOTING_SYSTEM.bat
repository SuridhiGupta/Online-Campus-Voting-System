@echo off
SETLOCAL EnableDelayedExpansion
title DYP-SST Campus Voting System - Smart Launcher

echo ===================================================
echo    DYP-SST CAMPUS VOTING SYSTEM - INITIALIZING
echo ===================================================
echo.

:: 1. CHECK NODE.JS
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed on this PC.
    echo Please download and install it from nodejs.org
    echo.
    pause
    exit
)
echo [OK] Node.js is ready.

:: 2. CHECK BACKEND LIBRARIES
if not exist "backend\node_modules\" (
    echo [SETUP] Installing Backend libraries. First time setup.
    cd backend
    call npm install
    cd ..
    echo [OK] Backend ready.
) else (
    echo [OK] Backend libraries found.
)

:: 3. CHECK FRONTEND LIBRARIES
if not exist "frontend\node_modules\" (
    echo [SETUP] Installing Frontend libraries. First time setup.
    cd frontend
    call npm install
    cd ..
    echo [OK] Frontend ready.
) else (
    echo [OK] Frontend libraries found.
)

:: 4. START SERVICES
echo.
echo ===================================================
echo    LAUNCHING SYSTEM - PLEASE WAIT
echo ===================================================
echo.

:: Start Backend
start "VOTING_BACKEND" cmd /k "cd backend && npm start"

:: Start Frontend
start "VOTING_FRONTEND" cmd /k "cd frontend && npm run dev"

echo.
echo [SYSTEM ONLINE]
echo ---------------------------------------------------
echo ADMIN ACCESS:   http://localhost:3000
echo.
echo Keep the other two black windows open
echo You can close THIS launcher window now
echo ---------------------------------------------------
echo.
pause
