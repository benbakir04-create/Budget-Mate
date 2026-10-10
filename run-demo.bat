@echo off
echo ========================================
echo    Budget Mate - Demo Mode
echo ========================================
echo.

REM Create .env file for frontend with demo mode
echo Setting up demo mode...
if not exist frontend\.env (
    echo VITE_DEMO_MODE=true > frontend\.env
    echo VITE_API_URL=/api >> frontend\.env
    echo VITE_APP_NAME=Budget Mate >> frontend\.env
) else (
    REM Check if demo mode is already set
    findstr /C:"VITE_DEMO_MODE=true" frontend\.env >nul
    if %errorlevel% neq 0 (
        echo VITE_DEMO_MODE=true >> frontend\.env
    )
)

echo ✅ Demo mode configured
echo.

REM Run the application
echo Starting Budget Mate in demo mode...
call run.bat