# 20-crypto-vault-standards.md: Standar Kubah Keamanan Kriptografi Lokal

Dokumen ini mendefinisikan implementasi teknis kriptografi dan manajemen memori untuk `@repo/crypto-vault`.

---

## 1. Spesifikasi Algoritma Kriptografi

1. **Key Derivation Function (KDF):**
   * Algoritma: `PBKDF2` (Password-Based Key Derivation Function 2)
   * Hash Function: `SHA-256`
   * Jumlah Iterasi: Minimal 100.000 iterasi
   * Salt: 16 byte acak kriptografis (`crypto.getRandomValues(new Uint8Array(16))`)
2. **Enkripsi Simetris:**
   * Algoritma: `AES-GCM` (Galois/Counter Mode)
   * Panjang Kunci: 256-bit
   * Initialization Vector (IV): 12 byte acak kriptografis unik untuk setiap operasi enkripsi dompet
   * Tag Length: 128-bit authentication tag

---

## 2. Struktur Data Penyimpanan Terenkripsi (IndexedDB)

Data yang tersimpan di IndexedDB menggunakan skema:
```typescript
interface EncryptedWalletRecord {
  id: string; // UUID v4
  label: string; // Nama alias dompet (misal: "Sniper 01")
  publicKey: string; // Solana Public Key Base58 (32-44 karakter)
  encryptedPrivateKey: ArrayBuffer; // Ciphertext AES-GCM
  iv: Uint8Array; // 12-byte IV unik
  salt: Uint8Array; // 16-byte Salt PBKDF2
  createdAt: number;
}
```

---

## 3. Manajemen RAM & Sanitasi Memori (Memory Purge)

1. Dekripsi hanya menghasilkan instance `Keypair` ke dalam memori RAM peramban.
2. Sediakan fungsi eksplisit `purgeVaultMemory()`:
   * Menghapus seluruh array referensi `Keypair` dari memori.
   * Menimpa (*zero-out*) buffer byte kunci privat dengan nilai `0` sebelum dibuang ke garbage collection jika menggunakan `Uint8Array`.
   * Mereset status sesi Zustand menjadi `isUnlocked: false`.
3. Pasang event listener otomatis:
   * `window.addEventListener('beforeunload', purgeVaultMemory)`
   * Timer inaktivitas: otomatis mengunci setelah 15 menit tanpa aktivitas mouse/keyboard.
