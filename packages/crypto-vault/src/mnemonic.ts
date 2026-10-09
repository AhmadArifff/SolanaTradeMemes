import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export const DEFAULT_SOLANA_DERIVATION_PATH = "m/44'/501'/0'/0'";

/**
 * Membersihkan dan mengekstrak daftar kata dari teks mentah (paste).
 * Mendukung format daftar bernomor (e.g. "1. laugh\n2. hazard"),
 * koma, titik dua, tanda kurung, kurung siku, dan spasi ganda.
 */
export function sanitizeMnemonicInput(raw: string): string[] {
  if (!raw || typeof raw !== 'string') return [];

  const lines = raw.split(/\r?\n/);
  const words: string[] = [];

  for (const line of lines) {
    // Hapus pola penomoran di awal baris: e.g. "1.", "1 -", "1)", "[1]", "1:"
    const strippedLine = line
      .replace(/^\s*\[?\d+[\.\-\)\:\s\]]+\s*/, '')
      .trim();

    if (strippedLine) {
      // Pecah berdasarkan pemisah kata (spasi, koma, titik koma)
      const tokens = strippedLine.toLowerCase().split(/[\s,;]+/);
      for (const token of tokens) {
        // Hapus karakter non-huruf a-z
        const cleanWord = token.replace(/[^a-z]/g, '');
        if (cleanWord.length > 0) {
          words.push(cleanWord);
        }
      }
    }
  }

  return words;
}

/**
 * Memvalidasi apakah kumpulan kata merupakan frase mnemonik BIP-39 yang valid.
 */
export function validateMnemonicPhrase(mnemonic: string | string[]): boolean {
  const words = Array.isArray(mnemonic) ? mnemonic : sanitizeMnemonicInput(mnemonic);

  if (words.length !== 12 && words.length !== 24) {
    return false;
  }

  return bip39.validateMnemonic(words.join(' '));
}

/**
 * Menghasilkan Keypair Solana dari Frase Mnemonik (BIP-39) menggunakan
 * jalur derivasi standar dompet Solana (Phantom / OKX / Solflare: m/44'/501'/0'/0').
 */
export function deriveSolanaKeypairFromMnemonic(
  mnemonic: string | string[],
  derivationPath: string = DEFAULT_SOLANA_DERIVATION_PATH
): Keypair {
  const words = Array.isArray(mnemonic) ? mnemonic : sanitizeMnemonicInput(mnemonic);

  if (!validateMnemonicPhrase(words)) {
    throw new Error('Frase mnemonik tidak valid menurut standar BIP-39 (harus 12 atau 24 kata terdaftar).');
  }

  const phrase = words.join(' ');

  // 1. Dapatkan seed 64-byte dari frase mnemonik
  const seedBuffer = bip39.mnemonicToSeedSync(phrase);

  // 2. Turunkan seed ed25519 sesuai derivation path Solana
  const seedHex = seedBuffer.toString('hex');
  const derived = derivePath(derivationPath, seedHex);

  // 3. Buat Keypair Solana dari 32-byte derived seed
  return Keypair.fromSeed(Uint8Array.from(derived.key));
}

/**
 * Mengonversi Frase Mnemonik langsung ke kunci privat format Base58 64-byte.
 */
export function mnemonicToPrivateKeyBase58(
  mnemonic: string | string[],
  derivationPath: string = DEFAULT_SOLANA_DERIVATION_PATH
): string {
  const keypair = deriveSolanaKeypairFromMnemonic(mnemonic, derivationPath);
  return bs58.encode(keypair.secretKey);
}
