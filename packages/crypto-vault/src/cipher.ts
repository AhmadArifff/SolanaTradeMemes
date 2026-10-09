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
 * Mengenkripsi buffer kunci privat menggunakan AES-GCM-256 dengan IV 12 byte unik.
 * Menghasilkan ArrayBuffer yang memuat ciphertext dan authentication tag 128-bit terintegrasi.
 */
export async function encryptPrivateKey(
  privateKeyBytes: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  const subtle = getSubtleCrypto();

  const encryptedBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      tagLength: 128, // 128-bit authentication tag untuk integritas data
    },
    key,
    privateKeyBytes as unknown as BufferSource
  );

  return encryptedBuffer;
}

/**
 * Mendekripsi ciphertext ArrayBuffer menggunakan AES-GCM-256 dan IV yang sesuai.
 * Jika kata sandi salah atau ciphertext mengalami modifikasi/kerusakan, Web Crypto akan
 * menolak autentikasi tag dan menghasilkan kegagalan deterministik.
 */
export async function decryptPrivateKey(
  ciphertext: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<Uint8Array> {
  const subtle = getSubtleCrypto();

  try {
    const decryptedBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
        tagLength: 128,
      },
      key,
      ciphertext
    );

    return new Uint8Array(decryptedBuffer);
  } catch {
    throw new Error('Autentikasi dekripsi gagal: Kata sandi master salah atau data kubah rusak.');
  }
}
