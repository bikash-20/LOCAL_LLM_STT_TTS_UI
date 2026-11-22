export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  audioUrl?: string;
  isSynthesizingAudio?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  systemPrompt?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  accent: string;
  desc: string;
  recommended?: boolean;
}

export interface VoiceConfig {
  sttEndpoint: string;
  ttsEndpoint: string;
  voiceId: string;
  speed: number;
  autoSpeak: boolean;
  enableInterruption: boolean;
  engine: 'kokoro' | 'webspeech';
}

export interface OllamaConfig {
  serverUrl: string;
  selectedModel: string;
  temperature: number;
  systemPrompt: string;
}

export type ThemeMode = 'dark' | 'light' | 'system';
