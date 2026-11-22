import { useState, useEffect, useCallback, useRef } from 'react';
import { OllamaConfig, Message } from '../types';

export function useOllama(config: OllamaConfig) {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchModels = useCallback(async (customUrl?: string): Promise<{ success: boolean; models: string[]; latency?: number; error?: string }> => {
    const url = (customUrl || config.serverUrl || 'http://localhost:11434').replace(/\/$/, '');
    const startTime = performance.now();
    try {
      const response = await fetch(`${url}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Ollama server returned status ${response.status}`);
      }

      const data = await response.json();
      const modelsList = (data.models || []).map((m: { name: string }) => m.name);
      setAvailableModels(modelsList);
      setIsConnected(true);
      setError(null);
      const latency = Math.round(performance.now() - startTime);
      return { success: true, models: modelsList, latency };
    } catch (err) {
      console.warn('Ollama connection check failed:', err);
      setIsConnected(false);
      const errorMsg = err instanceof Error ? err.message : 'Could not reach Ollama server';
      setError(errorMsg);
      return { success: false, models: [], error: errorMsg };
    }
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

    const activeModel = modelOverride || config.selectedModel || availableModels[0];
    if (!activeModel) {
      setIsGenerating(false);
      const errText = 'No Ollama model selected. Please pull or select a model in Preferences.';
      setError(errText);
      throw new Error(errText);
    }

    const url = (config.serverUrl || 'http://localhost:11434').replace(/\/$/, '');
    abortControllerRef.current = new AbortController();

    const formattedMessages = [
      ...(config.systemPrompt ? [{ role: 'system', content: config.systemPrompt }] : []),
      ...messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    ];

    try {
      const response = await fetch(`${url}/api/chat`, {
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

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Readable stream not supported by response');
      }

      const reader = response.body.getReader();
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
            if (parsed.message?.content) {
              const delta = parsed.message.content;
              fullText += delta;
              onChunk?.(delta);
            }
          } catch {
            // Partial JSON chunk line
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
