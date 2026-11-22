import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { PreferencesModal } from './components/PreferencesModal';
import { VoiceModeModal } from './components/VoiceModeModal';
import { useChatHistory } from './hooks/useChatHistory';
import { useOllama } from './hooks/useOllama';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import {
  getStoredOllamaConfig,
  saveStoredOllamaConfig,
  getStoredVoiceConfig,
  saveStoredVoiceConfig,
  getStoredTheme,
  saveStoredTheme
} from './utils/storage';
import { getStoredPaletteId, saveStoredPaletteId, applyTheme } from './utils/themeManager';
import { ColorPaletteId } from './types/theme';
import { Message, ThemeMode } from './types';

export function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());
  const [paletteId, setPaletteId] = useState<ColorPaletteId>(() => getStoredPaletteId());
  const [ollamaConfig, setOllamaConfig] = useState(() => getStoredOllamaConfig());
  const [voiceConfig, setVoiceConfig] = useState(() => getStoredVoiceConfig());

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);

  // Chat History Hook
  const {
    sessions,
    activeSession,
    activeSessionId,
    createNewSession,
    switchSession,
    deleteSession,
    renameSession,
    clearAllSessions,
    addMessage,
    updateMessageContent,
    exportChatAsMarkdown
  } = useChatHistory();

  // Ollama Hook
  const ollama = useOllama(ollamaConfig);

  // Text To Speech Hook
  const tts = useTextToSpeech(voiceConfig);

  // Apply theme & color palette to document
  useEffect(() => {
    saveStoredTheme(theme);
    saveStoredPaletteId(paletteId);
    applyTheme(paletteId, theme);
  }, [theme, paletteId]);

  // Handle Cmd+K / Ctrl+K shortcut for New Chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        createNewSession();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewSession]);

  // Fast, Smooth token-by-token streaming queue
  const streamingQueueRef = useRef<string[]>([]);
  const isStreamingDoneRef = useRef<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  // Send Message Handler with Smooth Word-by-Word Generation
  const handleSendMessage = useCallback(async (text: string) => {
    if (!activeSession || !text.trim()) return;

    const userMessage: Message = {
      id: 'msg-user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    addMessage(activeSession.id, userMessage);

    const assistantMessageId = 'msg-ai-' + (Date.now() + 1);
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      model: 'Swasti 🌸'
    };

    addMessage(activeSession.id, assistantMessage);

    const historyForOllama = [...activeSession.messages, userMessage];

    // Reset streaming animation queue
    streamingQueueRef.current = [];
    isStreamingDoneRef.current = false;
    let accumulatedContent = '';

    // Smooth token ticker: unloads tokens quickly and smoothly with typewriter cadence
    const drainStreamingQueue = () => {
      if (streamingQueueRef.current.length > 0) {
        // Take 1-2 chunks per frame for smooth readable flow
        const countToTake = Math.min(streamingQueueRef.current.length, streamingQueueRef.current.length > 10 ? 3 : 1);
        for (let i = 0; i < countToTake; i++) {
          const delta = streamingQueueRef.current.shift()!;
          accumulatedContent += delta;
        }
        updateMessageContent(activeSession.id, assistantMessageId, accumulatedContent);
      }

      if (!isStreamingDoneRef.current || streamingQueueRef.current.length > 0) {
        animFrameRef.current = requestAnimationFrame(drainStreamingQueue);
      }
    };

    animFrameRef.current = requestAnimationFrame(drainStreamingQueue);

    try {
      await ollama.generateStreamingResponse(
        historyForOllama,
        undefined,
        (chunk) => {
          // Push to smooth token queue
          streamingQueueRef.current.push(chunk);
        }
      );

      isStreamingDoneRef.current = true;

      // Drain any remaining tokens immediately
      while (streamingQueueRef.current.length > 0) {
        accumulatedContent += streamingQueueRef.current.shift()!;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      updateMessageContent(activeSession.id, assistantMessageId, accumulatedContent);

      // If Auto-Speak is enabled, Swasti speaks automatically
      if (voiceConfig.autoSpeak && accumulatedContent.trim()) {
        tts.speak(accumulatedContent, assistantMessageId);
      }
    } catch (err) {
      console.error('Generation error:', err);
      isStreamingDoneRef.current = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      updateMessageContent(
        activeSession.id,
        assistantMessageId,
        `⚠️ **Error contacting local model:** ${err instanceof Error ? err.message : String(err)}\n\nPlease ensure Ollama is running at \`${ollamaConfig.serverUrl}\` and you have selected an installed model.`
      );
    }
  }, [activeSession, ollamaConfig, voiceConfig, addMessage, updateMessageContent, ollama, tts]);

  const handleSaveOllamaConfig = (cfg: typeof ollamaConfig) => {
    setOllamaConfig(cfg);
    saveStoredOllamaConfig(cfg);
  };

  const handleSaveVoiceConfig = (cfg: typeof voiceConfig) => {
    setVoiceConfig(cfg);
    saveStoredVoiceConfig(cfg);
  };

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ backgroundColor: 'var(--app-bg)', color: 'var(--text-primary)' }}
    >
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={switchSession}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
        onExportSession={exportChatAsMarkdown}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        onOpenVoiceMode={() => setIsVoiceModeOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarOpen(prev => !prev)}
        ollamaConnected={ollama.isConnected}
        activeModel={
          (ollamaConfig.selectedModel && ollama.availableModels.includes(ollamaConfig.selectedModel))
            ? ollamaConfig.selectedModel
            : (ollama.availableModels[0] || '')
        }
      />

      {/* Main Chat View */}
      {activeSession ? (
        <ChatArea
          session={activeSession}
          onSendMessage={handleSendMessage}
          onStopGeneration={() => {
            isStreamingDoneRef.current = true;
            if (animFrameRef.current) {
              cancelAnimationFrame(animFrameRef.current);
              animFrameRef.current = null;
            }
            ollama.stopGeneration();
          }}
          isGenerating={ollama.isGenerating}
          voiceConfig={voiceConfig}
          ollamaConfig={ollamaConfig}
          onSpeak={(text, id) => tts.speak(text, id)}
          onStopSpeak={tts.stop}
          playingMessageId={tts.activeMessageId}
          synthesizingMessageId={tts.isSynthesizing ? tts.activeMessageId : null}
          onOpenVoiceMode={() => setIsVoiceModeOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          isSidebarOpen={isSidebarOpen}
          onExportChat={() => exportChatAsMarkdown(activeSession)}
          onClearChat={() => {
            if (window.confirm('Clear all messages in this conversation?')) {
              clearAllSessions();
            }
          }}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
          No active session
        </div>
      )}

      {/* Preferences Modal (Faithful to User Screenshots & Swasti Persona) */}
      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        ollamaConfig={ollamaConfig}
        onSaveOllamaConfig={handleSaveOllamaConfig}
        voiceConfig={voiceConfig}
        onSaveVoiceConfig={handleSaveVoiceConfig}
        theme={theme}
        onSaveTheme={setTheme}
        paletteId={paletteId}
        onSavePaletteId={setPaletteId}
        availableModels={ollama.availableModels}
        onTestOllama={ollama.fetchModels}
      />

      {/* Fullscreen Swasti Voice Mode Modal */}
      <VoiceModeModal
        isOpen={isVoiceModeOpen}
        onClose={() => setIsVoiceModeOpen(false)}
        voiceConfig={voiceConfig}
        ollamaConfig={ollamaConfig}
        messages={activeSession?.messages || []}
        onAddUserMessage={(text) => {
          if (activeSession) {
            addMessage(activeSession.id, {
              id: 'user-' + Date.now(),
              role: 'user',
              content: text,
              timestamp: Date.now()
            });
          }
        }}
        onAddAssistantMessage={(text) => {
          if (activeSession) {
            addMessage(activeSession.id, {
              id: 'ai-' + Date.now(),
              role: 'assistant',
              content: text,
              timestamp: Date.now(),
              model: 'Swasti 🌸'
            });
          }
        }}
      />
    </div>
  );
}

export default App;
