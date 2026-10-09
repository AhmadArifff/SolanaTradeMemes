'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Flame,
  TrendingDown,
  TrendingUp,
  X,
  Move,
  AlertTriangle,
  Zap,
  Globe,
  Twitter,
  MessageCircle,
  Percent,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Bot,
  Settings,
  Scale,
  Sparkles,
  Coins,
  Clock,
  DollarSign,
  AlertOctagon,
} from 'lucide-react';
import type { TokenSafetyMetrics, TokenAboutInfo } from '../hooks/useTokenIntelligence';
import { formatSmartPrice } from './TokenCandlestickChart';
import {
  AiProviderService,
  AiAnalysisResult,
  AiModelConfig,
  PROVIDER_DEFAULT_MODELS,
} from '../services/AiProviderService';
import {
  AiConfigModal,
  getStoredAiConfig,
} from './AiConfigModal';

interface TokenAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenSymbol: string;
  tokenName: string;
  tokenMint: string;
  currentPriceUsd: number;
  safetyMetrics: TokenSafetyMetrics;
  aboutInfo: TokenAboutInfo | null;
  onPanicSellTrigger?: () => void;
}

interface BacktestLogEntry {
  id: string;
  timestamp: number;
  tokenSymbol: string;
  entryPrice: number;
  score: number;
  verdict: string;
  discountTarget: string;
  aiScore?: number;
}

export function TokenAnalyzerModal({
  isOpen,
  onClose,
  tokenSymbol,
  tokenName,
  tokenMint,
  currentPriceUsd,
  safetyMetrics,
  aboutInfo,
  onPanicSellTrigger,
}: TokenAnalyzerModalProps) {
  // Draggable State
  const [position, setPosition] = useState({ x: 40, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Tab View: 'rule' | 'ai' | 'compare'
  const [activeTab, setActiveTab] = useState<'compare' | 'rule' | 'ai'>('compare');

  // AI Configuration & Result
  const [isAiConfigOpen, setIsAiConfigOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState<AiModelConfig | null>(null);
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Backtest Local Storage
  const [backtestLogs, setBacktestLogs] = useState<BacktestLogEntry[]>([]);
  const [logSavedNotice, setLogSavedNotice] = useState(false);

  // Load existing AI Config and Backtest logs
  useEffect(() => {
    setAiConfig(getStoredAiConfig());
    try {
      const saved = localStorage.getItem('token_analyzer_backtest_logs');
      if (saved) setBacktestLogs(JSON.parse(saved));
    } catch {
      // Ignore
    }
  }, [isOpen]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const maxX = Math.max(10, window.innerWidth - 380);
    const maxY = Math.max(10, window.innerHeight - 150);
    setPosition({
      x: Math.max(10, Math.min(maxX, dragRef.current.initialX + dx)),
      y: Math.max(10, Math.min(maxY, dragRef.current.initialY + dy)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const resetPosition = () => {
    setPosition({ x: 40, y: 80 });
  };

  // Run AI Analysis
  const handleRunAiAnalysis = useCallback(async () => {
    const config = aiConfig || getStoredAiConfig();
    if (!config || !config.apiKey) {
      setIsAiConfigOpen(true);
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      const result = await AiProviderService.analyzeTokenWithAi(config, {
        tokenName,
        tokenSymbol,
        mintAddress: tokenMint,
        description: aboutInfo?.description || 'No description provided.',
        websites: aboutInfo?.websites || [],
        twitterUrl: aboutInfo?.twitter || null,
        telegramUrl: aboutInfo?.telegram || null,
        currentPriceUsd,
        marketCapUsd: safetyMetrics.athMarketCap,
        liquidityUsd: 30000,
        volume24h: 50000,
        devHoldingPercent: safetyMetrics.devHoldingPercent,
        top10ConcentrationPercent: safetyMetrics.top10ConcentrationPercent,
      });

      setAiResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menjalankan analisis AI.';
      setAiError(msg);
    } finally {
      setIsAiLoading(false);
    }
  }, [aiConfig, tokenName, tokenSymbol, tokenMint, aboutInfo, currentPriceUsd, safetyMetrics]);

  const saveBacktestEntry = () => {
    const newEntry: BacktestLogEntry = {
      id: `bt-${Date.now()}`,
      timestamp: Date.now(),
      tokenSymbol,
      entryPrice: currentPriceUsd,
      score: safetyMetrics.score,
      verdict: safetyMetrics.category,
      discountTarget: safetyMetrics.isDiscount70Zone
        ? 'Discount -70% Deep Dip'
        : safetyMetrics.isDiscount50Zone
          ? 'Discount -50% Zone'
          : 'Normal Zone',
      aiScore: aiResult?.narrativeAuthenticityScore,
    };
    const updated = [newEntry, ...backtestLogs.slice(0, 19)];
    setBacktestLogs(updated);
    try {
      localStorage.setItem('token_analyzer_backtest_logs', JSON.stringify(updated));
    } catch {
      // Ignore
    }
    setLogSavedNotice(true);
    setTimeout(() => setLogSavedNotice(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={modalRef}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
        }}
        className="w-[96vw] sm:w-[620px] max-w-[680px] bg-zinc-950/95 border border-zinc-700/80 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-zinc-100 transition-shadow select-none animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Draggable Header */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 border-b border-zinc-800 cursor-move touch-none"
        >
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Token Intelligence & Risk Comparison
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsAiConfigOpen(true)}
              title="Konfigurasi AI Provider (BYOK)"
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-cyan-300 text-[10px] font-semibold flex items-center gap-1 transition-colors"
            >
              <Settings className="w-3 h-3 text-cyan-400" />
              <span>{aiConfig ? PROVIDER_DEFAULT_MODELS[aiConfig.provider].label : 'Set AI Key'}</span>
            </button>
            <button
              onClick={resetPosition}
              title="Reset Posisi Modal"
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              title="Tutup Modal"
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Segmented Bar */}
        <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 bg-zinc-950/60 p-1 rounded-xl border border-zinc-800/80">
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-all flex items-center gap-1.5 ${
                activeTab === 'compare'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Scale className="w-3 h-3 text-cyan-400" />
              Side-by-Side
            </button>

            <button
              onClick={() => setActiveTab('rule')}
              className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-all flex items-center gap-1.5 ${
                activeTab === 'rule'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              Rule-Based (On-Chain)
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-all flex items-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Bot className="w-3 h-3 text-purple-400" />
              Deep AI Audit
            </button>
          </div>

          <div className="text-[11px] font-mono text-zinc-400">
            ${formatSmartPrice(currentPriceUsd)}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 overflow-y-auto max-h-[72vh] space-y-4 font-sans text-xs">
          {/* Critical Dump Emergency Alert */}
          {safetyMetrics.isCriticalDump && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border-2 border-rose-500/80 text-rose-200 animate-pulse flex flex-col gap-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold uppercase">
                <AlertTriangle className="w-5 h-5" />
                PERINGATAN KRITIS: CRITICAL DUMP TERDETEKSI!
              </div>
              <div className="text-[11px] leading-relaxed">
                Harga token anjlok <span className="font-bold underline text-white">{safetyMetrics.currentDrawdownPercent}%</span> dari titik All-Time High ({Math.round(safetyMetrics.athMarketCap / 1000)}K MC) dengan indikasi pelemahan akut!
              </div>
              {onPanicSellTrigger && (
                <button
                  onClick={onPanicSellTrigger}
                  className="mt-1 w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold uppercase rounded-lg shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 text-xs transition-all"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Lakukan Panic Sell All (Keluar Sekarang)
                </button>
              )}
            </div>
          )}

          {/* VIEW 1: COMPARISON MODE (SIDE-BY-SIDE) */}
          {activeTab === 'compare' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Column A: Rule-Based Logic (On-Chain Hard Numbers) */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase text-[11px]">
                      <Zap className="w-3.5 h-3.5" /> Mode A: Rule-Based Logic
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">Latensi &lt; 5ms</span>
                  </div>

                  {/* Safety Score Meter */}
                  <div className="flex items-center justify-between bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase">On-Chain Safety</div>
                      <div className="text-base font-black text-emerald-400 font-mono">
                        {safetyMetrics.score}/100
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] rounded-md font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {safetyMetrics.category.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Hard On-Chain Metrics */}
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between py-1 border-b border-zinc-800/40">
                      <span className="text-zinc-400">Dev Holding:</span>
                      <span className={`font-mono font-semibold ${safetyMetrics.devHoldingPercent > 10 ? 'text-rose-400' : 'text-zinc-200'}`}>
                        {safetyMetrics.devHoldingPercent}%
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800/40">
                      <span className="text-zinc-400">Top 10 Monopoli:</span>
                      <span className={`font-mono font-semibold ${safetyMetrics.top10ConcentrationPercent > 40 ? 'text-rose-400' : 'text-zinc-200'}`}>
                        {safetyMetrics.top10ConcentrationPercent}%
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800/40">
                      <span className="text-zinc-400">ATH Discount Zone:</span>
                      <span className="font-mono text-cyan-300 font-semibold">
                        {safetyMetrics.isDiscount70Zone ? 'Diskon -70% Dip' : safetyMetrics.isDiscount50Zone ? 'Diskon -50%' : 'Zona Normal'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-400">Penurunan dari Puncak:</span>
                      <span className={`font-mono font-bold ${safetyMetrics.currentDrawdownPercent <= -70 ? 'text-rose-400' : 'text-amber-400'}`}>
                        {safetyMetrics.currentDrawdownPercent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column B: Deep AI Audit (Semantic LLM) */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-bold text-purple-400 flex items-center gap-1.5 uppercase text-[11px]">
                      <Bot className="w-3.5 h-3.5" /> Mode B: Deep AI Audit
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {aiConfig ? aiConfig.model : 'No Key'}
                    </span>
                  </div>

                  {aiResult ? (
                    <>
                      {/* AI Score */}
                      <div className="flex items-center justify-between bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase">Narrative Score</div>
                          <div className="text-base font-black text-purple-400 font-mono">
                            {aiResult.narrativeAuthenticityScore}/100
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] rounded-md font-bold uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {aiResult.developerRiskAssessment} RISK
                        </span>
                      </div>

                      {/* AI Insights */}
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between py-1 border-b border-zinc-800/40">
                          <span className="text-zinc-400">X/Tweet Hype:</span>
                          <span className="font-semibold text-cyan-300">{aiResult.tweetHypeVerdict}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-800/40">
                          <span className="text-zinc-400">Recycled Meme:</span>
                          <span className={aiResult.isRecycledNarrative ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                            {aiResult.isRecycledNarrative ? 'Ya (Kloningan)' : 'Tidak (Orisinil)'}
                          </span>
                        </div>
                        <div className="py-1">
                          <span className="text-zinc-400 block text-[10px] mb-0.5">AI Summary:</span>
                          <p className="text-[11px] text-zinc-300 italic bg-zinc-950/40 p-1.5 rounded border border-zinc-800/60 leading-tight">
                            "{aiResult.conciseSummary}"
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-6 text-center space-y-2">
                      <p className="text-[11px] text-zinc-400">
                        {aiConfig ? 'Analisis AI siap dijalankan untuk token ini.' : 'Kunci API belum diatur.'}
                      </p>
                      <button
                        onClick={handleRunAiAnalysis}
                        disabled={isAiLoading}
                        className="py-1.5 px-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-lg text-xs shadow-md transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {isAiLoading ? 'Menganalisis...' : 'Jalankan AI Audit'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Combined Synthesis & Verdict */}
              {aiResult && (
                <div className="bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-purple-950/40 p-3.5 rounded-xl border border-cyan-800/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-300 uppercase">
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-cyan-400" />
                      Rangkuman Komparasi Terpadu (Synthesized Advice)
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Tokens: {aiResult.usage.totalTokens} (~${aiResult.usage.estimatedCostUsd})
                    </span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                    <strong className="text-amber-300">Rekomendasi Sniper: </strong>
                    {aiResult.actionableAdvice}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: RULE-BASED ONLY */}
          {activeTab === 'rule' && (
            <div className="space-y-4">
              {/* Verdict Banner */}
              <div
                className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  safetyMetrics.category === 'LEGIT_GEM'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : safetyMetrics.category === 'SPECULATIVE_MEME'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                {safetyMetrics.category === 'LEGIT_GEM' && <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />}
                {safetyMetrics.category === 'SPECULATIVE_MEME' && <Flame className="w-5 h-5 text-amber-400 shrink-0" />}
                {safetyMetrics.category === 'HIGH_RISK_RUG' && <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />}

                <div>
                  <div className="font-bold uppercase tracking-wide text-xs">
                    {safetyMetrics.category === 'LEGIT_GEM' && 'PROYEK BAGUS / ORGANIC GEM'}
                    {safetyMetrics.category === 'SPECULATIVE_MEME' && 'MEME SPEKULATIF TINGGI'}
                    {safetyMetrics.category === 'HIGH_RISK_RUG' && 'RISIKO TINGGI / POTENSI SCAM / RUGPULL'}
                  </div>
                  <div className="text-[11px] opacity-90 leading-tight mt-0.5">
                    {safetyMetrics.category === 'LEGIT_GEM' &&
                      'Distribusi pasokan merata, dev tidak mendominasi, dan jejak komunitas terverifikasi.'}
                    {safetyMetrics.category === 'SPECULATIVE_MEME' &&
                      'Volatilitas tajam, volume fluktuatif, cocok untuk strategi scalping cepat.'}
                    {safetyMetrics.category === 'HIGH_RISK_RUG' &&
                      'Monopoli dev/whale atau penurunan masif tanpa pemulihan. Hindari entry besar!'}
                  </div>
                </div>
              </div>

              {/* ATH & Entry Discount Zones */}
              <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-cyan-400" />
                    Analisis Diskon Entry dari ATH
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    ATH MC: ~${Math.round(safetyMetrics.athMarketCap / 1000)}K
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div
                    className={`p-2 rounded-lg border flex flex-col justify-between ${
                      safetyMetrics.isDiscount50Zone
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/30'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Diskon 50%</span>
                      {safetyMetrics.isDiscount50Zone && <span className="text-[10px] bg-emerald-500/30 px-1 rounded">ZONE AKTIF</span>}
                    </div>
                    <div className="font-mono text-xs font-semibold text-zinc-200 mt-1">
                      ${formatSmartPrice(safetyMetrics.discount50TargetPrice)}
                    </div>
                  </div>

                  <div
                    className={`p-2 rounded-lg border flex flex-col justify-between ${
                      safetyMetrics.isDiscount70Zone
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Diskon 70%</span>
                      {safetyMetrics.isDiscount70Zone && <span className="text-[10px] bg-amber-500/30 px-1 rounded">DEEP DIP</span>}
                    </div>
                    <div className="font-mono text-xs font-semibold text-zinc-200 mt-1">
                      ${formatSmartPrice(safetyMetrics.discount70TargetPrice)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Whale & Dev Concentration */}
              <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                <div className="font-bold text-zinc-200">Struktur Pasokan & Whale Concentration</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                    <div className="text-zinc-500 text-[10px]">Dev Holding</div>
                    <div className={`text-sm font-bold ${safetyMetrics.devHoldingPercent > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {safetyMetrics.devHoldingPercent}%
                    </div>
                  </div>

                  <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                    <div className="text-zinc-500 text-[10px]">Top 10 Concentration</div>
                    <div className={`text-sm font-bold ${safetyMetrics.top10ConcentrationPercent > 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {safetyMetrics.top10ConcentrationPercent}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: DEEP AI AUDIT ONLY */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              {!aiConfig ? (
                <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center space-y-3">
                  <Bot className="w-10 h-10 text-cyan-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Hubungkan Provider AI Anda</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Gunakan API Key Gemini, Claude, OpenAI, DeepSeek, atau Kimi Anda sendiri untuk menganalisis narasi tweet dan orisinalitas memecoin.
                  </p>
                  <button
                    onClick={() => setIsAiConfigOpen(true)}
                    className="py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-md transition-all inline-flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Atur API Key Provider
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Action Bar */}
                  <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <Bot className="w-4 h-4 text-purple-400" />
                        Model Aktif: <span className="font-mono text-cyan-300">{aiConfig.model}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        Provider: {PROVIDER_DEFAULT_MODELS[aiConfig.provider].label}
                      </div>
                    </div>

                    <button
                      onClick={handleRunAiAnalysis}
                      disabled={isAiLoading}
                      className="py-2 px-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isAiLoading ? 'Menganalisis Narasi...' : 'Audit dengan AI'}
                    </button>
                  </div>

                  {aiError && (
                    <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{aiError}</span>
                    </div>
                  )}

                  {aiResult && (
                    <div className="space-y-3 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
                      {/* Quota & Token Meter */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                        <span className="flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          Tokens: {aiResult.usage.totalTokens}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          Latensi: {aiResult.usage.latencyMs}ms
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <DollarSign className="w-3.5 h-3.5" />
                          Est. Biaya: ${aiResult.usage.estimatedCostUsd}
                        </span>
                      </div>

                      {/* AI Key Risks */}
                      {aiResult.keyRisksIdentified.length > 0 && (
                        <div className="space-y-1">
                          <div className="font-bold text-rose-400 uppercase text-[10px]">Faktor Risiko Terdeteksi:</div>
                          <ul className="list-disc list-inside text-[11px] text-zinc-300 space-y-0.5">
                            {aiResult.keyRisksIdentified.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Actionable Advice */}
                      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 text-xs">
                        <div className="font-bold text-cyan-300 mb-1">Rekomendasi Sniper:</div>
                        <p className="text-zinc-200">{aiResult.actionableAdvice}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Backtest & Signal Logger Button */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={saveBacktestEntry}
              className="w-full py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
            >
              <BookmarkCheck className="w-4 h-4" />
              Catat Entry ke Log Backtest ({backtestLogs.length} Entri Tersimpan)
            </button>
          </div>

          {logSavedNotice && (
            <div className="text-center text-[11px] text-emerald-400 font-medium py-1 animate-fade-in">
              ✓ Berhasil dicatat ke database backtest lokal!
            </div>
          )}
        </div>
      </div>

      {/* AI Configuration Modal */}
      <AiConfigModal
        isOpen={isAiConfigOpen}
        onClose={() => setIsAiConfigOpen(false)}
        onConfigSaved={(cfg) => setAiConfig(cfg)}
      />
    </>
  );
}
