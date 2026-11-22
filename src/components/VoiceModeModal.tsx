import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceConfig, OllamaConfig, Message } from '../types';
import { VoiceOrb } from './VoiceOrb';
import { Mic, MicOff, X, Volume2, Square, Sparkles, Heart } from 'lucide-react';
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
      setSubtitle('No speech detected. Tap microphone to speak to Swasti.');
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

      setSubtitle('Swasti is thinking...');
      let fullResponse = '';
      await ollama.generateStreamingResponse(historyContext, undefined, (chunk) => {
        fullResponse += chunk;
        setActiveSpeakerText(fullResponse);
      });

      if (fullResponse.trim()) {
        onAddAssistantMessage(fullResponse);
        setSubtitle('Swasti Speaking...');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0E0F16]/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 sm:p-10 select-none animate-fadeIn text-[#F7F5EF]">
      {/* Top Header */}
      <div className="w-full max-w-3xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl border flex items-center justify-center shadow-md font-bold"
            style={{
              backgroundColor: 'rgba(156, 175, 136, 0.15)',
              borderColor: 'var(--c1)',
              color: 'var(--c1)'
            }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans flex items-center gap-2">
              <span>Swasti Voice Companion</span>
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] uppercase font-bold border"
                style={{
                  backgroundColor: 'rgba(156, 175, 136, 0.15)',
                  borderColor: 'var(--c1)',
                  color: 'var(--c1)'
                }}
              >
                Live Voice
              </span>
            </h2>
            <p className="text-[13px] text-[#8E90A6] mt-0.5">
              Created by <strong className="text-white">Bikash Talukder</strong> • 100% Private Offline
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            tts.stop();
            stt.cancelRecording();
            onClose();
          }}
          className="p-2.5 rounded-xl bg-[#1A1B28] text-[#A0A2B8] hover:text-[#F7F5EF] hover:bg-[#25273C] border border-[#2B2D40] transition-colors"
          title="Exit Swasti voice mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Voice Orb Visualizer */}
      <div className="flex-1 flex flex-col items-center justify-center my-6">
        <VoiceOrb
          state={voiceState}
          userVolume={stt.volume}
          aiVolume={tts.speakingVolume}
        />

        {/* State Banner */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#181926] border border-[#2C2E46] text-sm font-bold tracking-wide shadow-md">
            {voiceState === 'listening' && (
              <>
                <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: 'var(--c3)' }} />
                <span style={{ color: 'var(--c3)' }}>Swasti is listening...</span>
              </>
            )}
            {voiceState === 'thinking' && (
              <>
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--c1)' }} />
                <span style={{ color: 'var(--c1)' }}>Swasti is thinking...</span>
              </>
            )}
            {voiceState === 'speaking' && (
              <>
                <Volume2 className="w-4.5 h-4.5 animate-pulse" style={{ color: 'var(--c1)' }} />
                <span style={{ color: 'var(--c1)' }}>Swasti Speaking...</span>
              </>
            )}
            {voiceState === 'idle' && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-[#6C6E84]" />
                <span className="text-[#A0A2B8]">Ready • Tap microphone to speak to Swasti</span>
              </>
            )}
          </div>

          {/* Subtitle / Live Transcript */}
          {subtitle && (
            <p className="mt-4 max-w-lg mx-auto text-[15.5px] text-[#D4D6E4] px-6 py-3 bg-[#141522]/80 border border-[#26283C] rounded-2xl shadow-sm line-clamp-3 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-md flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          {/* Interrupt Button (Visible during AI speech or thinking) */}
          {(voiceState === 'speaking' || voiceState === 'thinking') && (
            <button
              onClick={handleInterrupt}
              className="px-5 py-3 rounded-full bg-[#24263A] hover:bg-[#2F324C] text-[#F7F5EF] border border-[#3C3F5E] flex items-center gap-2 text-[13.5px] font-bold transition-all shadow-md"
              title="Interrupt Swasti"
            >
              <Square className="w-4 h-4 fill-current" style={{ color: 'var(--c3)' }} />
              <span>Interrupt</span>
            </button>
          )}

          {/* Main Push to Talk / Toggle Mic Button */}
          <button
            onClick={toggleMic}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-xl text-white hover:scale-105"
            style={{
              backgroundColor: stt.isRecording ? 'var(--c3)' : 'var(--c1)'
            }}
            title={stt.isRecording ? 'Stop & Send' : 'Speak to Swasti'}
          >
            {stt.isRecording ? (
              <MicOff className="w-7 h-7" />
            ) : (
              <Mic className="w-7 h-7" />
            )}
          </button>
        </div>

        <p className="text-[12.5px] text-[#8E90A6] flex items-center gap-1.5 font-medium">
          <Heart className="w-3.5 h-3.5 text-[#E8412C] fill-current" />
          <span>Swasti • Created by Bikash Talukder</span>
        </p>
      </div>
    </div>
  );
};
