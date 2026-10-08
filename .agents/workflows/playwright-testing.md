# SOP Pengujian Otomatis Playwright (Hanya Jika Diminta)

> **PENTING:** Pengujian Playwright DILARANG dijalankan secara otomatis kecuali pengguna **secara eksplisit memintanya**.

---

## 1. Prasyarat & Penyiapan

1. Pastikan server dev `apps/web` telah aktif:
   ```bash
   pnpm --filter web dev
   ```
2. Pastikan port lokal (misal `http://localhost:3000`) dapat diakses.

---

## 2. Cakupan Skenario Pengujian

1. **Test Case 1: Inisialisasi Vault & Setup Master Password**
   * Buka terminal di peramban.
   * Masukkan Master Password dummy.
   * Verifikasi bahwa vault berhasil diinisialisasi dan masuk ke layar utama.
2. **Test Case 2: Impor Dompet Dummy**
   * Masukkan private key Base58 dummy (Solana devnet).
   * Verifikasi tabel dompet menampilkan alamat public key yang sesuai.
3. **Test Case 3: Polling Harga & Input Kontrak**
   * Masukkan alamat mint token target.
   * Verifikasi indikator polling aktif dan harga terisi.
4. **Test Case 4: Penguncian Terminal**
   * Klik tombol "Lock Terminal".
   * Verifikasi layar beralih ke form login Master Password dan data sensitif tersembunyi.
