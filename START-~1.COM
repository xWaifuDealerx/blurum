#!/bin/bash
# ===== BlueRoom local server (double-click on Mac, or run in terminal) =====
cd "$(dirname "$0")"
URL="http://localhost:8000/index.html"
echo ""
echo "  BlueRoom starting at $URL"
echo "  Keep this window open while you use the app. Press Ctrl+C to stop."
echo ""
( sleep 1; open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null ) &
if command -v python3 >/dev/null 2>&1; then python3 -m http.server 8000
elif command -v python >/dev/null 2>&1; then python -m http.server 8000
elif command -v npx >/dev/null 2>&1; then npx --yes serve -l 8000 .
else echo "Install Python (python.org) or Node, then run this again."; read -n 1; fi
