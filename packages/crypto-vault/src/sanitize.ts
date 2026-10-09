/**
 * Menimpa isi buffer memori dengan angka nol (zero-out) untuk mencegah kebocoran kunci privat di RAM.
 */
export function zeroOutMemory(buffer: Uint8Array | null | undefined): void {
  if (buffer && buffer.length > 0) {
    buffer.fill(0);
  }
}

/**
 * Menimpa banyak buffer sekaligus secara deterministik.
 */
export function zeroOutBuffers(
  ...buffers: (Uint8Array | ArrayBuffer | null | undefined)[]
): void {
  for (const buf of buffers) {
    if (!buf) continue;
    if (buf instanceof Uint8Array) {
      buf.fill(0);
    } else if (buf instanceof ArrayBuffer) {
      new Uint8Array(buf).fill(0);
    }
  }
}

/**
 * Membersihkan seluruh buffer kunci dalam peta (Map) dan menghapus seluruh referensinya.
 */
export function purgeMapOfKeys(keysMap: Map<string, Uint8Array>): void {
  for (const [, keyBuffer] of keysMap.entries()) {
    zeroOutMemory(keyBuffer);
  }
  keysMap.clear();
}

/**
 * Wrapper pelindung untuk eksekusi yang memerlukan kunci privat sesaat,
 * kemudian secara otomatis menghancurkan salinannya setelah fungsi callback selesai dieksekusi.
 */
export async function withSecureKey<T>(
  keyBytes: Uint8Array,
  callback: (key: Uint8Array) => Promise<T> | T
): Promise<T> {
  try {
    return await callback(keyBytes);
  } finally {
    zeroOutMemory(keyBytes);
  }
}
