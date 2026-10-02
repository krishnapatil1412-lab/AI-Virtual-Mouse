@echo off
title AI Virtual Mouse Engine
echo ========================================
echo   AI Virtual Mouse - Local AI Engine
echo ========================================
echo.
echo Connecting to Render backend...
echo.

cd /d "%~dp0"
call myenv\Scripts\activate.bat

set BACKEND_URL=https://ai-virtual-mouse-main.onrender.com
cd ai-engine
python main.py

echo.
echo AI Engine stopped. Press any key to close.
pause
