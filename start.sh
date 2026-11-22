#!/usr/bin/env bash
# Swasti 🌸 AI — 1-Click Launch Script
# Created & Developed by Bikash Talukder

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

mkdir -p logs models

echo "=========================================================="
echo "    Swasti 🌸 — Offline AI Voice & Chat Companion          "
echo "            Created by Bikash Talukder                    "
echo "=========================================================="

# 1. Stop any previously running instance to ensure clean ports
if [ -f "./stop.sh" ]; then
  ./stop.sh > /dev/null 2>&1 || true
fi

# 2. Check Python Virtual Environment
if [ ! -d ".venv" ]; then
  echo "Setting up Python virtual environment..."
  python3 -m venv --system-site-packages .venv
  .venv/bin/pip install --upgrade pip
  .venv/bin/pip install -r requirements.txt
fi

# 3. Check Kokoro Model Weights
if [ ! -f "models/kokoro-v1.0.onnx" ] || [ ! -f "models/voices-v1.0.bin" ]; then
  echo "Downloading Kokoro ONNX voice models..."
  python3 download_models.py
fi

# 4. Check Node dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing web UI dependencies..."
  npm install
fi

# 5. Check & start Ollama daemon if not currently running
if ! curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
  if command -v ollama > /dev/null 2>&1; then
    echo "Starting Ollama daemon with full CORS (OLLAMA_ORIGINS=*)..."
    OLLAMA_ORIGINS="*" ollama serve > logs/ollama.log 2>&1 &
    OLLAMA_PID=$!
    echo "$OLLAMA_PID" >> .swasti.pid
    sleep 2
  fi
fi

# 6. Start Backend Voice Server
echo "Starting Voice Server (STT port 5005, TTS port 5006)..."
.venv/bin/python voice_server.py > logs/voice.log 2>&1 &
VOICE_PID=$!

# 7. Start Frontend Web Server
echo "Starting Web UI (port 5173)..."
npx vite --host > logs/web.log 2>&1 &
WEB_PID=$!

# Save PIDs for stop command
echo "$VOICE_PID" > .swasti.pid
echo "$WEB_PID" >> .swasti.pid

# 8. Wait for services to become ready
echo -n "Waiting for services to initialize"
for i in {1..20}; do
  if curl -s http://localhost:5005/health > /dev/null 2>&1 && curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo " Ready!"
    break
  fi
  echo -n "."
  sleep 1
done

echo ""
echo "=========================================================="
echo "  🎉 Swasti 🌸 is LIVE and running offline!"
echo "=========================================================="
echo "  🌐 Web App:      http://localhost:5173"
echo "  🎙️ Voice Server: http://localhost:5005 & http://localhost:5006"
echo "  📑 Logs:         logs/web.log & logs/voice.log"
echo "----------------------------------------------------------"
echo "  🛑 To stop Swasti 🌸 anytime, run:"
echo "     ./stop.sh"
echo "=========================================================="
echo ""

# Optional: if foreground mode requested with -f or --foreground, tail logs
if [ "$1" = "-f" ] || [ "$1" = "--foreground" ]; then
  echo "Streaming logs (press Ctrl+C to stop Swasti 🌸)..."
  cleanup() {
    ./stop.sh
    exit 0
  }
  trap cleanup SIGINT SIGTERM
  tail -f logs/voice.log logs/web.log
fi
