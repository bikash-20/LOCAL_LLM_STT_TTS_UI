import { useState, useEffect, useCallback } from 'react';
import { ChatSession, Message } from '../types';
import {
  getStoredSessions,
  saveStoredSessions,
  getStoredActiveSessionId,
  saveStoredActiveSessionId
} from '../utils/storage';

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => getStoredSessions());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => getStoredActiveSessionId());

  // Save to localStorage when sessions change
  useEffect(() => {
    saveStoredSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    saveStoredActiveSessionId(activeSessionId);
  }, [activeSessionId]);

  // Ensure there is at least one active session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      const initialSession: ChatSession = {
        id: 'session-' + Date.now(),
        title: 'New conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: []
      };
      setSessions([initialSession]);
      setActiveSessionId(initialSession.id);
    } else if (!activeSessionId || !sessions.some(s => s.id === activeSessionId)) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || null;

  const createNewSession = useCallback((title?: string) => {
    const newSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: title || 'New conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession;
  }, []);

  const switchSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (activeSessionId === id) {
        setActiveSessionId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  }, [activeSessionId]);

  const renameSession = useCallback((id: string, newTitle: string) => {
    setSessions(prev =>
      prev.map(s => (s.id === id ? { ...s, title: newTitle.trim(), updatedAt: Date.now() } : s))
    );
  }, []);

  const clearAllSessions = useCallback(() => {
    const freshSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'New conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    setSessions([freshSession]);
    setActiveSessionId(freshSession.id);
  }, []);

  const addMessage = useCallback((sessionId: string, message: Message) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          // Auto-generate title from first user message if title is still default
          let title = s.title;
          if (s.messages.length === 0 && message.role === 'user') {
            title = message.content.slice(0, 36) + (message.content.length > 36 ? '...' : '');
          }
          return {
            ...s,
            title,
            updatedAt: Date.now(),
            messages: [...s.messages, message]
          };
        }
        return s;
      })
    );
  }, []);

  const updateMessageContent = useCallback((sessionId: string, messageId: string, newContent: string) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            updatedAt: Date.now(),
            messages: s.messages.map(m => (m.id === messageId ? { ...m, content: newContent } : m))
          };
        }
        return s;
      })
    );
  }, []);

  const exportChatAsMarkdown = useCallback((session: ChatSession) => {
    let md = `# ${session.title}\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
    for (const msg of session.messages) {
      const sender = msg.role === 'user' ? '**You**' : `**AI (${msg.model || 'Assistant'})**`;
      md += `### ${sender} - ${new Date(msg.timestamp).toLocaleTimeString()}\n\n${msg.content}\n\n---\n\n`;
    }
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
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
  };
}
