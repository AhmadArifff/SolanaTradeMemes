# 50-testing-qa-standards.md: Standar Pengujian & Jaminan Kualitas (QA)

Dokumen ini mendefinisikan standar pengujian otomatis untuk paket-paket monorepo dan antarmuka aplikasi.

---

## 1. Unit Testing Terisolasi (Vitest)

1. Paket `@repo/crypto-vault` dan `@repo/solana-engine` WAJIB memiliki rangkaian unit test berbasis Vitest.
2. **Kubah Kriptografi Test Vectors:**
   * Uji enkripsi dan dekripsi menggunakan kunci dan kata sandi dummy.
   * Pastikan output dekripsi 100% identik dengan byte array asli.
   * Uji kegagalan dekripsi jika kata sandi salah (wajib melempar error tanpa membocorkan ciphertext).
   * Uji fungsi `purgeVaultMemory()` untuk memastikan referensi memori benar-benar terhapus.
3. **Mesin Solana Unit Tests:**
   * Uji deserialisasi byte array v0 mentah ke `VersionedTransaction`.
   * Uji penandatanganan menggunakan Keypair dummy.
   * Mocking pemanggilan API `https://pumpportal.fun/api/trade-local` dan pemanggilan RPC `sendRawTransaction`.

---

## 2. End-to-End Testing (Playwright)

1. **Aturan Mutlak:** Pengujian Playwright HANYA dijalankan jika pengguna **secara eksplisit memintanya**.
2. Cakupan alur E2E yang disiapkan:
   * Alur Setup Master Password $\rightarrow$ Inisialisasi Vault.
   * Alur Impor Dompet $\rightarrow$ Muncul di Data Table.
   * Alur Input Token CA $\rightarrow$ Polling Harga Muncul.
   * Alur Kunci Terminal $\rightarrow$ Layar Kembali ke Form Master Password.
3. Gunakan mode headless dengan penangkapan screenshot hanya jika terjadi kegagalan (*on failure*).
