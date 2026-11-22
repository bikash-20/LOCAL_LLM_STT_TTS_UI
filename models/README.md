# Swasti Voice Models

This directory stores the offline weights for **Kokoro-82M ONNX** (ultra-realistic human text-to-speech) and cached whisper assets.

### Auto-Download
Run the downloader script from the repository root:
```bash
python download_models.py
```
Or start the server via:
```bash
./start.sh
```

### Files required:
- `kokoro-v1.0.onnx` (~310 MB) — Kokoro 82M parameter ONNX neural voice model
- `voices-v1.0.bin` (~27 MB) — Pre-trained voice profile vectors (14+ distinct male & female voices)

*Note: Large model binaries (`*.onnx`, `*.bin`) are excluded from Git to keep the repository lightweight.*
