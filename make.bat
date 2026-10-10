@echo off
REM Simple make-like commands for Windows

if "%1"=="setup" goto setup
if "%1"=="install" goto install
if "%1"=="run" goto run
if "%1"=="run-demo" goto run_demo
if "%1"=="run-backend" goto run_backend
if "%1"=="docker-up" goto docker_up
if "%1"=="docker-down" goto docker_down
if "%1"=="clean" goto clean
if "%1"=="help" goto help

echo Usage: make [command]
echo.
echo Commands:
echo   setup      - Initial project setup
echo   install    - Install dependencies
echo   run        - Run the application
echo   run-demo   - Run in demo mode
echo   run-backend- Run backend only
echo   docker-up  - Start with Docker
echo   docker-down- Stop Docker containers
echo   clean      - Clean node_modules and caches
echo   help       - Show this help
goto end

:setup
call setup.bat
goto end

:install
echo Installing dependencies...
cd backend && call npm install && cd ..
cd frontend && call npm install && cd ..
echo ✅ Dependencies installed
goto end

:run
call run.bat
goto end

:run_demo
call run-demo.bat
goto end

:run_backend
call run-backend.bat
goto end

:docker_up
docker-compose up --build
goto end

:docker_down
docker-compose down
goto end

:clean
echo Cleaning project...
if exist backend\node_modules rmdir /s /q backend\node_modules
if exist frontend\node_modules rmdir /s /q frontend\node_modules
if exist backend\package-lock.json del backend\package-lock.json
if exist frontend\package-lock.json del frontend\package-lock.json
echo ✅ Project cleaned
goto end

:help
echo Budget Mate - Development Commands
echo ===================================
echo.
echo Quick start:
echo   make setup     - First time setup
echo   make run-demo  - Run in demo mode
echo.
echo Development:
echo   make install   - Install dependencies
echo   make run       - Run full application
echo   make run-backend - Run backend only
echo.
echo Docker:
echo   make docker-up   - Start with Docker
echo   make docker-down - Stop Docker
echo.
echo Maintenance:
echo   make clean     - Clean dependencies
echo   make help      - Show this help
goto end

:end