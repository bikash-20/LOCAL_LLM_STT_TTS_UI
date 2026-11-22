#!/usr/bin/env python3
"""
Model weights downloader for Swasti AI Voice Server
Downloads Kokoro-82M ONNX model (~310MB) and voice profiles (~27MB).
"""

import sys
import os
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True, parents=True)

FILES = [
    {
        "name": "voices-v1.0.bin",
        "url": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin",
        "size_mb": 27
    },
    {
        "name": "kokoro-v1.0.onnx",
        "url": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx",
        "size_mb": 310
    }
]

def reporthook(block_num, block_size, total_size):
    if total_size <= 0:
        return
    downloaded = block_num * block_size
    percent = min(100.0, (downloaded / total_size) * 100)
    downloaded_mb = downloaded / (1024 * 1024)
    total_mb = total_size / (1024 * 1024)
    sys.stdout.write(f"\r  Progress: {percent:5.1f}% [{downloaded_mb:.1f}MB / {total_mb:.1f}MB]")
    sys.stdout.flush()

def main():
    print("==========================================================")
    print("  Swasti AI — Offline Voice Model Weights Downloader     ")
    print("==========================================================")
    print(f"Target directory: {MODELS_DIR}\n")

    for item in FILES:
        target_path = MODELS_DIR / item["name"]
        if target_path.exists() and target_path.stat().st_size > 1024 * 1024:
            size_mb = target_path.stat().st_size / (1024 * 1024)
            print(f"✓ {item['name']} already exists ({size_mb:.1f}MB) — skipping.")
            continue

        print(f"Downloading {item['name']} (~{item['size_mb']}MB)...")
        try:
            urllib.request.urlretrieve(item["url"], str(target_path), reporthook=reporthook)
            print(f"\n✓ Saved {item['name']} successfully.")
        except Exception as e:
            print(f"\n❌ Error downloading {item['name']}: {e}")
            sys.exit(1)

    print("\n All voice model weights are verified and ready!")

if __name__ == "__main__":
    main()
