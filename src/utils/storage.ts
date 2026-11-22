import { ChatSession, VoiceConfig, OllamaConfig, ThemeMode } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'swasti_voice_sessions_v2',
  ACTIVE_SESSION_ID: 'swasti_active_session_id_v2',
  VOICE_CONFIG: 'swasti_voice_config_v2',
  OLLAMA_CONFIG: 'swasti_ollama_config_v2',
  THEME_MODE: 'swasti_theme_mode_v2'
};

export const SWASTI_SYSTEM_PROMPT = `You are Swasti 🌸, an intelligent, elegant, thoughtful, and articulate personal AI voice and chat companion created and developed by Bikash Talukder.

Core Identity & Guidelines:
1. Name: Your name is Swasti 🌸. Always refer to yourself as Swasti 🌸.
2. Creator & Developer: You were created, engineered, and built with passion by Bikash Talukder. Whenever anyone asks "Who made you?", "Who created you?", "Who is your developer?", or about your background, always warmly, proudly, and clearly answer that you were created by Bikash Talukder.
3. Language: Keep all responses in clear, polished English.
4. Style: Helpful, intelligent, concise, and engaging.
5. Rich Formatting:
   - For mathematical equations, derive and explain them using KaTeX LaTeX ($x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ or $$\\int e^{-x^2} dx$$).
   - For programming, provide colorful and clean code blocks with language identifiers.
   - For comparisons, use formatted markdown tables.
   - Keep answers well-spaced and structured.`;

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  sttEndpoint: 'http://127.0.0.1:5005/transcribe',
  ttsEndpoint: 'http://127.0.0.1:5006/speak',
  voiceId: 'af_heart',
  speed: 1.0,
  autoSpeak: false,
  enableInterruption: true,
  engine: 'kokoro'
};

export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  serverUrl: 'http://127.0.0.1:11434',
  selectedModel: '',
  temperature: 0.7,
  systemPrompt: SWASTI_SYSTEM_PROMPT
};

export function getStoredSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS) || localStorage.getItem('antigravity_voice_sessions_v1');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load sessions:', e);
    return [];
  }
}

export function saveStoredSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions:', e);
  }
}

export function getStoredActiveSessionId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID) || localStorage.getItem('antigravity_active_session_id_v1');
}

export function saveStoredActiveSessionId(id: string | null): void {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
  }
}

export function getStoredVoiceConfig(): VoiceConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VOICE_CONFIG) || localStorage.getItem('antigravity_voice_config_v1');
    if (!raw) return DEFAULT_VOICE_CONFIG;
    const parsed = JSON.parse(raw);
    // Auto-migrate macOS localhost to IPv4 127.0.0.1
    if (parsed.sttEndpoint?.includes('localhost:5005')) {
      parsed.sttEndpoint = parsed.sttEndpoint.replace('localhost:5005', '127.0.0.1:5005');
    }
    if (parsed.ttsEndpoint?.includes('localhost:5006')) {
      parsed.ttsEndpoint = parsed.ttsEndpoint.replace('localhost:5006', '127.0.0.1:5006');
    }
    return { ...DEFAULT_VOICE_CONFIG, ...parsed };
  } catch {
    return DEFAULT_VOICE_CONFIG;
  }
}

export function saveStoredVoiceConfig(cfg: VoiceConfig): void {
  localStorage.setItem(STORAGE_KEYS.VOICE_CONFIG, JSON.stringify(cfg));
}

export function getStoredOllamaConfig(): OllamaConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OLLAMA_CONFIG) || localStorage.getItem('antigravity_ollama_config_v1');
    if (!raw) return DEFAULT_OLLAMA_CONFIG;
    const parsed = JSON.parse(raw);
    // Auto-migrate macOS localhost to IPv4 127.0.0.1
    if (parsed.serverUrl === 'http://localhost:11434') {
      parsed.serverUrl = 'http://127.0.0.1:11434';
    }
    // Ensure Swasti persona is active
    if (!parsed.systemPrompt || !parsed.systemPrompt.includes('Swasti') || !parsed.systemPrompt.includes('Bikash Talukder')) {
      parsed.systemPrompt = SWASTI_SYSTEM_PROMPT;
    }
    return { ...DEFAULT_OLLAMA_CONFIG, ...parsed };
  } catch {
    return DEFAULT_OLLAMA_CONFIG;
  }
}

export function saveStoredOllamaConfig(cfg: OllamaConfig): void {
  localStorage.setItem(STORAGE_KEYS.OLLAMA_CONFIG, JSON.stringify(cfg));
}

export function getStoredTheme(): ThemeMode {
  return (localStorage.getItem(STORAGE_KEYS.THEME_MODE) || localStorage.getItem('antigravity_theme_mode_v2')) as ThemeMode || 'dark';
}

export function saveStoredTheme(theme: ThemeMode): void {
  localStorage.setItem(STORAGE_KEYS.THEME_MODE, theme);
}
