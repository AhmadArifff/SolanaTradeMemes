# SOP Audit Keamanan Kriptografi (Zero-Key-Exfiltration)

> **Kapan Digunakan:** Wajib dijalankan setiap kali ada perubahan pada paket `@repo/crypto-vault` atau alur penanganan kunci di `apps/web`.

---

## Daftar Periksa Audit Keamanan Kunci (Security Checklist)

1. **Pemeriksaan Isolasi Jaringan `@repo/crypto-vault`:**
   * Pastikan tidak ada modul `fetch`, `axios`, `WebSocket`, atau library eksternal yang diimpor ke dalam paket kriptografi.
   * Paket hanya boleh memanggil `window.crypto.subtle` dan `idb`.

2. **Pemeriksaan Penyimpanan Lokal:**
   * Pastikan `localStorage` dan `sessionStorage` TIDAK PERNAH menyimpan kunci privat, baik dalam bentuk plain maupun encrypted.
   * Seluruh data terenkripsi wajib tersimpan di IndexedDB terenkripsi.

3. **Verifikasi Parameter Web Crypto API:**
   * PBKDF2: Minimal 100.000 iterasi, hash SHA-256.
   * Salt: 16 byte acak kriptografis via `crypto.getRandomValues`.
   * AES-GCM: Kunci 256-bit, IV 12-byte acak unik untuk setiap entri.

4. **Pemeriksaan Sanitasi Memori:**
   * Pastikan fungsi `purgeVaultMemory()` membuang referensi `Keypair` dari heap memori.
   * Pastikan listener `beforeunload` dan timeout inaktivitas terpasang dengan benar.

5. **Pemeriksaan Higienitas Log:**
   * Pastikan tidak ada `console.log`, `console.warn`, atau `console.error` yang mencetak array byte kunci privat, seed, atau ciphertext.
