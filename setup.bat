@echo off
echo ========================================
echo    Budget Mate - Setup Script
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js is installed
echo.

REM Check if PostgreSQL is installed (optional for demo mode)
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL is not installed
    echo You can still run in DEMO mode without database
    echo.
) else (
    echo ✅ PostgreSQL is installed
    echo.
)

echo 🔧 Setting up Backend...
cd backend

REM Install backend dependencies
echo Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)

REM Copy environment file
if not exist .env (
    echo Copying environment template...
    copy env.example .env
    echo.
    echo ⚠️  Please edit .env file with your database credentials
    echo You can run in DEMO mode without database setup
)

cd ..

echo.
echo 🔧 Setting up Frontend...
cd frontend

REM Install frontend dependencies
echo Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo ✅ Setup completed successfully!
echo ========================================
echo.
echo 🚀 To start the application:
echo.
echo Option 1 - DEMO Mode (No database required):
echo   run.bat
echo.
echo Option 2 - Full Mode (Requires PostgreSQL):
echo   1. Setup PostgreSQL database
echo   2. Edit backend/.env with your database credentials
echo   3. Run: run-backend.bat
echo   4. Run: run.bat
echo.
echo 📚 For detailed instructions, see README.md
echo.
pause