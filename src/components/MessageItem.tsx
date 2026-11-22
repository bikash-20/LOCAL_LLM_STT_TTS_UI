import React, { useState } from 'react';
import { Message, VoiceConfig } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Volume2, Square, Copy, Check, Sparkles, User, Loader2 } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  voiceConfig: VoiceConfig;
  onSpeak: (text: string, messageId: string) => void;
  onStopSpeak: () => void;
  isPlayingThis: boolean;
  isSynthesizingThis: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  voiceConfig,
  onSpeak,
  onStopSpeak,
  isPlayingThis,
  isSynthesizingThis
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAudioToggle = () => {
    if (isPlayingThis) {
      onStopSpeak();
    } else {
      onSpeak(message.content, message.id);
    }
  };

  const timeStr = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="py-6 px-4 sm:px-7 transition-colors border-b"
      style={{
        backgroundColor: isUser ? 'transparent' : 'var(--ai-msg-bg)',
        borderColor: 'var(--border-color)'
      }}
    >
      <div className="max-w-4xl mx-auto flex gap-4 sm:gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          {isUser ? (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-medium shadow-sm border"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <User className="w-4.5 h-4.5 opacity-70" />
            </div>
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md border font-bold text-xs"
              style={{
                backgroundColor: 'rgba(156, 175, 136, 0.15)',
                borderColor: 'var(--c1)',
                color: 'var(--c1)'
              }}
            >
              <Sparkles className="w-4.5 h-4.5" />
            </div>
          )}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0">
          {/* Header Info */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-[17px] sm:text-[18px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {isUser ? 'You' : 'Swasti 🌸'}
              </span>
              <span className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {timeStr}
              </span>
            </div>

            {/* Actions for Assistant */}
            {!isUser && (
              <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
                {/* Voice Speak Button */}
                {voiceConfig.ttsEndpoint && (
                  <button
                    onClick={handleAudioToggle}
                    disabled={isSynthesizingThis}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] sm:text-[13.5px] font-bold transition-all border shadow-sm"
                    style={{
                      backgroundColor: isPlayingThis ? 'var(--c3)' : 'var(--card-bg)',
                      borderColor: isPlayingThis ? 'var(--c3)' : 'var(--border-color)',
                      color: isPlayingThis ? '#FFFFFF' : 'var(--text-secondary)'
                    }}
                    title={isPlayingThis ? 'Stop Swasti 🌸 voice playback' : 'Listen with Swasti 🌸 Voice'}
                  >
                    {isSynthesizingThis ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--c1)' }} />
                        <span style={{ color: 'var(--c1)' }}>Synthesizing...</span>
                      </>
                    ) : isPlayingThis ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>Stop</span>
                        <span className="flex items-end gap-0.5 h-3 ml-1">
                          <span className="w-0.5 h-2 bg-white animate-pulse" />
                          <span className="w-0.5 h-3 bg-white animate-pulse delay-75" />
                          <span className="w-0.5 h-1.5 bg-white animate-pulse delay-150" />
                        </span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" style={{ color: 'var(--c1)' }} />
                        <span>Swasti 🌸 Voice</span>
                      </>
                    )}
                  </button>
                )}

                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  title="Copy message"
                >
                  {copied ? (
                    <Check className="w-4.5 h-4.5" style={{ color: 'var(--c1)' }} />
                  ) : (
                    <Copy className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Content with Upgraded Spacious Font Sizing */}
          <div className="mt-1">
            {isUser ? (
              <p
                className="whitespace-pre-wrap leading-[1.85] text-[18px] sm:text-[18.5px] font-normal"
                style={{ color: 'var(--text-primary)' }}
              >
                {message.content}
              </p>
            ) : (
              <div className="text-[18px] sm:text-[18.5px] leading-[1.85]">
                <MarkdownRenderer content={message.content} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
