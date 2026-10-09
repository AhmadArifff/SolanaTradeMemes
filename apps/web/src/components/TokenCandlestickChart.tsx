'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ExternalLink,
  BarChart3,
  Maximize2,
  RefreshCw,
  Flame,
  Droplets,
  DollarSign,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@repo/ui';
import type { TokenPriceData } from '@repo/types';

interface TokenCandlestickChartProps {
  mintAddress: string;
  tokenData: TokenPriceData | null | undefined;
  isLoading: boolean;
  onRefresh?: () => void;
  onOpenAnalyzer?: () => void;
}

export function formatSmartPrice(price: number): string {
  if (!price || isNaN(price)) return '0.00';
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  if (price >= 0.0001) return price.toFixed(6);
  if (price >= 0.00000001) return price.toFixed(9);
  return price.toExponential(4);
}

export const TokenCandlestickChart: React.FC<TokenCandlestickChartProps> = ({
  mintAddress,
  tokenData,
  isLoading,
  onRefresh,
  onOpenAnalyzer,
}) => {
  const [iframeKey, setIframeKey] = useState(0);

  const handleReloadIframe = () => {
    setIframeKey((prev) => prev + 1);
    if (onRefresh) onRefresh();
  };

  if (!mintAddress || mintAddress.length < 32) {
    return (
      <Card className="w-full bg-zinc-950/80 border-zinc-800/80 font-mono">
        <CardContent className="py-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-center mx-auto text-cyan-400">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-200">
              Grafik Candlestick Real-Time Belum Aktif
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
              Masukkan alamat kontrak (Token Mint CA) pada panel eksekusi untuk memuat grafik lilin interaktif TradingView secara langsung.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const embedUrl = `https://dexscreener.com/solana/${mintAddress}?embed=1&theme=dark&trades=0&info=0`;

  return (
    <Card className="w-full bg-zinc-950/90 border-zinc-800/90 font-mono shadow-2xl overflow-hidden">
      {/* Header Bar: Token Metrics & Live Ticker */}
      <CardHeader className="p-3 sm:p-4 bg-zinc-900/50 border-b border-zinc-800/80 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Sisi Kiri: Simbol & Harga Real-Time */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-base font-bold text-white tracking-wide">
                {tokenData?.symbol || 'TOKEN'}
              </span>
              <span className="text-xs text-zinc-400 hidden sm:inline truncate max-w-[140px]">
                {tokenData?.name}
              </span>
            </div>

            {tokenData && (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                <span className="text-sm font-extrabold text-cyan-300">
                  ${formatSmartPrice(tokenData.priceUsd)}
                </span>
                <span className="text-[11px] text-zinc-400">
                  (~{formatSmartPrice(tokenData.priceSol)} SOL)
                </span>
              </div>
            )}
          </div>

          {/* Sisi Kanan: Tautan Eksternal & Aksi */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={handleReloadIframe}
              title="Muat ulang grafik"
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <a
              href={`https://pump.fun/coin/${mintAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <Flame className="w-3 h-3 text-emerald-400" />
              Pump.fun ↗
            </a>
            <a
              href={`https://dexscreener.com/solana/${mintAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              DexScreener ↗
            </a>
          </div>
        </div>

        {/* Baris Kedua: Metrik Likuiditas, Volume, & Perubahan 24 Jam */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
          {tokenData ? (
            <>
              {tokenData.priceChange24h !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                    tokenData.priceChange24h >= 0
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                      : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                  }`}
                >
                  {tokenData.priceChange24h >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {tokenData.priceChange24h >= 0 ? '+' : ''}
                  {tokenData.priceChange24h.toFixed(2)}%
                </span>
              )}

              {tokenData.liquidityUsd !== undefined && (
                <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-cyan-400" />
                  Liq: ${(tokenData.liquidityUsd / 1000).toFixed(1)}K
                </span>
              )}

              {tokenData.marketCapUsd !== undefined && (
                <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800">
                  MCap: ${(tokenData.marketCapUsd / 1000).toFixed(1)}K
                </span>
              )}

              {tokenData.volume24h !== undefined && (
                <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800 hidden sm:inline">
                  Vol 24h: ${(tokenData.volume24h / 1000).toFixed(1)}K
                </span>
              )}
            </>
          ) : (
            <span className="text-zinc-500 text-[10px] animate-pulse">Memuat data live DexScreener...</span>
          )}

          {onOpenAnalyzer && (
            <button
              type="button"
              onClick={onOpenAnalyzer}
              className="px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:via-cyan-500/30 hover:to-emerald-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 shadow-sm shadow-amber-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Buka Modal Analisis Token (Hype, Socials, Safety Score, Diskon ATH & AI Audit)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              Analyze Token
            </button>
          )}
        </div>
      </CardHeader>

      {/* Jendela Grafik Iframe DexScreener TradingView Engine */}
      <CardContent className="p-0 bg-zinc-950 relative">
        <div className="w-full h-[480px] sm:h-[520px] lg:h-[560px] relative">
          <iframe
            key={iframeKey}
            src={embedUrl}
            title={`DexScreener Chart for ${mintAddress}`}
            className="w-full h-full border-0 bg-zinc-950"
            allow="clipboard-write"
          />
        </div>
      </CardContent>
    </Card>
  );
};
