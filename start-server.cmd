@echo off
rem Double-click to start the Simple Concepts API and the ngrok tunnel, each in its own window.
rem Close a window (or press Ctrl+C in it) to stop that part.
cd /d "%~dp0"

netstat -ano | findstr /r /c:":3000 .*LISTENING" >nul
if %errorlevel%==0 (
  echo The API is already running on port 3000.
) else (
  echo Starting the API...
  start "Simple Concepts API" cmd /k "cd /d ""%~dp0apps\api"" && npm run start:dev"
)

tasklist /fi "imagename eq ngrok.exe" | findstr /i "ngrok.exe" >nul
if %errorlevel%==0 (
  echo The tunnel is already running.
) else (
  echo Starting the tunnel...
  start "Simple Concepts Tunnel" cmd /k "cd /d ""%~dp0"" && npm run tunnel"
)

echo.
echo Public address: https://implode-reload-acuteness.ngrok-free.dev
echo The app works once the API window says it has started (about 20 seconds).
echo Keep both windows open while people use the app.
echo.
pause
