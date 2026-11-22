import React, { useState, useEffect } from 'react';
import { OllamaConfig, VoiceConfig, ThemeMode, VoiceOption } from '../types';
import { ColorPaletteId, COLOR_PALETTES } from '../types/theme';
import { SWASTI_SYSTEM_PROMPT } from '../utils/storage';
import { X, Server, Volume2, Palette, RefreshCw, Check } from 'lucide-react';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ollamaConfig: OllamaConfig;
  onSaveOllamaConfig: (cfg: OllamaConfig) => void;
  voiceConfig: VoiceConfig;
  onSaveVoiceConfig: (cfg: VoiceConfig) => void;
  theme: ThemeMode;
  onSaveTheme: (theme: ThemeMode) => void;
  paletteId: ColorPaletteId;
  onSavePaletteId: (paletteId: ColorPaletteId) => void;
  availableModels: string[];
  onTestOllama: (url: string) => Promise<{ success: boolean; models: string[]; latency?: number; error?: string }>;
}

const SWASTI_VOICE_PROFILES: VoiceOption[] = [
  { id: 'af_heart', name: 'Swasti 🌸 Natural (Recommended)', gender: 'Female', accent: 'American', desc: 'Warm, ultra-natural, human-like cadence', recommended: true },
  { id: 'af_bella', name: 'Swasti 🌸 Expressive', gender: 'Female', accent: 'American', desc: 'Clear, lively, friendly' },
  { id: 'af_nicole', name: 'Swasti 🌸 Thoughtful', gender: 'Female', accent: 'American', desc: 'Calm, poised, intelligent' },
  { id: 'af_sarah', name: 'Swasti 🌸 Modern', gender: 'Female', accent: 'American', desc: 'Casual, upbeat, modern' },
  { id: 'af_sky', name: 'Swasti 🌸 Gentle', gender: 'Female', accent: 'American', desc: 'Airy, soft, pleasant' },
  { id: 'bf_emma', name: 'Swasti 🌸 British Warm (Recommended)', gender: 'Female', accent: 'British', desc: 'Sophisticated, warm British accent', recommended: true },
  { id: 'bf_isabella', name: 'Swasti 🌸 British Crisp', gender: 'Female', accent: 'British', desc: 'Crisp, elegant, refined' },
  { id: 'bf_alice', name: 'Swasti 🌸 British Delicate', gender: 'Female', accent: 'British', desc: 'Delicate, poised' },
  { id: 'am_adam', name: 'Swasti 🌸 Baritone (Deep)', gender: 'Male', accent: 'American', desc: 'Authoritative, deep, balanced', recommended: true },
  { id: 'am_michael', name: 'Swasti 🌸 Articulate', gender: 'Male', accent: 'American', desc: 'Energetic, articulate, engaging' },
  { id: 'bm_george', name: 'Swasti 🌸 Distinguished', gender: 'Male', accent: 'British', desc: 'Scholarly, distinguished British' }
];

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  ollamaConfig,
  onSaveOllamaConfig,
  voiceConfig,
  onSaveVoiceConfig,
  theme,
  onSaveTheme,
  paletteId,
  onSavePaletteId,
  availableModels,
  onTestOllama
}) => {
  const [activeTab, setActiveTab] = useState<'model' | 'voice' | 'theme'>('model');

  // Form states
  const [ollamaUrl, setOllamaUrl] = useState(ollamaConfig.serverUrl);
  const [selectedModel, setSelectedModel] = useState(ollamaConfig.selectedModel);
  const [temperature, setTemperature] = useState(ollamaConfig.temperature);
  const [systemPrompt, setSystemPrompt] = useState(ollamaConfig.systemPrompt);

  const [sttEndpoint, setSttEndpoint] = useState(voiceConfig.sttEndpoint);
  const [ttsEndpoint, setTtsEndpoint] = useState(voiceConfig.ttsEndpoint);
  const [voiceId, setVoiceId] = useState(voiceConfig.voiceId);
  const [voiceSpeed, setVoiceSpeed] = useState(voiceConfig.speed);
  const [autoSpeak, setAutoSpeak] = useState(voiceConfig.autoSpeak);
  const [enableInterruption, setEnableInterruption] = useState(voiceConfig.enableInterruption);

  const [selectedPalette, setSelectedPalette] = useState<ColorPaletteId>(paletteId);
  const [selectedThemeMode, setSelectedThemeMode] = useState<ThemeMode>(theme);

  const [testingOllama, setTestingOllama] = useState(false);
  const [ollamaTestResult, setOllamaTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const [testingVoice, setTestingVoice] = useState(false);
  const [voiceTestResult, setVoiceTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setOllamaUrl(ollamaConfig.serverUrl);
      setSelectedModel(ollamaConfig.selectedModel || availableModels[0] || '');
      setTemperature(ollamaConfig.temperature);
      setSystemPrompt(ollamaConfig.systemPrompt || SWASTI_SYSTEM_PROMPT);
      setSttEndpoint(voiceConfig.sttEndpoint);
      setTtsEndpoint(voiceConfig.ttsEndpoint);
      setVoiceId(voiceConfig.voiceId);
      setVoiceSpeed(voiceConfig.speed);
      setAutoSpeak(voiceConfig.autoSpeak);
      setEnableInterruption(voiceConfig.enableInterruption);
      setSelectedPalette(paletteId);
      setSelectedThemeMode(theme);
      setOllamaTestResult(null);
      setVoiceTestResult(null);
    }
  }, [isOpen, ollamaConfig, voiceConfig, paletteId, theme, availableModels]);

  const handleTestOllamaConnection = async () => {
    setTestingOllama(true);
    setOllamaTestResult(null);
    const res = await onTestOllama(ollamaUrl);
    setTestingOllama(false);
    if (res.success) {
      setOllamaTestResult({
        success: true,
        msg: `Connected successfully! Found ${res.models.length} model(s) (${res.latency}ms)`
      });
      if (res.models.length > 0 && !selectedModel) {
        setSelectedModel(res.models[0]);
      }
    } else {
      setOllamaTestResult({
        success: false,
        msg: res.error || 'Failed to connect. Is Ollama running?'
      });
    }
  };

  const handleTestVoiceServer = async () => {
    setTestingVoice(true);
    setVoiceTestResult(null);
    try {
      const base = (ttsEndpoint || 'http://127.0.0.1:5006/speak').replace(/\/speak$/, '/health');
      const candidates = [base];
      if (base.includes('localhost')) {
        candidates.push(base.replace('localhost', '127.0.0.1'));
      } else if (base.includes('127.0.0.1')) {
        candidates.push(base.replace('127.0.0.1', 'localhost'));
      }
      let found = false;
      for (const target of candidates) {
        try {
          const res = await fetch(target);
          if (res.ok) {
            const data = await res.json();
            setVoiceTestResult({
              success: true,
              msg: `Swasti 🌸 voice server online! TTS: ${data.tts?.ready ? 'Ready' : 'Standby'}, Whisper STT: ${data.stt?.ready ? 'Ready' : 'Standby'}`
            });
            found = true;
            break;
          }
        } catch {
          // try next candidate
        }
      }
      if (!found) {
        throw new Error('Could not reach voice server. Run "./start.sh" or "python voice_server.py" to start it.');
      }
    } catch (err) {
      setVoiceTestResult({
        success: false,
        msg: err instanceof Error ? err.message : `Could not reach voice server. Run './start.sh' to start it.`
      });
    } finally {
      setTestingVoice(false);
    }
  };

  const handleResetToSwastiPrompt = () => {
    setSystemPrompt(SWASTI_SYSTEM_PROMPT);
  };

  const handleSave = () => {
    onSaveOllamaConfig({
      serverUrl: ollamaUrl,
      selectedModel: selectedModel,
      temperature,
      systemPrompt
    });
    onSaveVoiceConfig({
      ...voiceConfig,
      sttEndpoint,
      ttsEndpoint,
      voiceId,
      speed: voiceSpeed,
      autoSpeak,
      enableInterruption
    });
    onSavePaletteId(selectedPalette);
    onSaveTheme(selectedThemeMode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>Preferences</span>
            </h2>
            <p className="text-[13.5px] sm:text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Tune the connection and behavior of your local model • Developed by Bikash Talukder
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b px-6" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--sidebar-bg)' }}>
          <button
            onClick={() => setActiveTab('model')}
            className={`py-3.5 px-4 text-[13.5px] font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'model'
                ? 'border-[var(--c1)] text-[var(--c1)]'
                : 'border-transparent hover:opacity-80'
            }`}
            style={{ color: activeTab === 'model' ? 'var(--c1)' : 'var(--text-muted)' }}
          >
            <Server className="w-4.5 h-4.5" />
            <span>Local Model</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`py-3.5 px-4 text-[13.5px] font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'voice'
                ? 'border-[var(--c1)] text-[var(--c1)]'
                : 'border-transparent hover:opacity-80'
            }`}
            style={{ color: activeTab === 'voice' ? 'var(--c1)' : 'var(--text-muted)' }}
          >
            <Volume2 className="w-4.5 h-4.5" />
            <span>Swasti 🌸 Voice</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`py-3.5 px-4 text-[13.5px] font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'theme'
                ? 'border-[var(--c1)] text-[var(--c1)]'
                : 'border-transparent hover:opacity-80'
            }`}
            style={{ color: activeTab === 'theme' ? 'var(--c1)' : 'var(--text-muted)' }}
          >
            <Palette className="w-4.5 h-4.5" />
            <span>Color Palettes</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-[14.5px]">
          {/* TAB 1: LOCAL MODEL & SWASTI PERSONA */}
          {activeTab === 'model' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Ollama Server URL
                </label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none text-[15px] font-mono"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
                <p className="mt-2 text-[13px] sm:text-[13.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Use <code className="px-2 py-0.5 rounded font-mono text-[12px] border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--c1)' }}>http://YOUR-LAN-IP:11434</code> to chat with Ollama on your local network. Start with{' '}
                  <code className="px-2 py-0.5 rounded font-mono text-[12px] border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--c1)' }}>OLLAMA_HOST=0.0.0.0 ollama serve</code>.
                </p>

                <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setOllamaUrl('http://127.0.0.1:11434')}
                    className="px-3.5 py-2 rounded-xl border text-[13px] font-semibold transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    Use 127.0.0.1
                  </button>
                  <button
                    type="button"
                    onClick={() => setOllamaUrl('http://localhost:11434')}
                    className="px-3.5 py-2 rounded-xl border text-[13px] font-semibold transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    Use localhost
                  </button>
                  <button
                    type="button"
                    onClick={handleTestOllamaConnection}
                    disabled={testingOllama}
                    className="px-4 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 text-white shadow-sm"
                    style={{ backgroundColor: 'var(--c1)' }}
                  >
                    {testingOllama && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>Test connection</span>
                  </button>
                </div>

                {typeof window !== 'undefined' && window.location.protocol === 'https:' && (
                  <div
                    className="mt-3 p-3 rounded-xl text-[12.5px] border leading-relaxed"
                    style={{
                      backgroundColor: 'rgba(232, 65, 44, 0.1)',
                      borderColor: 'var(--c3)',
                      color: 'var(--c3)'
                    }}
                  >
                    <strong>🔒 HTTPS Notice:</strong> Browsers block HTTPS pages from accessing insecure <code className="font-mono">http://localhost</code> endpoints (Mixed Content). To connect directly to your local Ollama and local Kokoro voices, run Swasti locally via <code className="font-mono">./start.sh</code> at <code className="font-mono">http://localhost:5173</code>.
                  </div>
                )}

                {ollamaTestResult && (
                  <div
                    className="mt-3 p-3 rounded-xl text-[13.5px] font-medium border"
                    style={{
                      backgroundColor: ollamaTestResult.success ? 'rgba(156, 175, 136, 0.15)' : 'rgba(232, 65, 44, 0.15)',
                      borderColor: ollamaTestResult.success ? 'var(--c1)' : 'var(--c3)',
                      color: ollamaTestResult.success ? 'var(--c1)' : 'var(--c3)'
                    }}
                  >
                    {ollamaTestResult.msg}
                  </div>
                )}
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Active Local Model Engine
                </label>
                {availableModels.length > 0 ? (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border focus:outline-none text-[15px] font-mono"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {availableModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    placeholder="e.g. llama3, mistral, deepseek-r1:8b"
                    className="w-full px-4 py-2.5 rounded-xl border focus:outline-none text-[15px] font-mono"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  />
                )}
              </div>

              {/* Temperature */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Temperature ({temperature})
                  </label>
                  <span className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {temperature <= 0.3 ? 'Deterministic & Precise' : temperature <= 0.8 ? 'Balanced & Natural' : 'Creative & Expressive'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: 'var(--c1)' }}
                />
              </div>

              {/* Swasti System Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Swasti 🌸 Persona & Knowledge System Prompt
                  </label>
                  <button
                    type="button"
                    onClick={handleResetToSwastiPrompt}
                    className="text-[13px] font-bold underline hover:opacity-80"
                    style={{ color: 'var(--c1)' }}
                  >
                    Reset to Swasti 🌸 Default
                  </button>
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none text-[13.5px] font-mono leading-relaxed resize-none"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: SWASTI VOICE */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Swasti 🌸 Voice (STT) Endpoint
                </label>
                <input
                  type="text"
                  value={sttEndpoint}
                  onChange={(e) => setSttEndpoint(e.target.value)}
                  placeholder="http://localhost:5005/transcribe"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none text-[15px] font-mono"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Swasti 🌸 Voice (TTS) Endpoint
                </label>
                <input
                  type="text"
                  value={ttsEndpoint}
                  onChange={(e) => setTtsEndpoint(e.target.value)}
                  placeholder="http://localhost:5006/speak"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none text-[15px] font-mono"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
                <p className="mt-2 text-[13px] sm:text-[13.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  The offline voice server runs locally via <code className="px-2 py-0.5 rounded font-mono text-[12px] border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--c1)' }}>voice_server.py</code>.
                </p>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleTestVoiceServer}
                    disabled={testingVoice}
                    className="px-4 py-2 rounded-xl border text-[13.5px] font-bold flex items-center gap-2 transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {testingVoice && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>Test Swasti 🌸 Voice Server</span>
                  </button>
                </div>

                {voiceTestResult && (
                  <div
                    className="mt-3 p-3 rounded-xl text-[13.5px] font-medium border"
                    style={{
                      backgroundColor: voiceTestResult.success ? 'rgba(156, 175, 136, 0.15)' : 'rgba(232, 65, 44, 0.15)',
                      borderColor: voiceTestResult.success ? 'var(--c1)' : 'var(--c3)',
                      color: voiceTestResult.success ? 'var(--c1)' : 'var(--c3)'
                    }}
                  >
                    {voiceTestResult.msg}
                  </div>
                )}
              </div>

              {/* Swasti Voice Profiles */}
              <div>
                <label className="block text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Swasti 🌸 Voice Profile
                </label>
                <select
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none text-[15px] font-medium"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {SWASTI_VOICE_PROFILES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.gender}, {v.accent}) - {v.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Speed Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Speech Speed ({voiceSpeed}x)
                  </label>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: 'var(--c1)' }}
                />
              </div>

              {/* Toggles */}
              <div className="pt-3 border-t space-y-3.5" style={{ borderColor: 'var(--border-color)' }}>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>Auto-read Swasti 🌸 responses aloud</span>
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(e) => setAutoSpeak(e.target.checked)}
                    className="w-4.5 h-4.5 rounded cursor-pointer"
                    style={{ accentColor: 'var(--c1)' }}
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-[14px] font-medium block" style={{ color: 'var(--text-primary)' }}>Voice Interruption</span>
                    <span className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>Speaking will immediately pause Swasti 🌸 playback</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableInterruption}
                    onChange={(e) => setEnableInterruption(e.target.checked)}
                    className="w-4.5 h-4.5 rounded cursor-pointer"
                    style={{ accentColor: 'var(--c3)' }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: COLOR PALETTES */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div>
                <label className="block text-[13px] font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
                  Theme Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['dark', 'light', 'system'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedThemeMode(m)}
                      className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all font-bold text-[13.5px] ${
                        selectedThemeMode === m ? 'ring-2' : 'hover:opacity-80'
                      }`}
                      style={{
                        backgroundColor: 'var(--sidebar-bg)',
                        borderColor: selectedThemeMode === m ? 'var(--c1)' : 'var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span className="capitalize">{m === 'system' ? 'System Auto' : `${m} Mode`}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Active Color Palettes */}
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <label className="block text-[13px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                  Active Color Palette (All 3 Colors Active)
                </label>

                <div className="space-y-3">
                  {(Object.keys(COLOR_PALETTES) as ColorPaletteId[]).map((pid) => {
                    const pal = COLOR_PALETTES[pid];
                    const isSelected = selectedPalette === pid;

                    return (
                      <div
                        key={pid}
                        onClick={() => setSelectedPalette(pid)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected ? 'ring-2 shadow-md' : 'hover:opacity-90'
                        }`}
                        style={{
                          backgroundColor: 'var(--sidebar-bg)',
                          borderColor: isSelected ? pal.c1.hex : 'var(--border-color)'
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-[15.5px] font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                              {pal.name}
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] uppercase font-bold text-white" style={{ backgroundColor: pal.c1.hex }}>
                                  Active
                                </span>
                              )}
                            </h4>
                            <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{pal.subtitle}</p>
                          </div>
                          {isSelected && <Check className="w-5 h-5" style={{ color: pal.c1.hex }} />}
                        </div>

                        {/* All 3 Colors Visibly Active */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div
                            className="p-3 rounded-lg text-[13px] font-bold flex flex-col justify-between h-18 shadow-sm border border-black/10"
                            style={{ backgroundColor: pal.c1.hex, color: pid === 'mocha-rose' ? '#FFFFFF' : '#11121A' }}
                          >
                            <span>{pal.c1.name}</span>
                            <span className="font-mono text-[11.5px] opacity-80">{pal.c1.hex}</span>
                          </div>

                          <div
                            className="p-3 rounded-lg text-[13px] font-bold flex flex-col justify-between h-18 shadow-sm border border-black/10"
                            style={{ backgroundColor: pal.c2.hex, color: '#11121A' }}
                          >
                            <span>{pal.c2.name}</span>
                            <span className="font-mono text-[11.5px] opacity-80">{pal.c2.hex}</span>
                          </div>

                          <div
                            className="p-3 rounded-lg text-[13px] font-bold flex flex-col justify-between h-18 shadow-sm border border-black/10"
                            style={{ backgroundColor: pal.c3.hex, color: '#FFFFFF' }}
                          >
                            <span>{pal.c3.name}</span>
                            <span className="font-mono text-[11.5px] opacity-80">{pal.c3.hex}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Developer Credit */}
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--sidebar-bg)' }}>
          <p className="text-[13px] flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>
            <span>Created by</span>
            <strong className="font-bold" style={{ color: 'var(--c1)' }}>Bikash Talukder</strong>
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[13.5px] font-semibold transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-[13.5px] font-bold text-white shadow-md transition-all hover:scale-[1.02]"
              style={{ backgroundColor: 'var(--c1)' }}
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
