import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, VoiceConfig, OllamaConfig } from '../types';
import { MessageItem } from './MessageItem';
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
  Heart
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const stt = useSpeechToText(voiceConfig);

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
      title: 'Who Made You?',
      desc: 'Ask Swasti 🌸 about her creator Bikash Talukder',
      icon: Heart,
      prompt: 'Who created and developed you?'
    },
    {
      title: 'C++ & Algorithms',
      desc: 'Colorful syntax-highlighted code',
      icon: Code,
      prompt: 'Write a modern C++ program with #include <iostream>, vectors, and functions demonstrating colorful syntax highlighting and clean structure.'
    },
    {
      title: 'LaTeX Math Equation',
      desc: 'Gaussian integral & Euler formula',
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
        className="h-16 border-b px-4 sm:px-7 flex items-center justify-between z-10 flex-shrink-0 backdrop-blur-md"
        style={{
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 border shadow-sm"
            style={{
              borderColor: isSidebarOpen ? 'transparent' : 'var(--border-color)',
              backgroundColor: isSidebarOpen ? 'transparent' : 'var(--card-bg)',
              color: isSidebarOpen ? 'var(--text-secondary)' : 'var(--c1)'
            }}
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight truncate flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>{session.title}</span>
            </h2>
            <div className="flex items-center gap-2 text-[13.5px] sm:text-[14.5px]" style={{ color: 'var(--text-muted)' }}>
              <span className="font-bold" style={{ color: 'var(--c1)' }}>Swasti 🌸</span>
              <span>•</span>
              <span>Created by <strong className="font-bold" style={{ color: 'var(--text-secondary)' }}>Bikash Talukder</strong></span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Fullscreen Voice Mode Trigger */}
          <button
            onClick={onOpenVoiceMode}
            className="px-4 py-2 rounded-xl border flex items-center gap-2 text-[13.5px] sm:text-[14px] font-bold transition-all shadow-sm hover:scale-[1.02]"
            style={{
              backgroundColor: 'rgba(156, 175, 136, 0.15)',
              borderColor: 'var(--c1)',
              color: 'var(--c1)'
            }}
            title="Open Interactive Swasti 🌸 Voice Mode"
          >
            <Radio className="w-4 h-4" style={{ color: 'var(--c3)' }} />
            <span className="hidden sm:inline">Swasti 🌸 Voice</span>
          </button>

          {/* Export Chat */}
          <button
            onClick={onExportChat}
            className="p-2 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            title="Export conversation"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Clear Chat */}
          <button
            onClick={onClearChat}
            className="p-2 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'var(--c3)' }}
            title="Clear messages"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto">
        {session.messages.length === 0 ? (
          /* Empty State / Welcome Screen */
          <div className="max-w-2xl mx-auto px-4 py-14 text-center animate-fadeIn">
            <div
              className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg mb-5 text-white"
              style={{
                background: 'linear-gradient(135deg, var(--c1) 0%, var(--c3) 100%)'
              }}
            >
              <Sparkles className="w-8 h-8" />
            </div>

            <h1 className="text-4xl sm:text-6xl font-black font-sans tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Swasti 🌸
            </h1>
            <p className="mt-2 text-lg sm:text-xl font-bold tracking-wide" style={{ color: 'var(--c1)' }}>
              Voice & Chat Companion
            </p>
            <p className="mt-3 text-[16.5px] sm:text-[17.5px] max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Created with precision by <strong className="font-extrabold" style={{ color: 'var(--text-primary)' }}>Bikash Talukder</strong>. 100% private, offline, and natural.
            </p>

            {/* Quick Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-9 text-left">
              {quickPrompts.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(item.prompt)}
                    className="p-4 rounded-xl border transition-all text-left group shadow-sm hover:scale-[1.02]"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    <Icon className="w-5 h-5 mb-2.5 transition-transform group-hover:scale-110" style={{ color: 'var(--c1)' }} />
                    <h3 className="text-[15.5px] font-bold" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                    <p className="text-[13.5px] mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="pb-6">
            {session.messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                voiceConfig={voiceConfig}
                onSpeak={onSpeak}
                onStopSpeak={onStopSpeak}
                isPlayingThis={playingMessageId === message.id}
                isSynthesizingThis={synthesizingMessageId === message.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Composer Section */}
      <div
        className="p-4 sm:p-5 border-t backdrop-blur-md"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Recording Banner when Microphone is active */}
          {stt.isRecording && (
            <div
              className="mb-2.5 p-3 rounded-xl border flex items-center justify-between text-[14px] sm:text-[15px] font-bold animate-pulse"
              style={{
                backgroundColor: 'rgba(232, 65, 44, 0.12)',
                borderColor: 'var(--c3)',
                color: 'var(--c3)'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: 'var(--c3)' }} />
                <span>Swasti 🌸 is listening to your speech... Speak naturally</span>
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
            className="relative flex items-end gap-2.5 p-3.5 rounded-2xl border shadow-md transition-all focus-within:ring-2"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border-color)'
            }}
          >
            {/* Microphone Button */}
            <button
              type="button"
              onClick={handleToggleMic}
              disabled={isGenerating}
              className="p-2.5 rounded-xl transition-all"
              style={{
                backgroundColor: stt.isRecording ? 'var(--c3)' : 'transparent',
                color: stt.isRecording ? '#FFFFFF' : 'var(--text-secondary)'
              }}
              title={stt.isRecording ? 'Stop recording' : 'Speak to Swasti 🌸 (Whisper STT)'}
            >
              {stt.isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Textarea with Spacious Comfortable Font Size */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={stt.isRecording ? 'Listening...' : 'Message Swasti 🌸 or click mic to speak... (LaTeX, tables, code supported)'}
              rows={1}
              className="flex-1 max-h-48 py-2 bg-transparent focus:outline-none text-[17px] sm:text-[17.5px] resize-none leading-relaxed font-sans"
              style={{
                color: 'var(--text-primary)'
              }}
            />

            {/* Send / Stop Generation Button */}
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="p-2.5 rounded-xl text-white transition-all shadow-md"
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
                className={`p-2.5 rounded-xl transition-all ${
                  inputText.trim() ? 'shadow-md cursor-pointer' : 'opacity-40 cursor-not-allowed'
                }`}
                style={{
                  backgroundColor: inputText.trim() ? 'var(--c1)' : 'var(--card-bg)',
                  color: inputText.trim() ? '#FFFFFF' : 'var(--text-muted)'
                }}
                title="Send message to Swasti 🌸"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-2.5 px-1 text-[13px] sm:text-[13.5px]" style={{ color: 'var(--text-muted)' }}>
            <span>Press <kbd className="px-1.5 py-0.5 rounded border text-[12px] font-mono" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}>Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded border text-[12px] font-mono" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}>Shift+Enter</kbd> for newline</span>
            <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--c1)' }}>
              <span>Swasti 🌸</span> • <span>Bikash Talukder</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
