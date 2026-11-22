import React, { useState } from 'react';
import { ChatSession, ThemeMode } from '../types';
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  Mic,
  Moon,
  Sun,
  Download,
  PanelLeftClose,
  Heart,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onExportSession: (session: ChatSession) => void;
  onOpenPreferences: () => void;
  onOpenVoiceMode: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
  ollamaConnected: boolean | null;
  activeModel: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onExportSession,
  onOpenPreferences,
  onOpenVoiceMode,
  theme,
  onToggleTheme,
  isOpen,
  onCloseMobile,
  onToggleCollapse,
  ollamaConnected,
  activeModel
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  const todaySessions: ChatSession[] = [];
  const yesterdaySessions: ChatSession[] = [];
  const previous7DaysSessions: ChatSession[] = [];
  const olderSessions: ChatSession[] = [];

  filteredSessions.forEach(session => {
    const diff = now - session.updatedAt;
    if (diff < ONE_DAY) {
      todaySessions.push(session);
    } else if (diff < 2 * ONE_DAY) {
      yesterdaySessions.push(session);
    } else if (diff < 7 * ONE_DAY) {
      previous7DaysSessions.push(session);
    } else {
      olderSessions.push(session);
    }
  });

  const startEditing = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const saveEditing = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const renderSessionGroup = (title: string, group: ChatSession[]) => {
    if (group.length === 0) return null;
    return (
      <div key={title} className="mb-4">
        <h3 className="px-3 text-[12px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
          {title}
        </h3>
        <div className="space-y-0.5">
          {group.map(session => {
            const isActive = session.id === activeSessionId;
            const isEditing = session.id === editingId;

            return (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  onCloseMobile();
                }}
                className="group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] font-medium cursor-pointer transition-all border"
                style={{
                  backgroundColor: isActive ? 'var(--card-bg)' : 'transparent',
                  borderColor: isActive ? 'var(--c1)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: isActive ? 'var(--c1)' : 'var(--text-muted)' }}
                  />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-0.5 rounded text-[13.5px] focus:outline-none border"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--c1)',
                        color: 'var(--text-primary)'
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className="truncate">{session.title}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => saveEditing(session.id, e)}
                        className="p-1 hover:opacity-80"
                        style={{ color: 'var(--c1)' }}
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1 hover:opacity-80"
                        style={{ color: 'var(--c3)' }}
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportSession(session);
                        }}
                        className="p-1 hover:opacity-80"
                        style={{ color: 'var(--text-muted)' }}
                        title="Export Markdown"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => startEditing(session, e)}
                        className="p-1 hover:opacity-80"
                        style={{ color: 'var(--text-muted)' }}
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="p-1 hover:opacity-80"
                        style={{ color: 'var(--c3)' }}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-30 sm:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container with Smooth Width Collapse on Desktop & Mobile */}
      <aside
        className={`fixed sm:relative top-0 bottom-0 left-0 z-40 border-r flex flex-col transition-all duration-300 ease-in-out select-none ${
          isOpen
            ? 'w-72 opacity-100 translate-x-0'
            : 'w-0 opacity-0 -translate-x-full sm:translate-x-0 border-r-0 pointer-events-none overflow-hidden'
        }`}
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--border-color)',
          minWidth: isOpen ? '18rem' : '0rem',
          maxWidth: isOpen ? '18rem' : '0rem'
        }}
      >
        <div className="w-72 flex flex-col h-full">
          {/* Brand & New Chat */}
          <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md text-white font-bold"
                  style={{
                    background: 'linear-gradient(135deg, var(--c1) 0%, var(--c3) 100%)'
                  }}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight font-sans flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <span>Swasti 🌸</span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--c1)' }} />
                  </h1>
                  <p className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                    Created by Bikash Talukder
                  </p>
                </div>
              </div>

              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={() => {
                onNewChat();
                onCloseMobile();
              }}
              className="w-full py-2.5 px-3.5 rounded-xl border text-[13.5px] font-semibold flex items-center justify-between transition-all group shadow-sm hover:scale-[1.01]"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" style={{ color: 'var(--c1)' }} />
                <span>New conversation</span>
              </div>
              <kbd
                className="px-2 py-0.5 rounded border text-[11px] font-mono"
                style={{
                  backgroundColor: 'var(--sidebar-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-muted)'
                }}
              >
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-[13px] focus:outline-none border transition-colors font-medium"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {renderSessionGroup('Today', todaySessions)}
            {renderSessionGroup('Yesterday', yesterdaySessions)}
            {renderSessionGroup('Previous 7 Days', previous7DaysSessions)}
            {renderSessionGroup('Older', olderSessions)}

            {filteredSessions.length === 0 && (
              <div className="text-center py-8 text-[13.5px]" style={{ color: 'var(--text-muted)' }}>
                No conversations found
              </div>
            )}
          </div>

          {/* Live Persona & Status Pill */}
          <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--sidebar-bg)' }}>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: ollamaConnected === true ? 'var(--c1)' : (ollamaConnected === false ? 'var(--c3)' : '#F59E0B')
                  }}
                />
                <span className="truncate text-[12.5px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                  Swasti 🌸 Online
                </span>
              </div>

              <button
                onClick={onOpenVoiceMode}
                className="p-1.5 px-3 rounded-lg border flex items-center gap-1.5 text-[12px] font-bold transition-all shadow-sm hover:scale-[1.02]"
                style={{
                  backgroundColor: 'rgba(156, 175, 136, 0.15)',
                  borderColor: 'var(--c1)',
                  color: 'var(--c1)'
                }}
                title="Launch Swasti 🌸 Fullscreen Voice Mode"
              >
                <Mic className="w-3.5 h-3.5" style={{ color: 'var(--c3)' }} />
                <span>Voice</span>
              </button>
            </div>
          </div>

          {/* Developer Credit Badge */}
          <div className="px-4 py-2.5 border-t text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--sidebar-bg)' }}>
            <p className="text-[12.5px] flex items-center justify-center gap-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>
              <span>Developed by</span>
              <span className="font-extrabold font-sans" style={{ color: 'var(--c1)' }}>Bikash Talukder</span>
              <Heart className="w-3 h-3 fill-current inline" style={{ color: 'var(--c3)' }} />
            </p>
          </div>

          {/* Footer Settings & Theme */}
          <div className="p-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--sidebar-bg)' }}>
            <button
              onClick={onOpenPreferences}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13.5px] font-bold transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Settings className="w-4 h-4" />
              <span>Preferences</span>
            </button>

            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ color: 'var(--c1)' }}
              title="Toggle Light / Dark theme"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
