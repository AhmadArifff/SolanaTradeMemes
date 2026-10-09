import { CRYPTO_VAULT_CONSTANTS } from '@repo/types';

/**
 * Mendapatkan instance SubtleCrypto yang tersedia di lingkungan browser maupun Node.js.
 */
function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API (crypto.subtle) tidak didukung pada lingkungan runtime ini.');
}

/**
 * Menghasilkan salt acak kriptografis.
 * Default: 16 byte sesuai standar PBKDF2.
 */
export function generateSalt(length = CRYPTO_VAULT_CONSTANTS.SALT_BYTE_LENGTH): Uint8Array {
  const salt = new Uint8Array(length);
  globalThis.crypto.getRandomValues(salt);
  return salt;
}

/**
 * Menghasilkan Initialization Vector (IV) acak kriptografis untuk AES-GCM.
 * Standar NIST: 12 byte (96-bit) unik per operasi enkripsi.
 */
export function generateIv(length = CRYPTO_VAULT_CONSTANTS.IV_BYTE_LENGTH): Uint8Array {
  const iv = new Uint8Array(length);
  globalThis.crypto.getRandomValues(iv);
  return iv;
}

/**
 * Menurunkan AES-GCM 256-bit CryptoKey dari kata sandi master dan salt menggunakan PBKDF2 (SHA-256).
 * Kunci yang dihasilkan berstatus non-extractable (tidak dapat diekstrak keluar dari Web Crypto).
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations = CRYPTO_VAULT_CONSTANTS.PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  try {
    // 1. Impor kata sandi mentah sebagai key material dasar untuk PBKDF2
    const baseKey = await subtle.importKey(
      'raw',
      passwordBytes as unknown as BufferSource,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // 2. Turunkan kunci simetris AES-GCM 256-bit
    const derivedKey = await subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as unknown as BufferSource,
        iterations,
        hash: 'SHA-256',
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: CRYPTO_VAULT_CONSTANTS.AES_KEY_LENGTH,
      },
      false, // non-extractable untuk keamanan maksimal
      ['encrypt', 'decrypt']
    );

    return derivedKey;
  } finally {
    // 3. Langsung timpa memori kata sandi di RAM
    passwordBytes.fill(0);
  }
}
