import { useState, useRef, useCallback } from 'react';
import { VoiceConfig } from '../types';

export function useTextToSpeech(config: VoiceConfig) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [speakingVolume, setSpeakingVolume] = useState(0);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsPlaying(false);
    setIsSynthesizing(false);
    setSpeakingVolume(0);
    setActiveMessageId(null);
  }, []);

  const speak = useCallback(async (text: string, messageId?: string, overrideVoice?: string): Promise<void> => {
    stop();

    if (!text || !text.trim()) return;

    // Filter out markdown code blocks, raw math, and emojis for natural human speech
    const cleanSpeechText = text
      .replace(/```[\s\S]*?```/g, ' [Code omitted] ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\$\$[\s\S]*?\$\$/g, ' [Equation] ')
      .replace(/\$([^$]+)\$/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*#_~>]/g, '')
      // Strip all Unicode emojis, pictographs, variation selectors, zero-width chars
      .replace(/\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D|\u200B/gu, '')
      // Clean up whitespace around punctuation
      .replace(/\s+([.,!?;:])/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanSpeechText) return;

    setActiveMessageId(messageId || null);
    setIsSynthesizing(true);

    const targetEndpoint = config.ttsEndpoint || 'http://localhost:5006/speak';

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanSpeechText,
          voice: overrideVoice || config.voiceId || 'af_heart',
          speed: config.speed || 1.0
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`TTS server returned status ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      setIsSynthesizing(false);
      setIsPlaying(true);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up volume analyzer for speech animation
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const updateSpeechVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const norm = Math.min(1, (sum / bufferLength) / 100);
          setSpeakingVolume(norm);
          animFrameRef.current = requestAnimationFrame(updateSpeechVolume);
        };
        updateSpeechVolume();
      } catch (err) {
        console.warn('AudioContext media element analyzer not available:', err);
      }

      audio.onended = () => {
        stop();
      };

      audio.onerror = () => {
        stop();
      };

      await audio.play();
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      console.warn('Kokoro TTS failed, falling back to Web Speech API:', err);
      setIsSynthesizing(false);

      // Web Speech API fallback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
        utterance.rate = config.speed || 1.0;
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => stop();
        utterance.onerror = () => stop();
        window.speechSynthesis.speak(utterance);
      } else {
        stop();
      }
    }
  }, [config.ttsEndpoint, config.voiceId, config.speed, stop]);

  return {
    isPlaying,
    isSynthesizing,
    speakingVolume,
    activeMessageId,
    speak,
    stop
  };
}
