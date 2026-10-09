'use client';

import { create } from 'zustand';
import type { Connection } from '@solana/web3.js';
import {
  Result,
  TRADING_DEFAULTS,
  type WalletSessionEntry,
  type BroadcastResult,
  type EncryptedWalletRecord,
} from '@repo/types';
import {
  CryptoVault,
  getAllEncryptedWallets,
} from '@repo/crypto-vault';
import {
  getSolBalance,
  getTokenBalance,
  createKeypairFromSecretKey,
  fetchTradeLocalTransaction,
  signVersionedTransaction,
  broadcastParallelBatch,
  executePanicSellAll as enginePanicSellAll,
  type ParallelBatchTask,
} from '@repo/solana-engine';

interface TerminalState {
  vault: CryptoVault;
  isUnlocked: boolean;
  masterPassword: string | null;
  wallets: WalletSessionEntry[];
  activeMint: string;
  tradePreset: number;
  slippage: number;
  priorityFee: number;
  pool: 'pump' | 'raydium';
  isExecuting: boolean;
  executionResults: BroadcastResult[];
  isExecutionModalOpen: boolean;

  // Actions
  initVault: () => Promise<void>;
  unlockVault: (password: string) => Promise<Result<number>>;
  lockVault: () => void;
  importWallet: (label: string, privateKeyBase58: string) => Promise<Result<EncryptedWalletRecord>>;
  removeWallet: (id: string) => Promise<Result<void>>;
  toggleWalletSelection: (id: string) => void;
  selectAllWallets: (selected: boolean) => void;
  refreshBalances: (connection: Connection) => Promise<void>;
  setActiveMint: (mint: string) => void;
  setTradePreset: (preset: number) => void;
  setSlippage: (slippage: number) => void;
  setPriorityFee: (fee: number) => void;
  setPool: (pool: 'pump' | 'raydium') => void;
  setExecutionModalOpen: (open: boolean) => void;
  executeTrade: (connection: Connection, action: 'buy' | 'sell') => Promise<BroadcastResult[]>;
  executePanicSell: (connection: Connection) => Promise<BroadcastResult[]>;
}

export const useTerminalStore = create<TerminalState>((set, get) => {
  const vaultInstance = new CryptoVault();

  return {
    vault: vaultInstance,
    isUnlocked: false,
    masterPassword: null,
    wallets: [],
    activeMint: 'zmvhp6GmmTgpkpL4v6sobHgAmuJkkZwUFDYLz5S1Bwz',
    tradePreset: 0.1,
    slippage: TRADING_DEFAULTS.SLIPPAGE_PERCENT,
    priorityFee: TRADING_DEFAULTS.PRIORITY_FEE_SOL,
    pool: 'pump',
    isExecuting: false,
    executionResults: [],
    isExecutionModalOpen: false,

    initVault: async () => {
      try {
        const records = await getAllEncryptedWallets();
        const currentWallets = get().wallets;
        const mapped: WalletSessionEntry[] = records.map((rec) => {
          const existing = currentWallets.find((w) => w.id === rec.id);
          return {
            id: rec.id,
            label: rec.label,
            publicKey: rec.publicKey,
            solBalance: existing?.solBalance ?? 0,
            tokenBalance: existing?.tokenBalance ?? 0,
            isSelected: existing?.isSelected ?? true,
          };
        });
        set({ wallets: mapped });
      } catch (err) {
        console.error('Gagal menginisialisasi kubah dompet dari IndexedDB:', err);
      }
    },

    unlockVault: async (password: string) => {
      const { vault } = get();
      const res = await vault.unlock(password);
      if (res.success) {
        set({
          isUnlocked: true,
          masterPassword: password,
        });
        await get().initVault();
      }
      return res;
    },

    lockVault: () => {
      const { vault } = get();
      vault.lock();
      set({
        isUnlocked: false,
        masterPassword: null,
      });
    },

    importWallet: async (label: string, privateKeyBase58: string) => {
      const { vault, masterPassword } = get();
      if (!masterPassword) {
        return Result.fail('Kubah terkunci. Buka kubah terlebih dahulu dengan kata sandi master.');
      }

      const res = await vault.importWallet(
        { label, privateKeyBase58 },
        masterPassword
      );

      if (res.success) {
        await get().initVault();
      }
      return res;
    },

    removeWallet: async (id: string) => {
      const { vault } = get();
      const res = await vault.removeWallet(id);
      if (res.success) {
        set((state) => ({
          wallets: state.wallets.filter((w) => w.id !== id),
        }));
      }
      return res;
    },

    toggleWalletSelection: (id: string) => {
      set((state) => ({
        wallets: state.wallets.map((w) =>
          w.id === id ? { ...w, isSelected: !w.isSelected } : w
        ),
      }));
    },

    selectAllWallets: (selected: boolean) => {
      set((state) => ({
        wallets: state.wallets.map((w) => ({ ...w, isSelected: selected })),
      }));
    },

    refreshBalances: async (connection: Connection) => {
      const { wallets, activeMint } = get();
      if (wallets.length === 0) return;

      const updated = await Promise.all(
        wallets.map(async (wallet) => {
          let solBal = wallet.solBalance;
          let tokBal = wallet.tokenBalance;

          const solRes = await getSolBalance(connection, wallet.publicKey);
          if (solRes.success) {
            solBal = solRes.data;
          }

          if (activeMint && activeMint.length >= 32) {
            const tokRes = await getTokenBalance(connection, wallet.publicKey, activeMint);
            if (tokRes.success) {
              tokBal = tokRes.data.uiAmount;
            }
          }

          return {
            ...wallet,
            solBalance: solBal,
            tokenBalance: tokBal,
            lastUpdated: Date.now(),
          };
        })
      );

      set({ wallets: updated });
    },

    setActiveMint: (mint: string) => set({ activeMint: mint.trim() }),
    setTradePreset: (preset: number) => set({ tradePreset: preset }),
    setSlippage: (slippage: number) => set({ slippage }),
    setPriorityFee: (fee: number) => set({ priorityFee: fee }),
    setPool: (pool: 'pump' | 'raydium') => set({ pool }),
    setExecutionModalOpen: (open: boolean) => set({ isExecutionModalOpen: open }),

    executeTrade: async (connection: Connection, action: 'buy' | 'sell') => {
      const {
        vault,
        wallets,
        activeMint,
        tradePreset,
        slippage,
        priorityFee,
        pool,
        isUnlocked,
      } = get();

      if (!isUnlocked) {
        throw new Error('Kubah terkunci. Buka kubah terlebih dahulu untuk melakukan transaksi.');
      }

      if (!activeMint || activeMint.length < 32) {
        throw new Error('Contract Address (Mint) token belum diisi atau tidak valid.');
      }

      const selectedWallets = wallets.filter((w) => w.isSelected);
      if (selectedWallets.length === 0) {
        throw new Error('Pilih minimal satu dompet untuk mengeksekusi perdagangan.');
      }

      set({ isExecuting: true, isExecutionModalOpen: true, executionResults: [] });

      const batchTasks: ParallelBatchTask[] = [];
      const preliminaryResults: BroadcastResult[] = [];
      const timestamp = Date.now();

      for (const wallet of selectedWallets) {
        const secretKeyBytes = vault.getActiveKey(wallet.id);
        if (!secretKeyBytes) {
          preliminaryResults.push({
            publicKey: wallet.publicKey,
            walletLabel: wallet.label,
            status: 'rejected',
            error: 'Kunci privat tidak ditemukan di memori RAM.',
            timestamp,
          });
          continue;
        }

        const keypairRes = createKeypairFromSecretKey(secretKeyBytes);
        if (!keypairRes.success) {
          preliminaryResults.push({
            publicKey: wallet.publicKey,
            walletLabel: wallet.label,
            status: 'rejected',
            error: keypairRes.error,
            timestamp,
          });
          continue;
        }

        // Tentukan jumlah yang ditradingkan
        const tradeAmount = action === 'buy' ? tradePreset : wallet.tokenBalance;
        if (tradeAmount <= 0) {
          preliminaryResults.push({
            publicKey: wallet.publicKey,
            walletLabel: wallet.label,
            status: 'rejected',
            error: action === 'buy' ? 'Jumlah beli 0 SOL' : 'Saldo token 0, tidak ada aset untuk dijual',
            timestamp,
          });
          continue;
        }

        // Minta transaksi trade-local dari PumpPortal
        const txRes = await fetchTradeLocalTransaction({
          publicKey: wallet.publicKey,
          action,
          mint: activeMint,
          amount: tradeAmount,
          denominatedInSol: action === 'buy',
          slippage,
          priorityFee,
          pool,
        });

        if (!txRes.success) {
          preliminaryResults.push({
            publicKey: wallet.publicKey,
            walletLabel: wallet.label,
            status: 'rejected',
            error: txRes.error,
            timestamp,
          });
          continue;
        }

        // Tandatangani VersionedTransaction v0
        const signRes = signVersionedTransaction(txRes.data, keypairRes.data);
        if (!signRes.success) {
          preliminaryResults.push({
            publicKey: wallet.publicKey,
            walletLabel: wallet.label,
            status: 'rejected',
            error: signRes.error,
            timestamp,
          });
          continue;
        }

        batchTasks.push({
          publicKey: wallet.publicKey,
          walletLabel: wallet.label,
          signedTx: signRes.data,
        });
      }

      // Siarkan transaksi secara paralel via Promise.allSettled langsung ke Private RPC
      const broadcastRes = await broadcastParallelBatch(connection, batchTasks);
      const combined = [...preliminaryResults, ...broadcastRes];

      set({
        isExecuting: false,
        executionResults: combined,
      });

      // Segera perbarui saldo akun
      await get().refreshBalances(connection);

      return combined;
    },

    executePanicSell: async (connection: Connection) => {
      const {
        vault,
        wallets,
        activeMint,
        slippage,
        priorityFee,
        isUnlocked,
      } = get();

      if (!isUnlocked) {
        throw new Error('Kubah terkunci. Buka kubah terlebih dahulu.');
      }

      if (!activeMint || activeMint.length < 32) {
        throw new Error('Contract Address (Mint) token belum diisi.');
      }

      const selectedWallets = wallets.filter((w) => w.isSelected);
      if (selectedWallets.length === 0) {
        throw new Error('Pilih minimal satu dompet untuk likuidasi darurat.');
      }

      set({ isExecuting: true, isExecutionModalOpen: true, executionResults: [] });

      const targets = selectedWallets
        .map((w) => {
          const secretKeyBytes = vault.getActiveKey(w.id);
          if (!secretKeyBytes) return null;
          const kp = createKeypairFromSecretKey(secretKeyBytes);
          if (!kp.success) return null;
          return {
            publicKey: w.publicKey,
            keypair: kp.data,
            walletLabel: w.label,
          };
        })
        .filter((t): t is NonNullable<typeof t> => t !== null);

      const results = await enginePanicSellAll(connection, targets, activeMint, {
        slippage: Math.max(slippage, 20), // Naikkan slippage darurat minimal 20%
        priorityFee: Math.max(priorityFee, 0.01), // Tingkatkan prioritas transaksi darurat
      });

      set({
        isExecuting: false,
        executionResults: results,
      });

      await get().refreshBalances(connection);
      return results;
    },
  };
});
