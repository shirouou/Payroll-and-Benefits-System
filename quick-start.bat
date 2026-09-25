@echo off
REM Quick Start Script for Payroll & Benefits System

echo.
echo ========================================
echo Oxford Suites Makati - Payroll & Benefits System
echo Quick Start Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js is installed: 
node --version

echo.
echo ========================================
echo Setting up BACKEND...
echo ========================================
cd backend

if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
) else (
    echo Backend dependencies already installed.
)

if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo IMPORTANT: Update .env with your MongoDB connection string!
)

cd ..

echo.
echo ========================================
echo Setting up FRONTEND...
echo ========================================
cd frontend

if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
) else (
    echo Frontend dependencies already installed.
)

if not exist .env.local (
    echo Creating .env.local file from template...
    copy .env.example .env.local
)

cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the application:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   npm start
echo.
echo Terminal 2 - Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause
