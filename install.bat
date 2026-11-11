@echo off
cd /d %~dp0
echo Installing Voltway dependencies...
call npm install
if errorlevel 1 goto failed
call npm run install:all
if errorlevel 1 goto failed
echo.
echo Installation complete. Run start.bat to launch Voltway.
pause
exit /b 0
:failed
echo Installation failed. Check your internet connection and Node.js installation.
pause
exit /b 1
