'use client';

import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import type { TokenSafetyMetrics, TokenAboutInfo } from '../hooks/useTokenIntelligence';
import { formatSmartPrice } from './TokenCandlestickChart';

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

  // Backtest Local Storage
  const [backtestLogs, setBacktestLogs] = useState<BacktestLogEntry[]>([]);
  const [logSavedNotice, setLogSavedNotice] = useState(false);

  // Load backtest logs
  useEffect(() => {
    try {
      const saved = localStorage.getItem('token_analyzer_backtest_logs');
      if (saved) setBacktestLogs(JSON.parse(saved));
    } catch {
      // Ignore
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag from the header handle
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
    setPosition({
      x: Math.max(10, Math.min(window.innerWidth - 480, dragRef.current.initialX + dx)),
      y: Math.max(10, Math.min(window.innerHeight - 300, dragRef.current.initialY + dy)),
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
    <div
      ref={modalRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
      }}
      className="w-[94vw] sm:w-[500px] bg-zinc-950/95 border border-zinc-700/80 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-zinc-100 transition-shadow select-none animate-in fade-in zoom-in-95 duration-150"
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
            AI Token Intelligence & Risk Analyzer
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
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

      {/* Modal Content Scrollable Body */}
      <div className="p-4 overflow-y-auto max-h-[75vh] space-y-4 font-sans text-xs">
        {/* Token Header Overview */}
        <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
          <div>
            <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
              {tokenName} <span className="text-zinc-400 font-mono">({tokenSymbol})</span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">
              Harga Saat Ini: <span className="text-cyan-300 font-bold">${formatSmartPrice(currentPriceUsd)}</span>
            </div>
          </div>

          {/* Safety Score Meter */}
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <div className="text-[10px] text-zinc-400 uppercase font-mono">Safety Score</div>
              <div
                className={`text-lg font-black font-mono ${
                  safetyMetrics.score >= 75
                    ? 'text-emerald-400'
                    : safetyMetrics.score >= 50
                      ? 'text-amber-400'
                      : 'text-rose-400'
                }`}
              >
                {safetyMetrics.score}/100
              </div>
            </div>

            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 ${
                safetyMetrics.score >= 75
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : safetyMetrics.score >= 50
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-rose-500 bg-rose-500/10 text-rose-400'
              }`}
            >
              {safetyMetrics.score}
            </div>
          </div>
        </div>

        {/* Verdict Badge Banner */}
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

        {/* Critical Dump Emergency Alert */}
        {safetyMetrics.isCriticalDump && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border-2 border-rose-500/80 text-rose-200 animate-pulse flex flex-col gap-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold uppercase">
              <AlertTriangle className="w-5 h-5" />
              PERINGATAN KRITIS: CRITICAL DUMP TERDETEKSI!
            </div>
            <div className="text-[11px] leading-relaxed">
              Harga token anjlok <span className="font-bold underline text-white">{safetyMetrics.currentDrawdownPercent}%</span> dari titik All-Time High ({Math.round(safetyMetrics.athMarketCap / 1000)}K MC) dengan indikasi likuiditas buy mengering. Sangat berisiko menjadi dead token!
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

        {/* ATH & Entry Discount Zones (-50% & -70%) */}
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
            {/* Discount 50% */}
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
              <div className="text-[10px] text-zinc-500 mt-0.5">Area Speculative Rebound</div>
            </div>

            {/* Discount 70% */}
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
              <div className="text-[10px] text-zinc-500 mt-0.5">Area Deep Accumulation</div>
            </div>
          </div>

          <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1">
            <span>Posisi Terhadap ATH:</span>
            <span
              className={`font-mono font-bold ${
                safetyMetrics.currentDrawdownPercent <= -70
                  ? 'text-rose-400'
                  : safetyMetrics.currentDrawdownPercent <= -50
                    ? 'text-amber-400'
                    : 'text-emerald-400'
              }`}
            >
              {safetyMetrics.currentDrawdownPercent}% dari Puncak
            </span>
          </div>
        </div>

        {/* Social Hype & Community Radar */}
        <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 space-y-2">
          <div className="font-bold text-zinc-200 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-cyan-400" />
            Audit Media Sosial & Komunitas
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 flex flex-col items-center gap-1">
              <Twitter className={`w-4 h-4 ${safetyMetrics.hasTwitter ? 'text-sky-400' : 'text-zinc-600'}`} />
              <span className="font-medium">Twitter / X</span>
              {safetyMetrics.hasTwitter ? (
                <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Ada
                </span>
              ) : (
                <span className="text-[9px] text-rose-400 flex items-center gap-0.5">
                  <XCircle className="w-3 h-3" /> Nihil
                </span>
              )}
            </div>

            <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 flex flex-col items-center gap-1">
              <MessageCircle className={`w-4 h-4 ${safetyMetrics.hasTelegram ? 'text-blue-400' : 'text-zinc-600'}`} />
              <span className="font-medium">Telegram</span>
              {safetyMetrics.hasTelegram ? (
                <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Ada
                </span>
              ) : (
                <span className="text-[9px] text-rose-400 flex items-center gap-0.5">
                  <XCircle className="w-3 h-3" /> Nihil
                </span>
              )}
            </div>

            <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 flex flex-col items-center gap-1">
              <Globe className={`w-4 h-4 ${safetyMetrics.hasWebsite ? 'text-emerald-400' : 'text-zinc-600'}`} />
              <span className="font-medium">Website</span>
              {safetyMetrics.hasWebsite ? (
                <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Ada
                </span>
              ) : (
                <span className="text-[9px] text-rose-400 flex items-center gap-0.5">
                  <XCircle className="w-3 h-3" /> Nihil
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Whale & Dev Concentration */}
        <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 space-y-2">
          <div className="font-bold text-zinc-200">Struktur Pasokan & Whale Concentration</div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
              <div className="text-zinc-500 text-[10px]">Dev Holding</div>
              <div
                className={`text-sm font-bold ${
                  safetyMetrics.devHoldingPercent > 10
                    ? 'text-rose-400'
                    : safetyMetrics.devHoldingPercent > 4
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                }`}
              >
                {safetyMetrics.devHoldingPercent}%
              </div>
            </div>

            <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
              <div className="text-zinc-500 text-[10px]">Top 10 Concentration</div>
              <div
                className={`text-sm font-bold ${
                  safetyMetrics.top10ConcentrationPercent > 40
                    ? 'text-rose-400'
                    : safetyMetrics.top10ConcentrationPercent > 25
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                }`}
              >
                {safetyMetrics.top10ConcentrationPercent}%
              </div>
            </div>
          </div>
        </div>

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
  );
}
