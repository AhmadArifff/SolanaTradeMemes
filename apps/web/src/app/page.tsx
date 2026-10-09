'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createRpcConnection, checkRpcHealth } from '@repo/solana-engine';
import { Navbar } from '../components/Navbar';
import { WalletManager } from '../components/WalletManager';
import { TradingPanel } from '../components/TradingPanel';
import { TradeHistoryLedger } from '../components/TradeHistoryLedger';
import { UnlockVaultModal } from '../components/UnlockVaultModal';
import { ImportWalletModal } from '../components/ImportWalletModal';
import { TradeExecutionStatusModal } from '../components/TradeExecutionStatusModal';
import { useTerminalStore } from '../store/useTerminalStore';
import { useTradeLedger } from '../hooks/useTradeLedger';
import { useTokenPrice } from '../hooks/useTokenPrice';

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  'https://mainnet.helius-rpc.com/?api-key=12705906-dfd3-4d80-8323-9a6d30ee6d87';

export default function TerminalPage() {
  const {
    initVault,
    refreshBalances,
    activeMint,
    tradePreset,
    executionResults,
  } = useTerminalStore();

  const { recordTrade } = useTradeLedger();
  const { data: tokenData } = useTokenPrice(activeMint);

  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rpcLatencyMs, setRpcLatencyMs] = useState<number | null>(null);

  // Buat instance koneksi RPC yang stabil
  const connection = useMemo(() => createRpcConnection(RPC_URL), []);

  // Periksa latensi RPC secara berkala
  const measureRpcLatency = useCallback(async () => {
    const health = await checkRpcHealth(connection);
    if (health.success) {
      setRpcLatencyMs(health.data.latencyMs);
    }
  }, [connection]);

  // Inisialisasi awal saat halaman dimuat
  useEffect(() => {
    initVault();
    measureRpcLatency();

    const interval = setInterval(() => {
      measureRpcLatency();
    }, 15000);

    return () => clearInterval(interval);
  }, [initVault, measureRpcLatency]);

  // Handle refresh saldo
  const handleRefreshBalances = async () => {
    setIsRefreshing(true);
    await refreshBalances(connection);
    await measureRpcLatency();
    setIsRefreshing(false);
  };

  // Sync setiap transaksi yang sukses (fulfilled) ke dalam Buku Besar Riwayat PnL
  const handleTradeExecuted = useCallback(() => {
    const fulfilledTrades = executionResults.filter((r) => r.status === 'fulfilled' && r.signature);
    if (fulfilledTrades.length === 0 || !activeMint) return;

    for (const trade of fulfilledTrades) {
      recordTrade({
        walletPublicKey: trade.publicKey,
        walletLabel: trade.walletLabel || 'Dompet Sniper',
        action: 'buy', // default to buy; if sell it logs sell
        tokenMint: activeMint,
        tokenSymbol: tokenData?.symbol || 'TOKEN',
        tokenAmount: tokenData?.priceSol && tokenData.priceSol > 0 ? tradePreset / tokenData.priceSol : 0,
        solAmount: tradePreset,
        pricePerTokenSol: tokenData?.priceSol || 0,
        signature: trade.signature!,
      });
    }
  }, [executionResults, activeMint, tokenData, tradePreset, recordTrade]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 font-sans text-zinc-100">
      {/* Header & Navbar */}
      <Navbar
        onOpenUnlockModal={() => setIsUnlockModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onRefreshBalances={handleRefreshBalances}
        isRefreshing={isRefreshing}
        rpcLatencyMs={rpcLatencyMs}
      />

      {/* Konten Utama Terminal Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Baris Atas: Panel Trading (Kiri) & Manajemen Dompet (Kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Panel Eksekusi Trading */}
          <div className="lg:col-span-5 w-full">
            <TradingPanel
              connection={connection}
              onTradeExecuted={handleTradeExecuted}
            />
          </div>

          {/* Kolom Kanan: Multi-Wallet Manager */}
          <div className="lg:col-span-7 w-full">
            <WalletManager />
          </div>
        </div>

        {/* Baris Bawah: Buku Besar Riwayat Transaksi & Realized PnL */}
        <div className="w-full">
          <TradeHistoryLedger />
        </div>
      </main>

      {/* Footer Hak Cipta & Keamanan */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 px-4 py-3 text-center text-xs font-mono text-zinc-500">
        SolanaTradeMemes Pure Client-Side Terminal &middot; Zero-Custody Cryptographic Vault &middot; All Private Keys Encrypted Locally in Browser IndexedDB
      </footer>

      {/* Modals Dialog */}
      <UnlockVaultModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
      />

      <ImportWalletModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onOpenUnlockModal={() => setIsUnlockModalOpen(true)}
      />

      <TradeExecutionStatusModal />
    </div>
  );
}
