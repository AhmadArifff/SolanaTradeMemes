import { Connection, Keypair } from '@solana/web3.js';
import type { BroadcastResult } from '@repo/types';
import { getTokenBalance } from './connection.js';
import { fetchTradeLocalTransaction } from './pumpportal.js';
import { signVersionedTransaction } from './signer.js';
import { broadcastParallelBatch, type ParallelBatchTask } from './broadcast.js';

export interface PanicSellWalletTarget {
  publicKey: string;
  keypair: Keypair;
  walletLabel?: string;
}

export interface PanicSellOptions {
  slippage: number;
  priorityFee: number;
}

/**
 * Fitur Likuidasi Darurat Panic Sell All:
 * Memeriksa saldo token SPL pada setiap dompet yang dipilih, membuat order SELL 100% dari kepemilikan,
 * menandatanganinya secara instan di RAM, dan menyiarkannya serentak via Promise.allSettled.
 */
export async function executePanicSellAll(
  connection: Connection,
  wallets: PanicSellWalletTarget[],
  tokenMint: string,
  options: PanicSellOptions
): Promise<BroadcastResult[]> {
  const timestamp = Date.now();
  if (wallets.length === 0) return [];

  // 1. Ambil saldo token untuk setiap dompet secara paralel
  const balanceChecks = await Promise.all(
    wallets.map(async (wallet) => {
      const balanceRes = await getTokenBalance(connection, wallet.publicKey, tokenMint);
      return {
        wallet,
        balanceRes,
      };
    })
  );

  const batchTasks: ParallelBatchTask[] = [];
  const immediateResults: BroadcastResult[] = [];

  // 2. Siapkan instruksi jual untuk dompet yang memiliki saldo token > 0
  for (const { wallet, balanceRes } of balanceChecks) {
    if (!balanceRes.success || balanceRes.data.uiAmount <= 0) {
      immediateResults.push({
        publicKey: wallet.publicKey,
        walletLabel: wallet.walletLabel,
        status: 'rejected',
        error: balanceRes.success
          ? 'Saldo token 0, tidak ada aset yang dapat dilikuidasi.'
          : balanceRes.error,
        timestamp,
      });
      continue;
    }

    // Minta transaksi jual 100% saldo token dari PumpPortal
    const tradeRes = await fetchTradeLocalTransaction({
      publicKey: wallet.publicKey,
      action: 'sell',
      mint: tokenMint,
      amount: balanceRes.data.uiAmount,
      denominatedInSol: false,
      slippage: options.slippage,
      priorityFee: options.priorityFee,
      pool: 'pump',
    });

    if (!tradeRes.success) {
      immediateResults.push({
        publicKey: wallet.publicKey,
        walletLabel: wallet.walletLabel,
        status: 'rejected',
        error: tradeRes.error,
        timestamp,
      });
      continue;
    }

    // Tandatangani transaksi v0 di RAM
    const signRes = signVersionedTransaction(tradeRes.data, wallet.keypair);
    if (!signRes.success) {
      immediateResults.push({
        publicKey: wallet.publicKey,
        walletLabel: wallet.walletLabel,
        status: 'rejected',
        error: signRes.error,
        timestamp,
      });
      continue;
    }

    batchTasks.push({
      publicKey: wallet.publicKey,
      walletLabel: wallet.walletLabel,
      signedTx: signRes.data,
    });
  }

  // 3. Siarkan seluruh transaksi jual yang siap secara paralel
  const broadcastResults = await broadcastParallelBatch(connection, batchTasks);

  return [...immediateResults, ...broadcastResults];
}
