# 00-core-guardrails.md: Aturan Mutlak & Larangan Keras

Dokumen ini berisi batasan keamanan dan integritas arsitektur paling kritis pada proyek Solana Trade Memes. Seluruh agen wajib mematuhi aturan ini tanpa pengecualian.

---

## 1. Aturan Mutlak Keamanan Kunci Privat (Zero-Leakage Policy)

1. **DILARANG KERAS** mengirimkan kunci privat (baik dalam format Base58, array byte, seed phrase, maupun ciphertext tanpa izin) ke jaringan internet, peladen Vercel, API PumpPortal, atau logging service manapun.
2. **DILARANG KERAS** menyimpan kunci privat dalam bentuk teks mentah (*plaintext*) di media penyimpanan persisten browser manapun (`localStorage`, `sessionStorage`, `cookies`, atau unencrypted `IndexedDB`).
3. Kunci privat hanya boleh didekripsi ke dalam memori RAM peramban (variabel JavaScript `Uint8Array` / instance `Keypair`) selama sesi aktif terbuka (*unlocked*).
4. Setiap kunci privat yang disimpan di `IndexedDB` WAJIB terenkripsi menggunakan Web Crypto API (`AES-GCM-256`) dengan kunci turunan dari Master Password (`PBKDF2`, SHA-256, minimal 100.000 iterasi) beserta *Salt* dan *Initialization Vector* (IV) 12-byte acak.
5. Saat pengguna menekan "Lock Terminal" atau menutup tab peramban, seluruh referensi kunci di RAM WAJIB dimusnahkan seketika (*zeroed out* / dibuang dari referensi garbage collector).

---

## 2. Larangan Komputasi Server (Zero-Backend Signing Policy)

1. **DILARANG** membuat API Route Next.js (`/api/*`) atau Server Actions yang menerima kunci privat untuk menandatangani transaksi di server Vercel.
2. Vercel dan Next.js bertindak MURNI sebagai penyaji bundel statis dan logika antarmuka sisi klien (*Client-Side SPA / PWA*).
3. Seluruh penandatanganan transaksi Solana wajib berlangsung di peramban pengguna menggunakan modul `@repo/solana-engine`.

---

## 3. Larangan Penggunaan Karakter Em Dash (R-02 Anti-Slop)

1. **DILARANG KERAS** menggunakan karakter em dash (simbol tanda hubung panjang U+2014) di seluruh dokumen markdown, copywriting UI, pesan error, nama berkas, maupun komentar kode.
2. Gunakan tanda hubung standar `-`, titik dua `:`, tanda kurung `()`, atau koma `,` sebagai pengganti.

---

## 4. Larangan Dead Code & Kebersihan Iterasi

1. **DILARANG** meninggalkan kode mati (*dead code*), fungsi terbengkalai, komponen yang tidak diimpor, atau sisa artefak eksplorasi iterasi sebelumnya.
2. Saat melakukan refactoring atau perbaikan bug, seluruh kode usang WAJIB langsung dihapus tuntas.

---

## 5. Larangan Otomasi Browser Tanpa Izin

1. **DILARANG** menjalankan Playwright atau otomasi browser lainnya secara otomatis kecuali pengguna **secara eksplisit memintanya**.
2. Pengujian otomatis browser membutuhkan izin atau instruksi langsung dari pengguna.

---

## 6. Higienitas UI & Bahasa Manusia

1. **DILARANG** menampilkan jargon teknis internal atau rujukan aturan AI ke antarmuka pengguna (misal: "Disanitasi dengan PBKDF2 100000 iterasi", "Sesuai PRD Bab 4").
2. Gunakan mikrocopy yang profesional, elegan, singkat, dan berfokus pada manfaat trader (misal: "Vault Terkunci", "Eksekusi Berhasil: 5/5 Dompet", "Koneksi RPC Terhubung").
