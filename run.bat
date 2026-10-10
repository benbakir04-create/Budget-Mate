@echo off
echo Starting Budget Mate...
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
    echo.
)

echo Starting development server...
start "" cmd /k "npm run start"
