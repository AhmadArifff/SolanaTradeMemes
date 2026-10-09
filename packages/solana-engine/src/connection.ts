import {
  Connection,
  PublicKey,
  type Commitment,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { Result } from '@repo/types';

/**
 * Membuat instance koneksi RPC Solana dengan konfigurasi commitment yang ditentukan.
 */
export function createRpcConnection(
  rpcUrl: string,
  commitment: Commitment = 'confirmed'
): Connection {
  return new Connection(rpcUrl, {
    commitment,
    confirmTransactionInitialTimeout: 30000,
  });
}

/**
 * Memeriksa status kesehatan endpoint RPC dengan membaca slot blok terkini.
 */
export async function checkRpcHealth(
  connection: Connection
): Promise<Result<{ slot: number; latencyMs: number }>> {
  const startTime = Date.now();
  try {
    const slot = await connection.getSlot('confirmed');
    const latencyMs = Date.now() - startTime;
    return Result.ok({ slot, latencyMs });
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error.message : 'Koneksi ke endpoint RPC Solana gagal.'
    );
  }
}

/**
 * Mengambil saldo SOL asli (native SOL) dari alamat dompet tertentu.
 */
export async function getSolBalance(
  connection: Connection,
  walletAddress: string
): Promise<Result<number>> {
  try {
    const pubkey = new PublicKey(walletAddress);
    const lamports = await connection.getBalance(pubkey, 'confirmed');
    const solBalance = lamports / LAMPORTS_PER_SOL;
    return Result.ok(solBalance);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error.message : 'Gagal mengambil saldo SOL dompet.'
    );
  }
}

/**
 * Mengambil saldo token SPL tertentu yang dimiliki oleh dompet.
 * Mengembalikan 0 jika Associated Token Account (ATA) belum dibuat.
 */
export async function getTokenBalance(
  connection: Connection,
  walletAddress: string,
  tokenMintAddress: string
): Promise<Result<{ uiAmount: number; rawAmount: bigint; decimals: number }>> {
  try {
    const walletPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(tokenMintAddress);

    // Cari alamat ATA milik dompet
    const ataAddress = await getAssociatedTokenAddress(mintPubkey, walletPubkey);

    try {
      const tokenAccount = await getAccount(connection, ataAddress, 'confirmed');
      const balanceResponse = await connection.getTokenAccountBalance(ataAddress, 'confirmed');

      return Result.ok({
        uiAmount: balanceResponse.value.uiAmount ?? 0,
        rawAmount: tokenAccount.amount,
        decimals: balanceResponse.value.decimals,
      });
    } catch {
      // Jika token account belum ada, kembalikan saldo 0
      return Result.ok({
        uiAmount: 0,
        rawAmount: BigInt(0),
        decimals: 6,
      });
    }
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error.message : 'Gagal memeriksa saldo token SPL.'
    );
  }
}

/**
 * Mengambil saldo SOL dari banyak dompet secara bersamaan (batch).
 */
export async function getBatchSolBalances(
  connection: Connection,
  walletAddresses: string[]
): Promise<Map<string, number>> {
  const balanceMap = new Map<string, number>();
  if (walletAddresses.length === 0) return balanceMap;

  const results = await Promise.allSettled(
    walletAddresses.map(async (address) => {
      const pubkey = new PublicKey(address);
      const lamports = await connection.getBalance(pubkey, 'confirmed');
      return { address, balance: lamports / LAMPORTS_PER_SOL };
    })
  );

  for (const res of results) {
    if (res.status === 'fulfilled') {
      balanceMap.set(res.value.address, res.value.balance);
    }
  }

  return balanceMap;
}
