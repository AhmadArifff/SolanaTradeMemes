---
name: crypto-vault-security
description: >
  Specialized skill for engineering zero-leakage cryptographic vaults in the browser.
  Use when designing Web Crypto API (SubtleCrypto) key derivation with PBKDF2, AES-GCM-256
  symmetric encryption, initialization vector (IV) handling, encrypted IndexedDB storage via idb,
  RAM memory zeroing upon session lock, and auditing code against private key exfiltration.
---

# Crypto Vault Security Skill

Skill ini memandu implementasi kubah keamanan kriptografi murni di peramban pengguna untuk paket `@repo/crypto-vault`.

---

## 1. Derivasi Kunci Master (PBKDF2)

```typescript
export async function deriveEncryptionKey(
  masterPassword: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(masterPassword);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
```

---

## 2. Enkripsi Kunci Privat (AES-GCM-256)

```typescript
export async function encryptPrivateKey(
  privateKeyBytes: Uint8Array,
  encryptionKey: CryptoKey
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  // Buat IV 12-byte acak unik
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    encryptionKey,
    privateKeyBytes as BufferSource
  );

  return { ciphertext, iv };
}
```

---

## 3. Dekripsi Kunci Privat

```typescript
export async function decryptPrivateKey(
  ciphertext: ArrayBuffer,
  iv: Uint8Array,
  encryptionKey: CryptoKey
): Promise<Uint8Array> {
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    encryptionKey,
    ciphertext
  );

  return new Uint8Array(decryptedBuffer);
}
```

---

## 4. Protokol Sanitasi Memori (Memory Zeroing)

```typescript
export function wipeMemoryBuffer(buffer: Uint8Array): void {
  // Timpa setiap byte dengan 0
  buffer.fill(0);
}
```
Ketika sesi dikunci:
1. Panggil `wipeMemoryBuffer()` pada seluruh buffer byte kunci privat.
2. Kosongkan referensi `Keypair[]` di state RAM.
3. Picu garbage collection secara alami dengan memutus referensi closure.
