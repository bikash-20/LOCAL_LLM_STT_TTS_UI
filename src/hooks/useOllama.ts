import { useState, useEffect, useCallback, useRef } from 'react';
import { OllamaConfig, Message } from '../types';

export function useOllama(config: OllamaConfig) {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const workingUrlRef = useRef<string | null>(null);

  const getCandidateUrls = (targetUrl: string): string[] => {
    const clean = targetUrl.replace(/\/$/, '');
    const list: string[] = [clean];

    // Dual-stack fallback: resolve macOS IPv6 ::1 vs IPv4 127.0.0.1 mismatch.
    // ALWAYS prioritize 127.0.0.1 over localhost because Ollama binds strictly to IPv4 127.0.0.1:11434 on macOS
    if (clean.includes('localhost:11434')) {
      list.unshift(clean.replace('localhost:11434', '127.0.0.1:11434'));
    } else if (clean.includes('127.0.0.1:11434')) {
      list.push(clean.replace('127.0.0.1:11434', 'localhost:11434'));
    }

    // Relative proxy path if served on same local origin
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        list.push(window.location.origin);
      }
    }

    return Array.from(new Set(list));
  };

  const fetchModels = useCallback(async (customUrl?: string): Promise<{ success: boolean; models: string[]; latency?: number; error?: string }> => {
    const rawUrl = (customUrl || config.serverUrl || 'http://127.0.0.1:11434').replace(/\/$/, '');
    const startTime = performance.now();
    const candidates = getCandidateUrls(rawUrl);

    let lastError: Error | null = null;

    for (const target of candidates) {
      try {
        // Do not pass Content-Type header on GET to avoid unnecessary CORS preflight
        const response = await fetch(`${target}/api/tags`, {
          method: 'GET'
        });

        if (response.ok) {
          const data = await response.json();
          const modelsList = (data.models || []).map((m: { name: string }) => m.name);
          setAvailableModels(modelsList);
          setIsConnected(true);
          setError(null);
          workingUrlRef.current = target;
          const latency = Math.round(performance.now() - startTime);
          return { success: true, models: modelsList, latency };
        }
      } catch (err) {
        lastError = err as Error;
      }
    }

    setIsConnected(false);
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    let errorMessage = lastError?.message || 'Could not reach Ollama server';

    if (isHttps) {
      errorMessage = 'Browser Mixed Content Block: HTTPS web apps cannot call insecure local http://localhost:11434. Run Swasti locally at http://localhost:5173 for 100% offline model access.';
    } else if (errorMessage.toLowerCase().includes('failed to fetch')) {
      errorMessage = `Connection refused at ${rawUrl}. Make sure Ollama is running ('ollama serve' or open the Ollama app) and try http://127.0.0.1:11434.`;
    }

    setError(errorMessage);
    return { success: false, models: [], error: errorMessage };
  }, [config.serverUrl]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  const generateStreamingResponse = useCallback(async (
    messages: Message[],
    modelOverride?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    stopGeneration();
    setError(null);
    setIsGenerating(true);

    const isModelValid = !!config.selectedModel && availableModels.includes(config.selectedModel);
    const activeModel = modelOverride || (isModelValid ? config.selectedModel : availableModels[0]);
    if (!activeModel) {
      setIsGenerating(false);
      const errText = 'No Ollama model selected. Please select a model in Preferences.';
      setError(errText);
      throw new Error(errText);
    }

    const rawUrl = (config.serverUrl || 'http://127.0.0.1:11434').replace(/\/$/, '');
    const preferredUrl = workingUrlRef.current || rawUrl;
    const candidates = [preferredUrl, ...getCandidateUrls(rawUrl)];
    const uniqueCandidates = Array.from(new Set(candidates));

    const formattedMessages = [
      ...(config.systemPrompt ? [{ role: 'system', content: config.systemPrompt }] : []),
      ...messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    ];

    abortControllerRef.current = new AbortController();
    let streamResponse: Response | null = null;
    let streamError: Error | null = null;

    for (const target of uniqueCandidates) {
      try {
        const response = await fetch(`${target}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: activeModel,
            messages: formattedMessages,
            stream: true,
            options: {
              temperature: config.temperature ?? 0.7
            }
          }),
          signal: abortControllerRef.current.signal
        });

        if (response.ok && response.body) {
          streamResponse = response;
          workingUrlRef.current = target;
          break;
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          setIsGenerating(false);
          return '';
        }
        streamError = err as Error;
      }
    }

    if (!streamResponse || !streamResponse.body) {
      setIsGenerating(false);
      const errText = streamError?.message || 'Failed to connect to Ollama. Check that Ollama is running.';
      setError(errText);
      throw new Error(errText);
    }

    try {
      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const delta = parsed.message?.content ?? parsed.response ?? '';
            if (delta) {
              fullText += delta;
              onChunk?.(delta);
            }
          } catch {
            // Partial JSON chunk
          }
        }
      }

      setIsGenerating(false);
      return fullText;
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setIsGenerating(false);
        return '';
      }
      const errorMsg = err instanceof Error ? err.message : 'Error generating response';
      setError(errorMsg);
      setIsGenerating(false);
      throw err;
    }
  }, [config.serverUrl, config.selectedModel, config.systemPrompt, config.temperature, availableModels, stopGeneration]);

  return {
    availableModels,
    isConnected,
    isGenerating,
    error,
    fetchModels,
    generateStreamingResponse,
    stopGeneration
  };
}
