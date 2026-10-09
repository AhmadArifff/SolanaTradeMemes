'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Key,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Cpu,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  AiProviderType,
  AiModelConfig,
  PROVIDER_DEFAULT_MODELS,
} from '../services/AiProviderService';

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: AiModelConfig | null) => void;
}

export const AI_CONFIG_STORAGE_KEY = 'solana_terminal_ai_config';

export function getStoredAiConfig(): AiModelConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AiConfigModal({
  isOpen,
  onClose,
  onConfigSaved,
}: AiConfigModalProps) {
  const [provider, setProvider] = useState<AiProviderType>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(PROVIDER_DEFAULT_MODELS.gemini.defaultModel);
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Load existing config
  useEffect(() => {
    const stored = getStoredAiConfig();
    if (stored) {
      setProvider(stored.provider);
      setApiKey(stored.apiKey);
      setModel(stored.model);
      if (stored.customBaseUrl) setCustomBaseUrl(stored.customBaseUrl);
    }
  }, [isOpen]);

  // Update model when provider changes
  const handleProviderChange = (newProvider: AiProviderType) => {
    setProvider(newProvider);
    setModel(PROVIDER_DEFAULT_MODELS[newProvider].defaultModel);
    setStatusMessage(null);
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      setStatusMessage({ type: 'error', text: 'Kunci API wajib diisi.' });
      return;
    }

    const newConfig: AiModelConfig = {
      provider,
      apiKey: apiKey.trim(),
      model,
      customBaseUrl: customBaseUrl.trim() || undefined,
    };

    try {
      localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
      setStatusMessage({ type: 'success', text: 'Konfigurasi AI berhasil disimpan!' });
      if (onConfigSaved) onConfigSaved(newConfig);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch {
      setStatusMessage({ type: 'error', text: 'Gagal menyimpan ke penyimpanan lokal.' });
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
      setApiKey('');
      setStatusMessage({ type: 'success', text: 'Kunci API telah dihapus dari peramban.' });
      if (onConfigSaved) onConfigSaved(null);
    } catch {
      // Ignore
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setStatusMessage({ type: 'error', text: 'Masukkan API Key sebelum menguji koneksi.' });
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    try {
      if (provider === 'gemini') {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Respond with: "OK"' }] }],
            }),
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}: Gagal terhubung ke Gemini.`);
      } else {
        let baseUrl = 'https://api.openai.com/v1';
        if (provider === 'deepseek') baseUrl = 'https://api.deepseek.com';
        if (provider === 'kimi') baseUrl = 'https://api.moonshot.cn/v1';
        if (provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1';
        if (provider === 'groq') baseUrl = 'https://api.groq.com/openai/v1';
        if (customBaseUrl.trim()) baseUrl = customBaseUrl.trim();

        const res = await fetch(`${baseUrl}/models`, {
          headers: { Authorization: `Bearer ${apiKey.trim()}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: Kunci tidak valid atau endpoint menolak.`);
      }

      setStatusMessage({ type: 'success', text: 'Koneksi ke Provider AI Berhasil!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi gagal.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-zinc-900/60 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pengaturan Provider AI (BYOK)</h3>
              <p className="text-[11px] text-zinc-400">Hubungkan API Key resmi Anda (Client-Side Only)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Provider Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Pilih Layanan AI Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(PROVIDER_DEFAULT_MODELS) as AiProviderType[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleProviderChange(p)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    provider === p
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 font-bold shadow-sm'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                  }`}
                >
                  <div className="truncate">{PROVIDER_DEFAULT_MODELS[p].label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Pilih Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              {PROVIDER_DEFAULT_MODELS[provider].models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                API Key ({PROVIDER_DEFAULT_MODELS[provider].label})
              </label>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
              >
                {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showKey ? 'Sembunyikan' : 'Lihat'}
              </button>
            </div>
            <div className="relative">
              <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showKey ? 'text' : 'password'}
                placeholder={`Masukkan API Key ${PROVIDER_DEFAULT_MODELS[provider].label}...`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              Kunci disimpan aman di peramban lokal Anda dan tidak pernah dikirim ke backend kami.
            </p>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-medium rounded-xl border border-zinc-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              Uji Koneksi
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-md transition-all text-center"
            >
              Simpan Konfigurasi
            </button>

            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                title="Hapus Kunci"
                className="p-2 bg-zinc-900 hover:bg-rose-950/40 hover:text-rose-400 text-zinc-500 rounded-xl border border-zinc-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
