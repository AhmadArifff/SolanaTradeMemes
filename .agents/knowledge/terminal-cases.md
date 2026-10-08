# Bank Kasus Bug & Preseden Teknis Terminal

Dokumen ini mencatat preseden bug teknis, penyebab akar (*root cause*), dan solusi terverifikasi untuk implementasi terminal perdagangan Solana pure client-side.

---

## Kasus 1: RPC Rate Limit (HTTP 429) Saat Penyiaran Batch Multi-Dompet

* **Gejala:** Saat menembakkan 15 transaksi serentak, hanya 3 transaksi pertama yang terkonfirmasi, sisanya gagal dengan error `429 Too Many Requests`.
* **Akar Masalah:** Menggunakan endpoint RPC publik bawaan Solana (`api.mainnet-beta.solana.com`) yang memiliki batas kuota ketat per IP klien.
* **Solusi Terverifikasi:**
  1. Wajibkan pengguna menginput Private RPC URL (Helius, QuickNode, atau Triton).
  2. Gunakan `connection.sendRawTransaction` dengan parameter `{ skipPreflight: true, maxRetries: 3 }` agar request langsung disalurkan ke TPU node tanpa pra-simulasi berulang.
  3. Bungkus penyiaran dalam `Promise.allSettled()` sehingga kegagalan satu dompet tidak membatalkan dompet lainnya.

---

## Kasus 2: Transaksi Gagal Akibat Mismatch Format Transaksi Legacy vs v0

* **Gejala:** Error `TypeError: Cannot read properties of undefined (reading 'compileMessage')` saat memproses transaksi dari PumpPortal.
* **Akar Masalah:** Kode mencoba mendeserialisasi payload menggunakan kelas legacy `Transaction.from()` padahal PumpPortal mengembalikan format `VersionedTransaction` (v0) yang memanfaatkan *Address Lookup Tables (ALT)*.
* **Solusi Terverifikasi:**
  1. Selalu gunakan `VersionedTransaction.deserialize(uint8Array)`.
  2. Gunakan `tx.sign([keypair])` langsung pada instance VersionedTransaction tanpa memodifikasi instruksi di dalamnya.

---

## Kasus 3: Kunci Privat Masih Tersisa di Memori Setelah Tombol Lock Ditekan

* **Gejala:** Nilai kunci privat masih dapat dibaca di developer tools memory snapshot setelah pengguna menekan tombol "Lock".
* **Akar Masalah:** Array byte kunci hanya di-dereference (`key = null`) tanpa menimpa (*zero-out*) buffer byte di memori sebelum menunggu garbage collection.
* **Solusi Terverifikasi:**
  1. Sebelum mendereferensikan array byte, jalankan `buffer.fill(0)` untuk menghapus jejak biner kunci di RAM.
  2. Hapus instans `Keypair` dari array state di Zustand store.

---

## Kasus 4: Latensi Eksekusi Lambat Akibat RPC Preflight Simulation

* **Gejala:** Transaksi membutuhkan waktu 800ms sampai 1200ms sebelum disiarkan ke jaringan, menyebabkan transaksi kalah cepat dari bot sniper lain.
* **Akar Masalah:** Default `sendRawTransaction` menjalankan pra-simulasi (`preflight simulation`) sebelum menyiarkan transaksi.
* **Solusi Terverifikasi:**
  1. Tetapkan `{ skipPreflight: true }` pada opsi penyiaran.
  2. Pantau status konfirmasi secara asinkron menggunakan `connection.getSignatureStatuses()` atau polling signature status terpisah.
