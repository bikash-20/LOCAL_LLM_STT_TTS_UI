#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "    Swasti — Offline AI Voice & Chat Companion            "
echo "            Created by Bikash Talukder                    "
echo "=========================================================="

# Check virtualenv
if [ ! -d ".venv" ]; then
  echo "Setting up Python virtual environment..."
  python3 -m venv --system-site-packages .venv
  .venv/bin/pip install -r requirements.txt
fi

# Verify Kokoro models
if [ ! -f "models/kokoro-v1.0.onnx" ] || [ ! -f "models/voices-v1.0.bin" ]; then
  echo "Downloading Kokoro ONNX model weights..."
  mkdir -p models
  curl -L -o models/voices-v1.0.bin "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"
  curl -L -o models/kokoro-v1.0.onnx "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
fi

# Trap to kill background processes on exit
cleanup() {
  echo ""
  echo "Stopping services..."
  if [ -n "$VOICE_PID" ]; then
    kill "$VOICE_PID" 2>/dev/null || true
  fi
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start Voice Server
echo "Starting offline Voice Server (STT port 5005, TTS port 5006)..."
.venv/bin/python voice_server.py &
VOICE_PID=$!

sleep 3

# Start Web Server
echo "Starting Web UI on http://localhost:5173..."
npm run dev -- --host
