import { describe, it, expect } from 'vitest';
import {
  sanitizeMnemonicInput,
  validateMnemonicPhrase,
  deriveSolanaKeypairFromMnemonic,
  mnemonicToPrivateKeyBase58,
} from '../src/index';

describe('@repo/crypto-vault - Mnemonic Sanitasi & Derivasi (OKX Style)', () => {
  const sampleNumberedMnemonic = `
1. laugh
2. hazard
3. pride
4. virtual
5. radio
6. elbow
7. tortoise
8. gallery
9. used
10. output
11. cheese
12. predict
  `;

  it('berhasil melakukan auto-sanitasi pada input berformat nomor baris seperti OKX', () => {
    const cleaned = sanitizeMnemonicInput(sampleNumberedMnemonic);

    expect(cleaned).toHaveLength(12);
    expect(cleaned).toEqual([
      'laugh',
      'hazard',
      'pride',
      'virtual',
      'radio',
      'elbow',
      'tortoise',
      'gallery',
      'used',
      'output',
      'cheese',
      'predict',
    ]);
  });

  it('berhasil melakukan sanitasi pada format koma, kurung siku, dan spasi acak', () => {
    const mixedInput = '[1] laugh, [2] HAZARD; [3] pride, 4: virtual  5- radio  6. elbow 7. tortoise 8. gallery 9. used 10. output 11. cheese 12. predict';
    const cleaned = sanitizeMnemonicInput(mixedInput);

    expect(cleaned).toHaveLength(12);
    expect(cleaned[0]).toBe('laugh');
    expect(cleaned[1]).toBe('hazard');
    expect(cleaned[11]).toBe('predict');
  });

  it('memvalidasi frase mnemonik BIP-39 dengan benar', () => {
    const words = sanitizeMnemonicInput(sampleNumberedMnemonic);
    expect(validateMnemonicPhrase(words)).toBe(true);

    // Frase palsu
    expect(validateMnemonicPhrase('bukan kata bip39 yang terdaftar di kamus bahasa inggris')).toBe(false);
    // Jumlah kata salah
    expect(validateMnemonicPhrase('laugh hazard pride')).toBe(false);
  });

  it('menghasilkan Keypair Solana yang valid dari frase mnemonik', () => {
    const keypair = deriveSolanaKeypairFromMnemonic(sampleNumberedMnemonic);

    expect(keypair).toBeDefined();
    expect(keypair.publicKey.toBase58()).toBeTruthy();
    expect(keypair.secretKey).toHaveLength(64);

    const base58Key = mnemonicToPrivateKeyBase58(sampleNumberedMnemonic);
    expect(base58Key).toBeTruthy();
    expect(typeof base58Key).toBe('string');
  });
});
