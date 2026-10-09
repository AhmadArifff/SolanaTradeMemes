'use client';

import React from 'react';
import { Lock, Unlock, Plus, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { Button, Badge } from '@repo/ui';
import { useTerminalStore } from '../store/useTerminalStore';

interface NavbarProps {
  onOpenUnlockModal: () => void;
  onOpenImportModal: () => void;
  onRefreshBalances: () => void;
  isRefreshing: boolean;
  rpcLatencyMs: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenUnlockModal,
  onOpenImportModal,
  onRefreshBalances,
  isRefreshing,
  rpcLatencyMs,
}) => {
  const { isUnlocked, lockVault, wallets } = useTerminalStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Zap className="w-5 h-5 text-zinc-950 fill-zinc-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base tracking-wider text-zinc-100">
                Solana<span className="text-cyan-400">Trade</span>Memes
              </span>
              <Badge variant="neon" size="sm">
                TERMINAL v1.4
              </Badge>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono tracking-tight hidden sm:block">
              Pure Client-Side Zero-Custody Multi-Wallet Sniper
            </p>
          </div>
        </div>

        {/* RPC & Security Status */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* RPC Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900/60 border border-zinc-800/60 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-zinc-400">Helius RPC:</span>
            <span className="text-emerald-400 font-medium">
              {rpcLatencyMs !== null ? `${rpcLatencyMs}ms` : 'Aktif'}
            </span>
          </div>

          {/* Refresh Balances Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefreshBalances}
            disabled={isRefreshing}
            className="text-zinc-400 hover:text-white"
            title="Segarkan Saldo Akun"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </Button>

          {/* Import Wallet Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenImportModal}
            className="hidden sm:inline-flex text-xs font-mono"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Impor Dompet</span>
          </Button>

          {/* Vault Lock / Unlock Button */}
          {isUnlocked ? (
            <div className="flex items-center gap-2">
              <Badge variant="fulfilled" size="sm" withDot className="hidden sm:inline-flex">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Kubah Terbuka ({wallets.length} Akun)
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={lockVault}
                className="text-xs font-mono border-rose-900/40 text-rose-300 hover:bg-rose-950/40 hover:text-rose-200"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Kunci Kubah</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={onOpenUnlockModal}
              className="text-xs font-mono"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Buka Kubah</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
