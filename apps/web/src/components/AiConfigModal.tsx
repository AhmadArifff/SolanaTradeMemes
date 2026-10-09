'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bot,
  Key,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Search,
  Sparkles,
  Sliders,
  Check,
  ChevronDown,
  Info,
} from 'lucide-react';
import {
  AiProviderType,
  AiModelConfig,
  DiscoveredAiModel,
  AiProviderService,
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

function formatTokens(tokens?: number): string {
  if (!tokens) return '';
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M ctx`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}k ctx`;
  return `${tokens} ctx`;
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
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<DiscoveredAiModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Helper load cached models for provider
  const loadCachedModels = useCallback((p: AiProviderType) => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`solana_terminal_cached_models_${p}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    // Fallback default models
    return (PROVIDER_DEFAULT_MODELS[p]?.models || []).map((id) => ({
      id,
      name: id,
      isRecommended: true,
    }));
  }, []);

  // Fetch real-time models using user's API Key
  const handleFetchModels = useCallback(
    async (targetProvider: AiProviderType, targetKey: string, targetBaseUrl?: string, silent = false) => {
      const trimmedKey = targetKey.trim();
      if (!trimmedKey && targetProvider !== 'openrouter') {
        if (!silent) {
          setStatusMessage({
            type: 'error',
            text: `Masukkan API Key ${PROVIDER_DEFAULT_MODELS[targetProvider].label} untuk menarik model real-time.`,
          });
        }
        return;
      }

      setIsFetchingModels(true);
      if (!silent) setStatusMessage(null);

      try {
        const fetched = await AiProviderService.fetchAvailableModels(
          targetProvider,
          trimmedKey,
          targetBaseUrl?.trim() || undefined
        );

        if (fetched.length > 0) {
          setAvailableModels(fetched);
          try {
            localStorage.setItem(
              `solana_terminal_cached_models_${targetProvider}`,
              JSON.stringify(fetched)
            );
          } catch {
            // Ignore storage quota
          }

          // If current model is not in fetched, select the first recommended or first item
          const exists = fetched.some((m) => m.id === model);
          if (!exists) {
            const recommended = fetched.find((m) => m.isRecommended) || fetched[0];
            if (recommended) setModel(recommended.id);
          }

          if (!silent) {
            setStatusMessage({
              type: 'success',
              text: `Berhasil sinkronisasi ${fetched.length} model aktif untuk akun Anda!`,
            });
          }
        } else {
          if (!silent) {
            setStatusMessage({
              type: 'info',
              text: 'Tidak ada model khusus ditemukan, menggunakan daftar standar.',
            });
          }
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Gagal mengambil daftar model.';
        if (!silent) {
          setStatusMessage({ type: 'error', text: errMsg });
        }
      } finally {
        setIsFetchingModels(false);
      }
    },
    [model]
  );

  // Load existing config on open
  useEffect(() => {
    if (!isOpen) return;
    const stored = getStoredAiConfig();
    if (stored) {
      setProvider(stored.provider);
      setApiKey(stored.apiKey);
      setModel(stored.model);
      if (stored.customBaseUrl) setCustomBaseUrl(stored.customBaseUrl);

      // Load cached models or fetch
      const cached = loadCachedModels(stored.provider);
      setAvailableModels(cached);
    } else {
      const initialModels = loadCachedModels('gemini');
      setAvailableModels(initialModels);
    }
  }, [isOpen, loadCachedModels]);

  // Provider change handler
  const handleProviderChange = (newProvider: AiProviderType) => {
    setProvider(newProvider);
    setStatusMessage(null);
    setSearchQuery('');
    setIsDropdownOpen(false);

    const cached = loadCachedModels(newProvider);
    setAvailableModels(cached);

    const defaultTarget = cached[0]?.id || PROVIDER_DEFAULT_MODELS[newProvider].defaultModel;
    setModel(defaultTarget);

    // If API key is present, auto-fetch live models in background
    if (apiKey.trim()) {
      handleFetchModels(newProvider, apiKey, customBaseUrl, true);
    }
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      setStatusMessage({ type: 'error', text: 'Kunci API wajib diisi.' });
      return;
    }

    const newConfig: AiModelConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
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
      localStorage.removeItem(`solana_terminal_cached_models_${provider}`);
      setApiKey('');
      setAvailableModels(loadCachedModels(provider));
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
      // Fetch models simultaneously to test authentication and refresh models
      await handleFetchModels(provider, apiKey, customBaseUrl, false);
      setStatusMessage({ type: 'success', text: 'Koneksi Berhasil! Model real-time telah diperbarui.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi gagal.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsTesting(false);
    }
  };

  // Filtered models by search query
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return availableModels;
    const q = searchQuery.toLowerCase();
    return availableModels.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
    );
  }, [availableModels, searchQuery]);

  const selectedModelDetail = useMemo(() => {
    return availableModels.find((m) => m.id === model);
  }, [availableModels, model]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 font-sans flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-zinc-900/70 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Pengaturan Provider AI (BYOK)
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
                  Real-Time Sync
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">Model otomatis ditarik langsung dari kuota paket API Key Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* Provider Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Pilih Layanan AI Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
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
                  <div className="truncate text-[11px]">{PROVIDER_DEFAULT_MODELS[p].label}</div>
                </button>
              ))}
            </div>
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
                onBlur={() => {
                  if (apiKey.trim() && availableModels.length <= 3) {
                    handleFetchModels(provider, apiKey, customBaseUrl, true);
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-500">
              <span>Tersimpan aman secara lokal di peramban (zero server leak).</span>
              {apiKey.trim() && (
                <button
                  type="button"
                  onClick={() => handleFetchModels(provider, apiKey, customBaseUrl, false)}
                  disabled={isFetchingModels}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                  Tarik Model Real-Time
                </button>
              )}
            </div>
          </div>

          {/* Model Selection with Real-Time Fetching */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Model Aktif</span>
                <span className="text-[10px] text-cyan-400 font-mono font-normal">
                  ({availableModels.length} model terdeteksi)
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualInput(!isManualInput)}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" />
                  {isManualInput ? 'Pilih dari List' : 'Input Manual'}
                </button>
                <button
                  type="button"
                  onClick={() => handleFetchModels(provider, apiKey, customBaseUrl, false)}
                  disabled={isFetchingModels || (!apiKey.trim() && provider !== 'openrouter')}
                  title="Perbarui daftar model langsung dari API provider"
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 disabled:opacity-40"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                  {isFetchingModels ? 'Memuat...' : 'Refresh'}
                </button>
              </div>
            </div>

            {isManualInput ? (
              <div>
                <input
                  type="text"
                  placeholder="Ketik Model ID kustom (misal: gemini-2.0-flash-exp, deepseek-chat, gpt-4o)..."
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Mode manual: Masukkan model identifier khusus atau fine-tuned model ID Anda.
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Custom searchable selector */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-left flex items-center justify-between hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="font-mono text-zinc-100 font-medium truncate">{model}</span>
                    {selectedModelDetail?.contextWindow && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-cyan-300 font-mono shrink-0">
                        {formatTokens(selectedModelDetail.contextWindow)}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-zinc-900 border border-zinc-750 rounded-xl shadow-2xl overflow-hidden p-2">
                    {/* Search filter input */}
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cari model (cth: flash, 4o, r1, claude, sonnet)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
                        autoFocus
                      />
                    </div>

                    {/* Model List */}
                    <div className="max-h-52 overflow-y-auto space-y-1 pr-1 font-mono">
                      {filteredModels.length === 0 ? (
                        <div className="p-3 text-center text-zinc-500 text-[11px]">
                          Tidak ada model yang cocok dengan kata kunci &quot;{searchQuery}&quot;
                        </div>
                      ) : (
                        filteredModels.map((m) => {
                          const isSelected = m.id === model;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setModel(m.id);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                                isSelected
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : 'hover:bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              <div className="truncate mr-2">
                                <div className="font-semibold truncate flex items-center gap-1.5">
                                  <span>{m.name || m.id}</span>
                                  {m.isRecommended && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-sans">
                                      Unggulan
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-zinc-500 truncate">{m.id}</div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {m.contextWindow && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                    {formatTokens(m.contextWindow)}
                                  </span>
                                )}
                                {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Model Details Micro-Panel */}
            {selectedModelDetail && (
              <div className="mt-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="font-semibold text-white flex items-center gap-1">
                    <Info className="w-3 h-3 text-cyan-400" />
                    {selectedModelDetail.name || selectedModelDetail.id}
                  </span>
                  {selectedModelDetail.contextWindow && (
                    <span className="font-mono text-cyan-300 text-[10px]">
                      Kapasitas: {selectedModelDetail.contextWindow.toLocaleString()} token
                    </span>
                  )}
                </div>
                {selectedModelDetail.description && (
                  <p className="text-[10px] text-zinc-400 line-clamp-2">
                    {selectedModelDetail.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Custom Base URL (Optional) */}
          {(provider === 'openrouter' || provider === 'groq') && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Custom Base URL (Opsional)
              </label>
              <input
                type="text"
                placeholder="https://api.openai.com/v1"
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : statusMessage.type === 'info'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : statusMessage.type === 'info' ? (
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
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
              disabled={isTesting || isFetchingModels}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-medium rounded-xl border border-zinc-700 flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting || isFetchingModels ? 'animate-spin' : ''}`} />
              Uji &amp; Sinkron
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
