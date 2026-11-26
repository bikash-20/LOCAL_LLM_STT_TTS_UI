import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, VoiceConfig, OllamaConfig } from '../types';
import { MessageItem } from './MessageItem';
import { InstallBanner } from './InstallBanner';
import {
  Send,
  Mic,
  MicOff,
  Square,
  Sparkles,
  Menu,
  Download,
  Trash2,
  Radio,
  Code,
  Sigma,
  BookOpen
} from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface ChatAreaProps {
  session: ChatSession;
  onSendMessage: (text: string) => void;
  onStopGeneration: () => void;
  isGenerating: boolean;
  voiceConfig: VoiceConfig;
  ollamaConfig: OllamaConfig;
  onSpeak: (text: string, messageId: string) => void;
  onStopSpeak: () => void;
  playingMessageId: string | null;
  synthesizingMessageId: string | null;
  onOpenVoiceMode: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onExportChat: () => void;
  onClearChat: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  session,
  onSendMessage,
  onStopGeneration,
  isGenerating,
  voiceConfig,
  ollamaConfig,
  onSpeak,
  onStopSpeak,
  playingMessageId,
  synthesizingMessageId,
  onOpenVoiceMode,
  onToggleSidebar,
  isSidebarOpen,
  onExportChat,
  onClearChat
}) => {
  const [inputText, setInputText] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const clearTimerRef = useRef<number | null>(null);

  const stt = useSpeechToText(voiceConfig);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        window.clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  const handleClearClick = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = window.setTimeout(() => setConfirmClear(false), 3500);
      return;
    }
    if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    setConfirmClear(false);
    onClearChat();
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, isGenerating]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
    }
  }, [inputText]);

  const handleSend = () => {
    if ((!inputText.trim() && !stt.isRecording) || isGenerating) return;

    if (stt.isRecording) {
      handleStopMic();
      return;
    }

    onSendMessage(inputText.trim());
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleMic = async () => {
    if (stt.isRecording) {
      const transcribed = await stt.stopRecording();
      if (transcribed && transcribed.trim()) {
        setInputText(prev => (prev ? `${prev} ${transcribed}` : transcribed));
      }
    } else {
      await stt.startRecording();
    }
  };

  const handleStopMic = async () => {
    const transcribed = await stt.stopRecording();
    if (transcribed && transcribed.trim()) {
      onSendMessage(transcribed);
    }
  };

  const quickPrompts = [
    {
      title: 'Explain a concept',
      desc: 'Break down complex ideas clearly',
      icon: BookOpen,
      prompt: 'Explain how transformer attention works in plain language with a clear, everyday analogy.'
    },
    {
      title: 'C++ and algorithms',
      desc: 'Syntax-highlighted clean code',
      icon: Code,
      prompt: 'Write a modern C++ program with #include <iostream>, vectors, and functions demonstrating clean structure.'
    },
    {
      title: 'LaTeX math derivations',
      desc: 'Gaussian integral and Euler formula',
      icon: Sigma,
      prompt: 'Please explain Euler\'s formula $e^{i\\pi} + 1 = 0$ and derive the Gaussian integral $\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$ with full KaTeX math formatting.'
    }
  ];

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden relative"
      style={{ backgroundColor: 'var(--app-bg)', color: 'var(--text-primary)' }}
    >
      {/* Top Header Bar */}
      <header
        className="h-16 px-4 sm:px-6 flex items-center justify-between z-10 flex-shrink-0 backdrop-blur-md border-b"
        style={{
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="h-9 w-9 rounded-xl border flex items-center justify-center transition-all hover:opacity-80 active:scale-95 shadow-sm flex-shrink-0"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-secondary)'
            }}
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
              {session.title}
            </h2>
            <p className="text-[12.5px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>
              Swasti • Private offline AI
            </p>
          </div>
        </div>

        {/* Consistent Header Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onOpenVoiceMode}
            className="h-9 px-3 rounded-xl border flex items-center gap-2 text-[13px] font-bold transition-all shadow-sm hover:opacity-85 active:scale-95"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
            title="Open voice mode"
          >
            <Radio className="w-4 h-4" style={{ color: 'var(--c1)' }} />
            <span className="hidden sm:inline">Voice</span>
          </button>

          <button
            onClick={onExportChat}
            className="h-9 w-9 rounded-xl border flex items-center justify-center transition-all shadow-sm hover:opacity-85 active:scale-95"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
            title="Export conversation"
          >
            <Download className="w-4 h-4" />
          </button>

          <div className="w-px h-5 mx-0.5" style={{ backgroundColor: 'var(--border-color)' }} />

          <button
            onClick={handleClearClick}
            className={`h-9 rounded-xl border flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
              confirmClear ? 'px-3 text-xs font-bold text-white' : 'w-9 hover:opacity-85'
            }`}
            style={{
              backgroundColor: confirmClear ? 'var(--c3)' : 'var(--card-bg)',
              borderColor: confirmClear ? 'var(--c3)' : 'var(--border-color)',
              color: confirmClear ? '#FFFFFF' : 'var(--text-secondary)'
            }}
            title={confirmClear ? 'Click again to confirm clearing all chats' : 'Clear conversations'}
          >
            <Trash2 className="w-4 h-4" />
            {confirmClear && <span>Confirm?</span>}
          </button>
        </div>
      </header>

      {/* PWA Install Recommendation Banner */}
      <InstallBanner />

      {/* Main Rounded Container (Complete Top & Bottom Edges, Soft Scroll Fade) */}
      <div className="flex-1 min-h-0 px-3 sm:px-6 pt-3 pb-2 flex flex-col">
        <div
          className="glass-sheet flex-1 min-h-0 rounded-3xl overflow-hidden flex flex-col border shadow-sm"
          style={{
            borderColor: 'var(--border-color)'
          }}
        >
          <div className="flex-1 overflow-y-auto scroll-fade-y pr-1">
            {session.messages.length === 0 ? (
              /* Vertically Centered Hero Empty State */
              <div className="min-h-full max-w-2xl mx-auto px-5 sm:px-8 py-10 flex flex-col items-center justify-center text-center animate-fadeIn">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-5 text-white flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, var(--c1) 0%, var(--c3) 100%)'
                  }}
                >
                  <Sparkles className="w-7 h-7" />
                </div>

                <h1
                  className="text-4xl sm:text-5xl font-black font-sans tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Swasti 🌸
                </h1>
                <p
                  className="mt-2 text-base sm:text-lg font-bold"
                  style={{ color: 'var(--c1)' }}
                >
                  Voice &amp; chat companion
                </p>
                <p
                  className="mt-2.5 text-[15.5px] sm:text-[16.5px] max-w-md mx-auto leading-relaxed [text-wrap:balance]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  100% private, offline voice and chat on your device.
                </p>

                {/* Quick Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-7 w-full text-left">
                  {quickPrompts.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => onSendMessage(item.prompt)}
                        className="p-4 rounded-2xl border transition-all text-left group shadow-sm hover:scale-[1.02]"
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'var(--border-color)'
                        }}
                      >
                        <Icon className="w-5 h-5 mb-2.5 transition-transform group-hover:scale-110" style={{ color: 'var(--c1)' }} />
                        <h3 className="text-[15px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                        <p className="text-[13px] mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Message List */
              <div className="py-2">
                {session.messages.map((message, idx) => {
                  const isLast = idx === session.messages.length - 1;
                  return (
                    <MessageItem
                      key={message.id}
                      message={message}
                      voiceConfig={voiceConfig}
                      onSpeak={onSpeak}
                      onStopSpeak={onStopSpeak}
                      isPlayingThis={playingMessageId === message.id}
                      isSynthesizingThis={synthesizingMessageId === message.id}
                      isStreaming={isGenerating && isLast && message.role === 'assistant'}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Translucent Input Composer Section */}
      <div className="px-3 sm:px-6 pb-3.5 pt-1 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          {/* Recording Banner when Microphone is active */}
          {stt.isRecording && (
            <div
              className="mb-2.5 p-3 rounded-xl border flex items-center justify-between text-[14px] font-bold animate-pulse backdrop-blur-md"
              style={{
                backgroundColor: 'rgba(176, 91, 59, 0.14)',
                borderColor: 'var(--c3)',
                color: 'var(--c3)'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: 'var(--c3)' }} />
                <span>Swasti is listening... Speak naturally</span>
              </div>
              <button
                onClick={handleStopMic}
                className="px-3.5 py-1.5 rounded-lg text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: 'var(--c3)' }}
              >
                Done
              </button>
            </div>
          )}

          {/* Input Box */}
          <div
            className="composer-box relative flex items-center gap-2 px-3 py-2 rounded-2xl border shadow-lg backdrop-blur-xl transition-all"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border-color)'
            }}
          >
            {/* Microphone Button (Inline Left) */}
            <button
              type="button"
              onClick={handleToggleMic}
              disabled={isGenerating}
              className="flex-shrink-0 p-2.5 rounded-xl transition-all hover:opacity-85"
              style={{
                backgroundColor: stt.isRecording ? 'var(--c3)' : 'transparent',
                color: stt.isRecording ? '#FFFFFF' : 'var(--text-secondary)'
              }}
              title={stt.isRecording ? 'Stop recording' : 'Speak using microphone'}
            >
              {stt.isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={stt.isRecording ? 'Listening...' : 'Message Swasti or use the mic to speak...'}
              rows={1}
              className="min-w-0 flex-1 max-h-48 py-1.5 pl-1 bg-transparent focus:outline-none text-[16px] sm:text-[16.5px] resize-none leading-relaxed font-sans"
              style={{
                color: 'var(--text-primary)'
              }}
            />

            {/* Send / Stop Generation Button */}
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="flex-shrink-0 p-2.5 rounded-xl text-white transition-all shadow-md"
                style={{ backgroundColor: 'var(--c3)' }}
                title="Stop generation"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() && !stt.isRecording}
                className={`flex-shrink-0 p-2.5 rounded-xl text-white transition-all shadow-sm ${
                  inputText.trim() ? 'opacity-100 shadow-md cursor-pointer hover:scale-[1.03]' : 'opacity-60 cursor-not-allowed'
                }`}
                style={{
                  backgroundColor: 'var(--c1)'
                }}
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 px-1.5 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
            <span>
              Press <kbd className="px-1.5 py-0.5 rounded border text-[11.5px] font-mono" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}>Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded border text-[11.5px] font-mono" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}>Shift+Enter</kbd> for new line
            </span>
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Created by Bikash Talukder
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
