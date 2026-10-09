'use client';

import React from 'react';
import type { Connection } from '@solana/web3.js';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Zap,
  Flame,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Badge,
} from '@repo/ui';
import { useTerminalStore } from '../store/useTerminalStore';
import { useTokenPrice } from '../hooks/useTokenPrice';
import { formatSmartPrice } from './TokenCandlestickChart';

interface TradingPanelProps {
  connection: Connection;
  onTradeExecuted: () => void;
  onOpenTokenAnalyzer?: () => void;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({
  connection,
  onTradeExecuted,
  onOpenTokenAnalyzer,
}) => {
  const {
    activeMint,
    setActiveMint,
    tradePreset,
    setTradePreset,
    slippage,
    setSlippage,
    priorityFee,
    setPriorityFee,
    pool,
    setPool,
    wallets,
    isUnlocked,
    isExecuting,
    executeTrade,
    executePanicSell,
  } = useTerminalStore();

  const { data: tokenData, isLoading: isTokenLoading } = useTokenPrice(activeMint);

  const selectedWallets = wallets.filter((w) => w.isSelected);
  const totalBuyAmountSol = (tradePreset * selectedWallets.length).toFixed(4);

  const handleBuy = async () => {
    try {
      await executeTrade(connection, 'buy');
      onTradeExecuted();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Eksekusi transaksi beli gagal');
    }
  };

  const handleSell = async () => {
    try {
      await executeTrade(connection, 'sell');
      onTradeExecuted();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Eksekusi transaksi jual gagal');
    }
  };

  const handlePanicSell = async () => {
    if (
      !confirm(
        `PERINGATAN DARURAT: Likuidasi 100% token ${tokenData?.symbol || 'aktif'} pada ${selectedWallets.length} dompet terpilih sekaligus?`
      )
    ) {
      return;
    }
    try {
      await executePanicSell(connection);
      onTradeExecuted();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Eksekusi Panic Sell gagal');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <CardTitle className="text-sm font-mono tracking-wide">
              Panel Eksekusi Sniper
            </CardTitle>
            {onOpenTokenAnalyzer && (
              <button
                type="button"
                onClick={onOpenTokenAnalyzer}
                className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors"
                title="Buka Modal Analisis Token (Safety Score, ATH Discount, Hype & AI Audit)"
              >
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                <span>Analyze Token</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setPool('pump')}
              className={`px-2.5 py-1 rounded transition-colors ${
                pool === 'pump'
                  ? 'bg-cyan-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pump.fun
            </button>
            <button
              type="button"
              onClick={() => setPool('raydium')}
              className={`px-2.5 py-1 rounded transition-colors ${
                pool === 'raydium'
                  ? 'bg-cyan-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Raydium
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Token CA (Contract Address) Input */}
        <div>
          <label className="block text-[11px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
            Contract Address (Token Mint)
          </label>
          <Input
            value={activeMint}
            onChange={(e) => setActiveMint(e.target.value)}
            placeholder="Masukkan Solana Token Mint CA..."
            suffixNode={
              activeMint ? (
                <button
                  type="button"
                  onClick={() => setActiveMint('')}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  Clear
                </button>
              ) : null
            }
          />
        </div>

        {/* Live Token Info Banner */}
        {activeMint && (
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 font-mono">
            {isTokenLoading ? (
              <div className="text-xs text-zinc-500 animate-pulse">Memuat data harga DexScreener...</div>
            ) : tokenData ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-100 text-sm">{tokenData.symbol}</span>
                  <span className="text-zinc-500 text-[11px]">{tokenData.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Harga SOL</span>
                    <span className="text-cyan-400 font-semibold">{formatSmartPrice(tokenData.priceSol)} SOL</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Harga USD</span>
                    <span className="text-zinc-200 font-semibold">${formatSmartPrice(tokenData.priceUsd)}</span>
                  </div>
                  {tokenData.priceChange24h !== undefined && (
                    <div>
                      <span className="text-zinc-500 text-[10px] block">24h Chg</span>
                      <span
                        className={`font-semibold flex items-center ${
                          tokenData.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tokenData.priceChange24h >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                        )}
                        {tokenData.priceChange24h.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  {tokenData.marketCapUsd && (
                    <div className="hidden sm:block">
                      <span className="text-zinc-500 text-[10px] block">Market Cap</span>
                      <span className="text-zinc-300">${(tokenData.marketCapUsd / 1000).toFixed(1)}K</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500">
                Data token tidak ditemukan di DexScreener atau pair belum terindeks.
              </div>
            )}
          </div>
        )}

        {/* Preset Jumlah Pembelian (SOL per dompet) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              Jumlah Beli per Dompet
            </label>
            <span className="text-[11px] font-mono text-emerald-400">
              Total Order: {totalBuyAmountSol} SOL ({selectedWallets.length} Dompet)
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-2">
            {[0.05, 0.1, 0.25, 0.5, 1.0, 2.0].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTradePreset(preset)}
                className={`py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                  tradePreset === preset
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {preset} SOL
              </button>
            ))}
          </div>

          <Input
            type="number"
            step="0.01"
            min="0.001"
            value={tradePreset}
            onChange={(e) => setTradePreset(parseFloat(e.target.value) || 0)}
            suffixNode="SOL"
          />
        </div>

        {/* Parameter Slippage & Priority Fee */}
        <div className="grid grid-cols-2 gap-3">
          {/* Slippage */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
              Slippage Toleransi
            </label>
            <div className="flex gap-1 mb-1.5">
              {[5, 10, 15, 25].map((slip) => (
                <button
                  key={slip}
                  type="button"
                  onClick={() => setSlippage(slip)}
                  className={`flex-1 py-1 rounded text-[11px] font-mono border transition-colors ${
                    slippage === slip
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {slip}%
                </button>
              ))}
            </div>
            <Input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
              suffixNode="%"
              className="text-xs"
            />
          </div>

          {/* Priority Fee */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
              Priority Fee (Tip)
            </label>
            <div className="flex gap-1 mb-1.5">
              {[0.001, 0.005, 0.01].map((fee) => (
                <button
                  key={fee}
                  type="button"
                  onClick={() => setPriorityFee(fee)}
                  className={`flex-1 py-1 rounded text-[11px] font-mono border transition-colors ${
                    priorityFee === fee
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {fee}
                </button>
              ))}
            </div>
            <Input
              type="number"
              step="0.001"
              value={priorityFee}
              onChange={(e) => setPriorityFee(parseFloat(e.target.value) || 0)}
              suffixNode="SOL"
              className="text-xs"
            />
          </div>
        </div>

        {/* Tombol Eksekusi Trading Utama */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Tombol Beli */}
          <Button
            variant="buy"
            size="lg"
            onClick={handleBuy}
            isLoading={isExecuting}
            disabled={!isUnlocked || selectedWallets.length === 0 || !activeMint}
            className="w-full text-sm font-bold uppercase tracking-wider"
          >
            BUY {selectedWallets.length}x DOMPET
          </Button>

          {/* Tombol Jual */}
          <Button
            variant="sell"
            size="lg"
            onClick={handleSell}
            isLoading={isExecuting}
            disabled={!isUnlocked || selectedWallets.length === 0 || !activeMint}
            className="w-full text-sm font-bold uppercase tracking-wider"
          >
            SELL 100% TOKEN
          </Button>
        </div>

        {/* Tombol Darurat PANIC SELL ALL */}
        <div className="pt-1">
          <Button
            variant="panic"
            size="default"
            onClick={handlePanicSell}
            isLoading={isExecuting}
            disabled={!isUnlocked || selectedWallets.length === 0 || !activeMint}
            className="w-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Flame className="w-4 h-4" />
            PANIC SELL ALL (LIKUIDASI SEKARANG)
            <AlertTriangle className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
