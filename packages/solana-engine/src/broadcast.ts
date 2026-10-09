import {
  Connection,
  VersionedTransaction,
  type SendOptions,
} from '@solana/web3.js';
import { Result, type BroadcastResult, TRADING_DEFAULTS } from '@repo/types';

/**
 * Memetakan pesan error mentah dari Solana RPC/program ke pesan ramah pengguna.
 */
export function mapSolanaTransactionError(rawError: unknown): string {
  if (!rawError) return 'Transaksi gagal tanpa rincian error.';

  const errorString = String(
    rawError instanceof Error ? rawError.message : JSON.stringify(rawError)
  );

  if (errorString.includes('0x1770') || errorString.includes('custom program error: 0x1770')) {
    return 'Slippage terlampaui (0x1770): Pergerakan harga melebihi batas toleransi. Naikkan persentase slippage.';
  }

  if (errorString.includes('0x1') || errorString.includes('insufficient funds') || errorString.includes('insufficient lamports')) {
    return 'Saldo SOL tidak mencukupi untuk membayar biaya gas fee atau transaksi (0x1 Insufficient Funds).';
  }

  if (errorString.includes('429') || errorString.includes('Too Many Requests')) {
    return 'Batas kuota RPC terlampaui (HTTP 429 Rate Limit). Sistem akan mencoba RPC cadangan.';
  }

  if (errorString.includes('BlockhashNotFound') || errorString.includes('blockhash not found')) {
    return 'Blockhash transaksi kadaluarsa karena latensi jaringan. Silakan ulangi eksekusi.';
  }

  if (errorString.includes('Transaction simulation failed')) {
    return `Simulasi transaksi gagal: ${errorString}`;
  }

  return errorString;
}

/**
 * Menyiarkan satu transaksi yang telah ditandatangani ke Private RPC.
 */
export async function broadcastTransaction(
  connection: Connection,
  signedTx: VersionedTransaction,
  options: SendOptions = {
    skipPreflight: true,
    maxRetries: TRADING_DEFAULTS.MAX_RETRIES,
  }
): Promise<Result<string>> {
  try {
    const rawTxBytes = signedTx.serialize();
    const signature = await connection.sendRawTransaction(rawTxBytes, options);
    return Result.ok(signature);
  } catch (error) {
    const friendlyMessage = mapSolanaTransactionError(error);
    return Result.fail(friendlyMessage);
  }
}

export interface ParallelBatchTask {
  publicKey: string;
  walletLabel?: string;
  signedTx: VersionedTransaction;
}

/**
 * Menyiarkan kumpulan transaksi dari banyak dompet secara paralel menggunakan Promise.allSettled.
 * Menjamin kegagalan salah satu dompet (misal: saldo kurang) tidak menggagalkan dompet lain.
 */
export async function broadcastParallelBatch(
  connection: Connection,
  tasks: ParallelBatchTask[]
): Promise<BroadcastResult[]> {
  const timestamp = Date.now();

  if (tasks.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    tasks.map(async (task) => {
      const rawTxBytes = task.signedTx.serialize();
      const signature = await connection.sendRawTransaction(rawTxBytes, {
        skipPreflight: true,
        maxRetries: TRADING_DEFAULTS.MAX_RETRIES,
      });
      return signature;
    })
  );

  return results.map((result, index) => {
    const task = tasks[index]!;
    if (result.status === 'fulfilled') {
      return {
        publicKey: task.publicKey,
        walletLabel: task.walletLabel,
        status: 'fulfilled',
        signature: result.value,
        timestamp,
      };
    } else {
      const friendlyError = mapSolanaTransactionError(result.reason);
      return {
        publicKey: task.publicKey,
        walletLabel: task.walletLabel,
        status: 'rejected',
        error: friendlyError,
        timestamp,
      };
    }
  });
}

/**
 * Memantau status konfirmasi transaksi pada blockchain hingga batas waktu timeout tercapai.
 */
export async function confirmTransaction(
  connection: Connection,
  signature: string,
  timeoutMs = 30000
): Promise<Result<'confirmed' | 'finalized'>> {
  const startTime = Date.now();
  const pollIntervalMs = 1500;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const statusResponse = await connection.getSignatureStatus(signature, {
        searchTransactionHistory: true,
      });

      const confirmationStatus = statusResponse?.value?.confirmationStatus;
      if (confirmationStatus === 'confirmed' || confirmationStatus === 'finalized') {
        if (statusResponse.value?.err) {
          return Result.fail(
            mapSolanaTransactionError(statusResponse.value.err)
          );
        }
        return Result.ok(confirmationStatus);
      }
    } catch {
      // Teruskan polling jika permintaan jaringan sementara gagal
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return Result.fail(`Batas waktu konfirmasi transaksi habis (${timeoutMs / 1000}s). Periksa penjelajah Solana.`);
}
