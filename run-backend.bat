@echo off
echo Starting Budget Mate Backend...
cd /d "%~dp0backend"
start "" cmd /k "npm run dev"
