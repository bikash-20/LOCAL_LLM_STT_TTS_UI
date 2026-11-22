import { useState, useRef, useCallback } from 'react';
import { AudioRecorder } from '../utils/audio';
import { VoiceConfig } from '../types';

export function useSpeechToText(config: VoiceConfig) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recorderRef = useRef<AudioRecorder | null>(null);

  const startRecording = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      recorderRef.current = new AudioRecorder();
      await recorderRef.current.start((vol) => {
        setVolume(vol);
      });
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start microphone recording:', err);
      setError('Microphone access denied or unavailable');
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    if (!recorderRef.current || !isRecording) {
      setIsRecording(false);
      return '';
    }

    setIsRecording(false);
    setIsTranscribing(true);
    setVolume(0);

    try {
      const audioBlob = await recorderRef.current.stop();
      if (!audioBlob || audioBlob.size === 0) {
        setIsTranscribing(false);
        return '';
      }

      // If STT endpoint is provided, try sending to local faster-whisper server
      if (config.sttEndpoint && config.sttEndpoint.trim()) {
        const formData = new FormData();
        const extension = audioBlob.type.includes('ogg') ? 'ogg' : audioBlob.type.includes('wav') ? 'wav' : 'webm';
        formData.append('file', audioBlob, `input.${extension}`);

        const response = await fetch(config.sttEndpoint, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`STT server returned status ${response.status}`);
        }

        const data = await response.json();
        const transcribedText = (data.text || '').trim();
        setIsTranscribing(false);
        return transcribedText;
      }

      // If no STT endpoint or fallback needed
      setIsTranscribing(false);
      return '';
    } catch (err) {
      console.warn('Local STT endpoint failed, trying browser SpeechRecognition fallback:', err);
      setError(`STT error: ${err instanceof Error ? err.message : String(err)}`);
      setIsTranscribing(false);
      return '';
    }
  }, [config.sttEndpoint, isRecording]);

  const cancelRecording = useCallback(async () => {
    if (recorderRef.current) {
      await recorderRef.current.stop();
    }
    setIsRecording(false);
    setIsTranscribing(false);
    setVolume(0);
  }, []);

  return {
    isRecording,
    isTranscribing,
    volume,
    error,
    startRecording,
    stopRecording,
    cancelRecording
  };
}
