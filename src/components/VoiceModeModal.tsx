import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceConfig, OllamaConfig, Message } from '../types';
import { VoiceOrb } from './VoiceOrb';
import { Mic, MicOff, X, Volume2, Square, Sparkles } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useOllama } from '../hooks/useOllama';

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceConfig: VoiceConfig;
  ollamaConfig: OllamaConfig;
  messages: Message[];
  onAddUserMessage: (text: string) => void;
  onAddAssistantMessage: (text: string) => void;
}

export const VoiceModeModal: React.FC<VoiceModeModalProps> = ({
  isOpen,
  onClose,
  voiceConfig,
  ollamaConfig,
  messages,
  onAddUserMessage,
  onAddAssistantMessage
}) => {
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [subtitle, setSubtitle] = useState('');
  const [activeSpeakerText, setActiveSpeakerText] = useState('');

  const stt = useSpeechToText(voiceConfig);
  const tts = useTextToSpeech(voiceConfig);
  const ollama = useOllama(ollamaConfig);

  const isListeningRef = useRef(false);

  // Sync state
  useEffect(() => {
    if (stt.isRecording) {
      setVoiceState('listening');
    } else if (ollama.isGenerating) {
      setVoiceState('thinking');
    } else if (tts.isPlaying || tts.isSynthesizing) {
      setVoiceState('speaking');
    } else {
      setVoiceState('idle');
    }
  }, [stt.isRecording, ollama.isGenerating, tts.isPlaying, tts.isSynthesizing]);

  // Voice activity detection: user volume above threshold can interrupt AI
  useEffect(() => {
    if (voiceConfig.enableInterruption && tts.isPlaying && stt.volume > 0.35) {
      tts.stop();
      setVoiceState('idle');
    }
  }, [stt.volume, tts, voiceConfig.enableInterruption]);

  const handleStartListening = useCallback(async () => {
    tts.stop();
    setSubtitle('Listening to you...');
    setActiveSpeakerText('');
    isListeningRef.current = true;
    await stt.startRecording();
  }, [stt, tts]);

  const handleStopListeningAndSend = useCallback(async () => {
    isListeningRef.current = false;
    setVoiceState('thinking');
    setSubtitle('Transcribing speech...');
    
    const transcribedText = await stt.stopRecording();
    if (!transcribedText || !transcribedText.trim()) {
      setSubtitle('No speech detected. Tap microphone to speak to Swasti 🌸.');
      setVoiceState('idle');
      return;
    }

    setSubtitle(`"${transcribedText}"`);
    onAddUserMessage(transcribedText);

    // Call Ollama to generate voice response
    try {
      const historyContext: Message[] = [
        ...messages,
        {
          id: 'user-' + Date.now(),
          role: 'user',
          content: transcribedText,
          timestamp: Date.now()
        }
      ];

      setSubtitle('Swasti 🌸 is thinking...');
      let fullResponse = '';
      await ollama.generateStreamingResponse(historyContext, undefined, (chunk) => {
        fullResponse += chunk;
        setActiveSpeakerText(fullResponse);
      });

      if (fullResponse.trim()) {
        onAddAssistantMessage(fullResponse);
        setSubtitle('Swasti 🌸 Speaking...');
        await tts.speak(fullResponse);
      }
    } catch (err) {
      console.error('Voice conversation error:', err);
      setSubtitle(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setVoiceState('idle');
    }
  }, [stt, ollama, tts, messages, onAddUserMessage, onAddAssistantMessage]);

  const toggleMic = () => {
    if (stt.isRecording) {
      handleStopListeningAndSend();
    } else {
      handleStartListening();
    }
  };

  const handleInterrupt = () => {
    tts.stop();
    ollama.stopGeneration();
    stt.cancelRecording();
    setVoiceState('idle');
    setSubtitle('Interrupted');
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        tts.stop();
        stt.cancelRecording();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, tts, stt, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    tts.stop();
    stt.cancelRecording();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/35 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn"
      style={{
        color: 'var(--text-primary)'
      }}
    >
      <div
        className="glass-sheet w-full max-w-3xl h-full max-h-[820px] rounded-3xl border shadow-2xl flex flex-col items-center justify-between p-5 sm:p-8 overflow-hidden"
        style={{
          backgroundColor: 'var(--modal-bg, var(--card-bg))',
          borderColor: 'var(--border-color)'
        }}
      >
        {/* Top Header */}
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md text-white flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--c1) 0%, var(--c3) 100%)'
              }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Swasti voice
                </h2>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: voiceState === 'listening' ? 'var(--c3)' : 'var(--c1)' }}
                  />
                  <span>Live</span>
                </span>
              </div>
              <p className="text-[12.5px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                100% private offline voice mode
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="h-9 w-9 rounded-xl border flex items-center justify-center transition-all hover:opacity-80 active:scale-95 flex-shrink-0"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
            title="Exit voice mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Voice Orb Visualizer */}
        <div className="flex-1 w-full flex flex-col items-center justify-center py-4 min-h-0">
          <VoiceOrb
            state={voiceState}
            userVolume={stt.volume}
            aiVolume={tts.speakingVolume}
          />

          {/* State Pill */}
          <div className="mt-4 text-center w-full max-w-xl px-2">
            <div
              className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border text-[13.5px] font-bold shadow-sm"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              {voiceState === 'listening' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: 'var(--c3)' }} />
                  <span style={{ color: 'var(--c3)' }}>Swasti is listening...</span>
                </>
              )}
              {voiceState === 'thinking' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--c1)' }} />
                  <span>Swasti is thinking...</span>
                </>
              )}
              {voiceState === 'speaking' && (
                <>
                  <Volume2 className="w-4 h-4 animate-pulse" style={{ color: 'var(--c1)' }} />
                  <span>Swasti is speaking...</span>
                </>
              )}
              {voiceState === 'idle' && (
                <>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--c1)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Ready • Tap microphone to speak</span>
                </>
              )}
            </div>

            {/* Error or Live Transcript / Response */}
            {stt.error ? (
              <p
                className="mt-3.5 max-w-lg mx-auto text-[13.5px] font-semibold px-4 py-2.5 rounded-2xl border"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--c3)',
                  color: 'var(--c3)'
                }}
              >
                {stt.error}
              </p>
            ) : (activeSpeakerText || subtitle) ? (
              <p
                className="mt-3.5 max-w-lg mx-auto text-[14.5px] px-5 py-3 rounded-2xl border shadow-sm line-clamp-3 leading-relaxed"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                {activeSpeakerText || subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="w-full max-w-md flex flex-col items-center gap-3">
          <div className="flex items-center gap-3.5">
            {(voiceState === 'speaking' || voiceState === 'thinking') && (
              <button
                onClick={handleInterrupt}
                className="h-12 px-5 rounded-full border flex items-center gap-2 text-[13.5px] font-bold transition-all shadow-sm hover:opacity-85 active:scale-95"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
                title="Interrupt playback"
              >
                <Square className="w-3.5 h-3.5 fill-current" style={{ color: 'var(--c3)' }} />
                <span>Interrupt</span>
              </button>
            )}

            <button
              onClick={toggleMic}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-xl text-white hover:scale-105 ${
                stt.isRecording ? 'animate-pulse' : ''
              }`}
              style={{
                backgroundColor: stt.isRecording ? 'var(--c3)' : 'var(--c1)'
              }}
              title={stt.isRecording ? 'Stop and send' : 'Tap to speak'}
            >
              {stt.isRecording ? (
                <MicOff className="w-7 h-7" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>
          </div>

          <p className="text-[12.5px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {stt.isRecording ? 'Tap microphone again to send' : 'Tap microphone to start talking • Esc to close'}
          </p>
        </div>
      </div>
    </div>
  );
};
