'use client';

import { useState, useEffect, useCallback } from 'react';
import { openDB, type IDBPDatabase } from 'idb';
import type { TradeLedgerEntry, SessionTradeSummary } from '@repo/types';

const LEDGER_DB_NAME = 'solana_trade_ledger';
const LEDGER_DB_VERSION = 1;
const LEDGER_STORE_NAME = 'trade_history';

interface LedgerDBSchema {
  [LEDGER_STORE_NAME]: {
    key: string;
    value: TradeLedgerEntry;
    indexes: {
      by_timestamp: number;
      by_mint: string;
      by_wallet: string;
    };
  };
}

let ledgerDbPromise: Promise<IDBPDatabase<LedgerDBSchema>> | null = null;

function getLedgerDB(): Promise<IDBPDatabase<LedgerDBSchema>> {
  if (!ledgerDbPromise) {
    ledgerDbPromise = openDB<LedgerDBSchema>(LEDGER_DB_NAME, LEDGER_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(LEDGER_STORE_NAME)) {
          const store = db.createObjectStore(LEDGER_STORE_NAME, {
            keyPath: 'id',
          });
          store.createIndex('by_timestamp', 'timestamp');
          store.createIndex('by_mint', 'tokenMint');
          store.createIndex('by_wallet', 'walletPublicKey');
        }
      },
    });
  }
  return ledgerDbPromise;
}

/**
 * Hook untuk mengelola buku besar riwayat transaksi perdagangan dan kalkulasi Realized PnL.
 */
export function useTradeLedger() {
  const [history, setHistory] = useState<TradeLedgerEntry[]>([]);
  const [summary, setSummary] = useState<SessionTradeSummary>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRatePercent: 0,
    totalRealizedPnlSol: 0,
    averageRoiPercent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const calculateSummary = useCallback((entries: TradeLedgerEntry[]): SessionTradeSummary => {
    let winning = 0;
    let losing = 0;
    let totalPnlSol = 0;
    let sumRoiPercent = 0;
    let closedTrades = 0;

    for (const trade of entries) {
      if (trade.action === 'sell' && trade.realizedPnlSol !== undefined) {
        closedTrades += 1;
        totalPnlSol += trade.realizedPnlSol;
        sumRoiPercent += trade.realizedPnlPercent ?? 0;
        if (trade.realizedPnlSol > 0) {
          winning += 1;
        } else if (trade.realizedPnlSol < 0) {
          losing += 1;
        }
      }
    }

    const winRate = closedTrades > 0 ? (winning / closedTrades) * 100 : 0;
    const avgRoi = closedTrades > 0 ? sumRoiPercent / closedTrades : 0;

    return {
      totalTrades: entries.length,
      winningTrades: winning,
      losingTrades: losing,
      winRatePercent: Number(winRate.toFixed(1)),
      totalRealizedPnlSol: Number(totalPnlSol.toFixed(4)),
      averageRoiPercent: Number(avgRoi.toFixed(1)),
    };
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const db = await getLedgerDB();
      const records = await db.getAllFromIndex(LEDGER_STORE_NAME, 'by_timestamp');
      // Urutkan dari yang paling baru
      const sorted = records.reverse();
      setHistory(sorted);
      setSummary(calculateSummary(sorted));
    } catch (error) {
      console.error('Gagal memuat buku besar riwayat trade:', error);
    } finally {
      setIsLoading(false);
    }
  }, [calculateSummary]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  /**
   * Menambahkan entri transaksi baru ke dalam buku besar dengan kalkulasi Weighted Average Cost Basis saat SELL.
   */
  const recordTrade = useCallback(
    async (rawEntry: Omit<TradeLedgerEntry, 'id' | 'timestamp' | 'costBasisSol' | 'realizedPnlSol' | 'realizedPnlPercent'>) => {
      try {
        const db = await getLedgerDB();
        const id = globalThis.crypto.randomUUID();
        const timestamp = Date.now();

        let costBasisSol: number | undefined;
        let realizedPnlSol: number | undefined;
        let realizedPnlPercent: number | undefined;

        if (rawEntry.action === 'sell') {
          // Ambil seluruh histori BUY untuk token ini guna menghitung rata-rata harga beli (WACB)
          const allTrades = await db.getAllFromIndex(LEDGER_STORE_NAME, 'by_timestamp');
          let accumulatedTokens = 0;
          let accumulatedCostSol = 0;

          for (const past of allTrades) {
            if (past.tokenMint === rawEntry.tokenMint) {
              if (past.action === 'buy') {
                accumulatedTokens += past.tokenAmount;
                accumulatedCostSol += past.solAmount;
              } else if (past.action === 'sell') {
                const proportion = past.tokenAmount / (accumulatedTokens || 1);
                accumulatedTokens = Math.max(0, accumulatedTokens - past.tokenAmount);
                accumulatedCostSol = Math.max(0, accumulatedCostSol - (accumulatedCostSol * proportion));
              }
            }
          }

          if (accumulatedTokens > 0) {
            const avgCostPerToken = accumulatedCostSol / accumulatedTokens;
            costBasisSol = Number((avgCostPerToken * rawEntry.tokenAmount).toFixed(4));
            realizedPnlSol = Number((rawEntry.solAmount - costBasisSol).toFixed(4));
            realizedPnlPercent = costBasisSol > 0 ? Number(((realizedPnlSol / costBasisSol) * 100).toFixed(1)) : 0;
          }
        }

        const fullEntry: TradeLedgerEntry = {
          ...rawEntry,
          id,
          timestamp,
          costBasisSol,
          realizedPnlSol,
          realizedPnlPercent,
        };

        await db.put(LEDGER_STORE_NAME, fullEntry);
        await refreshHistory();
      } catch (error) {
        console.error('Gagal mencatat transaksi ke buku besar:', error);
      }
    },
    [refreshHistory]
  );

  /**
   * Mengekspor riwayat transaksi ke berkas CSV.
   */
  const exportToCsv = useCallback(() => {
    if (history.length === 0) return;

    const headers = [
      'Timestamp',
      'Date Time',
      'Wallet',
      'Action',
      'Token Mint',
      'Token Amount',
      'SOL Amount',
      'Price Per Token (SOL)',
      'Cost Basis (SOL)',
      'Realized PnL (SOL)',
      'Realized PnL (%)',
      'Signature',
    ];

    const rows = history.map((h) => [
      h.timestamp,
      new Date(h.timestamp).toISOString(),
      `"${h.walletLabel} (${h.walletPublicKey.slice(0, 4)}...${h.walletPublicKey.slice(-4)})"`,
      h.action.toUpperCase(),
      h.tokenMint,
      h.tokenAmount,
      h.solAmount,
      h.pricePerTokenSol,
      h.costBasisSol ?? '',
      h.realizedPnlSol ?? '',
      h.realizedPnlPercent ?? '',
      h.signature,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trade-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [history]);

  /**
   * Mengekspor riwayat transaksi ke berkas JSON terstruktur.
   */
  const exportToJson = useCallback(() => {
    if (history.length === 0) return;

    const jsonString = JSON.stringify({ summary, history }, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trade-ledger-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [history, summary]);

  /**
   * Menghapus seluruh riwayat buku besar (Reset History).
   */
  const clearHistory = useCallback(async () => {
    try {
      const db = await getLedgerDB();
      await db.clear(LEDGER_STORE_NAME);
      await refreshHistory();
    } catch (error) {
      console.error('Gagal menghapus riwayat trade:', error);
    }
  }, [refreshHistory]);

  return {
    history,
    summary,
    isLoading,
    recordTrade,
    exportToCsv,
    exportToJson,
    clearHistory,
    refreshHistory,
  };
}
