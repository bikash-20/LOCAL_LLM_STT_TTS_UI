#!/usr/bin/env bash
# Swasti AI — Service Stop Script
# Created by Bikash Talukder

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "    Stopping Swasti AI Services...                        "
echo "=========================================================="

STOPPED=0

# 1. Terminate recorded PIDs
if [ -f ".swasti.pid" ]; then
  while IFS= read -r pid; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      STOPPED=1
    fi
  done < ".swasti.pid"
  rm -f ".swasti.pid"
fi

# 2. Free ports 5005, 5006, 5173 if still bound
for port in 5005 5006 5173; do
  pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    for p in $pids; do
      kill "$p" 2>/dev/null || true
      STOPPED=1
    done
  fi
done

sleep 1

# 3. Ensure clean termination
for port in 5005 5006 5173; do
  pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    for p in $pids; do
      kill -9 "$p" 2>/dev/null || true
      STOPPED=1
    done
  fi
done

if [ "$STOPPED" -eq 1 ]; then
  echo "✓ Voice Server stopped (ports 5005, 5006)"
  echo "✓ Web UI stopped (port 5173)"
  echo " Swasti services stopped successfully."
else
  echo " No active Swasti services were running."
fi
