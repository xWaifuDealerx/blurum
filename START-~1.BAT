@echo off
REM ===== BlueRoom local server (double-click to run) =====
cd /d "%~dp0"
echo.
echo   BlueRoom is starting at  http://localhost:8000/index.html
echo   Keep this window open while you use the app. Close it to stop.
echo.
start "" "http://localhost:8000/index.html"
where python  >nul 2>nul && ( python  -m http.server 8000 & goto :eof )
where py      >nul 2>nul && ( py      -m http.server 8000 & goto :eof )
where node    >nul 2>nul && ( npx --yes serve -l 8000 . & goto :eof )
echo Could not find Python or Node. Install Python from python.org, then double-click this again.
pause
