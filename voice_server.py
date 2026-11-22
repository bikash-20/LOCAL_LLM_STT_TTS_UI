#!/usr/bin/env python3
"""
Swasti Local Voice Server — Offline STT & Kokoro TTS
Created & Developed by Bikash Talukder

Provides offline Speech-to-Text (faster-whisper) and ultra-realistic Text-to-Speech (Kokoro-82M ONNX).
Default ports:
  - 5005: STT (/transcribe) and unified TTS (/speak)
  - 5006: Dedicated TTS (/speak) as configured in Swasti preferences
"""

import os
import sys
import io
import time
import logging
import asyncio
from typing import Optional
from pathlib import Path
from contextlib import asynccontextmanager
import urllib.request

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SwastiVoiceServer")

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True, parents=True)

KOKORO_MODEL_PATH = MODELS_DIR / "kokoro-v1.0.onnx"
KOKORO_VOICES_PATH = MODELS_DIR / "voices-v1.0.bin"

# Global model holders
whisper_model = None
kokoro_model = None
soundfile = None

AVAILABLE_VOICES = [
    {"id": "af_heart", "name": "Swasti 🌸 Natural (Default)", "gender": "Female", "accent": "American", "desc": "Warm, ultra-natural, conversational", "recommended": True},
    {"id": "af_bella", "name": "Swasti 🌸 Expressive", "gender": "Female", "accent": "American", "desc": "Expressive, clear, friendly"},
    {"id": "af_nicole", "name": "Swasti 🌸 Nicole", "gender": "Female", "accent": "American", "desc": "Calm, intelligent, thoughtful"},
    {"id": "af_sarah", "name": "Swasti 🌸 Sarah", "gender": "Female", "accent": "American", "desc": "Casual, upbeat, modern"},
    {"id": "af_sky", "name": "Swasti 🌸 Sky", "gender": "Female", "accent": "American", "desc": "Gentle, airy, pleasant"},
    {"id": "am_adam", "name": "Swasti 🌸 Adam", "gender": "Male", "accent": "American", "desc": "Authoritative, deep, balanced", "recommended": True},
    {"id": "am_michael", "name": "Swasti 🌸 Michael", "gender": "Male", "accent": "American", "desc": "Energetic, articulate, engaging"},
    {"id": "am_eric", "name": "Swasti 🌸 Eric", "gender": "Male", "accent": "American", "desc": "Relaxed, baritone, natural"},
    {"id": "am_fenrir", "name": "Swasti 🌸 Fenrir", "gender": "Male", "accent": "American", "desc": "Deep, powerful, resonant"},
    {"id": "bf_emma", "name": "Swasti 🌸 Emma (British)", "gender": "Female", "accent": "British", "desc": "Sophisticated, warm British", "recommended": True},
    {"id": "bf_isabella", "name": "Swasti 🌸 Isabella", "gender": "Female", "accent": "British", "desc": "Crisp, elegant, refined"},
    {"id": "bf_alice", "name": "Swasti 🌸 Alice", "gender": "Female", "accent": "British", "desc": "Delicate, poised British"},
    {"id": "bm_george", "name": "Swasti 🌸 George", "gender": "Male", "accent": "British", "desc": "Distinguished, scholarly British", "recommended": True},
    {"id": "bm_fable", "name": "Swasti 🌸 Fable", "gender": "Male", "accent": "British", "desc": "Storyteller, dramatic, resonant"}
]

def download_kokoro_if_needed():
    """Ensure Kokoro ONNX model and voice tensors exist locally."""
    if not KOKORO_VOICES_PATH.exists():
        logger.info("Downloading voices-v1.0.bin (approx 27MB)...")
        urllib.request.urlretrieve(
            "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin",
            str(KOKORO_VOICES_PATH)
        )
    if not KOKORO_MODEL_PATH.exists():
        logger.info("Downloading kokoro-v1.0.onnx (approx 310MB)...")
        urllib.request.urlretrieve(
            "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx",
            str(KOKORO_MODEL_PATH)
        )

def init_whisper():
    global whisper_model
    if whisper_model is not None:
        return
    try:
        from faster_whisper import WhisperModel
        logger.info("Initializing faster-whisper (Systran base model)...")
        whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
        logger.info("Faster-whisper loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load faster-whisper: {e}")
        whisper_model = None

def init_kokoro():
    global kokoro_model, soundfile
    if kokoro_model is not None:
        return
    try:
        download_kokoro_if_needed()
        import soundfile as sf
        soundfile = sf
        import kokoro_onnx
        if KOKORO_MODEL_PATH.exists() and KOKORO_VOICES_PATH.exists():
            logger.info(f"Loading Kokoro ONNX model from {KOKORO_MODEL_PATH}...")
            kokoro_model = kokoro_onnx.Kokoro(str(KOKORO_MODEL_PATH), str(KOKORO_VOICES_PATH))
            logger.info("Kokoro ONNX loaded successfully! Ultra-realistic TTS ready.")
        else:
            logger.warning(f"Kokoro model files not found in {MODELS_DIR}.")
            kokoro_model = None
    except Exception as e:
        logger.error(f"Failed to load Kokoro: {e}")
        kokoro_model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_whisper()
    init_kokoro()
    yield

app = FastAPI(title="Local Offline Voice Server", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SpeakRequest(BaseModel):
    text: str
    voice: Optional[str] = "af_heart"
    speed: Optional[float] = 1.0
    lang: Optional[str] = "en-us"

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "stt": {
            "engine": "faster-whisper",
            "ready": whisper_model is not None,
            "model": "base"
        },
        "tts": {
            "engine": "kokoro-onnx",
            "ready": kokoro_model is not None,
            "model": "kokoro-v1.0.onnx" if kokoro_model else "not_loaded"
        },
        "piper_installed": True
    }

@app.get("/voices")
def get_voices():
    return {
        "engine": "kokoro",
        "voices": AVAILABLE_VOICES,
        "default": "af_heart"
    }

@app.post("/speak")
@app.post("/tts")
def speak(req: SpeakRequest):
    global kokoro_model, soundfile
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    if kokoro_model is None:
        init_kokoro()
        if kokoro_model is None:
            raise HTTPException(
                status_code=503,
                detail="Kokoro TTS model is not available. Check models directory."
            )

    voice_id = req.voice or "af_heart"
    valid_ids = [v["id"] for v in AVAILABLE_VOICES]
    if voice_id not in valid_ids:
        voice_id = "af_heart"

    try:
        start_t = time.time()
        # Clean markdown formatting so speech sounds conversational and natural
        clean_text = req.text.replace("```", "").replace("**", "").replace("*", "").replace("#", "").strip()
        samples, sample_rate = kokoro_model.create(
            clean_text,
            voice=voice_id,
            speed=req.speed or 1.0,
            lang=req.lang or "en-us"
        )
        
        bio = io.BytesIO()
        soundfile.write(bio, samples, sample_rate, format="WAV")
        bio.seek(0)
        dur = len(samples) / sample_rate
        elapsed = time.time() - start_t
        logger.info(f"Synthesized {len(clean_text)} chars in {elapsed:.2f}s ({dur:.2f}s audio, voice={voice_id})")
        
        return Response(content=bio.getvalue(), media_type="audio/wav")
    except Exception as e:
        logger.error(f"Speech synthesis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
@app.post("/stt")
async def transcribe(file: UploadFile = File(...)):
    global whisper_model
    if whisper_model is None:
        init_whisper()
        if whisper_model is None:
            raise HTTPException(status_code=503, detail="Whisper STT model not ready")

    try:
        start_t = time.time()
        contents = await file.read()
        temp_path = MODELS_DIR / f"temp_{int(time.time()*1000)}_{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(contents)

        segments, info = whisper_model.transcribe(
            str(temp_path),
            beam_size=5,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=400)
        )
        
        text_parts = [segment.text.strip() for segment in segments]
        transcription = " ".join(text_parts).strip()
        elapsed = time.time() - start_t

        if temp_path.exists():
            temp_path.unlink()

        logger.info(f"Transcribed in {elapsed:.2f}s [lang={info.language}, prob={info.language_probability:.2f}]: '{transcription}'")

        return {
            "text": transcription,
            "language": info.language,
            "language_probability": round(info.language_probability, 3),
            "duration": round(info.duration, 2),
            "latency": round(elapsed, 3)
        }
    except Exception as e:
        logger.error(f"Transcription error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

async def main():
    port_stt = int(os.environ.get("STT_PORT", os.environ.get("VOICE_PORT", 5005)))
    port_tts = int(os.environ.get("TTS_PORT", 5006))
    host = os.environ.get("VOICE_HOST", "0.0.0.0")

    config_5005 = uvicorn.Config(app, host=host, port=port_stt, log_level="info")
    server_5005 = uvicorn.Server(config_5005)
    
    servers = [server_5005.serve()]
    print(f" Voice Server running on http://localhost:{port_stt} (STT: /transcribe, TTS: /speak)")

    if port_tts != port_stt:
        try:
            config_5006 = uvicorn.Config(app, host=host, port=port_tts, log_level="warning")
            server_5006 = uvicorn.Server(config_5006)
            servers.append(server_5006.serve())
            print(f" Dedicated TTS endpoint running on http://localhost:{port_tts} (TTS: /speak)")
        except Exception as e:
            print(f"Note: Could not bind secondary port {port_tts}: {e}")

    await asyncio.gather(*servers)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nVoice server stopped.")
