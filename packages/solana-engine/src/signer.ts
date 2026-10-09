import { Keypair, VersionedTransaction } from '@solana/web3.js';
import { Result } from '@repo/types';

/**
 * Membuat instance Keypair Solana dari buffer byte kunci privat (64 byte).
 */
export function createKeypairFromSecretKey(secretKeyBytes: Uint8Array): Result<Keypair> {
  try {
    if (secretKeyBytes.length !== 64) {
      return Result.fail(
        `Kunci privat harus 64 byte untuk Keypair Solana. Diterima ${secretKeyBytes.length} byte.`
      );
    }
    const keypair = Keypair.fromSecretKey(secretKeyBytes);
    return Result.ok(keypair);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error.message : 'Gagal membuat Keypair Solana dari buffer kunci'
    );
  }
}

/**
 * Melakukan deserialisasi byte transaksi biner ke VersionedTransaction (v0)
 * dan menandatanganinya menggunakan Keypair lokal di memori.
 */
export function signVersionedTransaction(
  rawTxBytes: Uint8Array,
  keypair: Keypair
): Result<VersionedTransaction> {
  try {
    // 1. Deserialisasi transaksi v0 (mendukung Address Lookup Tables / ALT)
    const transaction = VersionedTransaction.deserialize(rawTxBytes);

    // 2. Tandatangani secara lokal di RAM peramban
    transaction.sign([keypair]);

    return Result.ok(transaction);
  } catch (error) {
    return Result.fail(
      error instanceof Error
        ? `Gagal menandatangani VersionedTransaction: ${error.message}`
        : 'Kesalahan saat deserialisasi transaksi Solana v0'
    );
  }
}
