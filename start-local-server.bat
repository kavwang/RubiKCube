@echo off
set PORT=5500
cd /d "%~dp0"
start "Rubik 2x2" "http://127.0.0.1:%PORT%/index.html"
python -m http.server %PORT%
