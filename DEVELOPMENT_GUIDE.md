# Panduan Kolaborasi & Pengembangan Tim (DEVELOPMENT_GUIDE.md)

> **Solana Trade Memes (Pure Client-Side Multi-Wallet Trading Terminal)**  
> Panduan teknis komprehensif bagi seluruh anggota tim pengembang dan agen AI untuk memastikan kolaborasi terstandarisasi, aman, dan selaras dengan PRD v1.1.

---

## 1. Ikhtisar Arsitektur & Prinsip Utama

Sistem ini dibangun dengan arsitektur **Turborepo + pnpm Workspaces** dengan prinsip **Pure Client-Side Terminal (Zero Backend Execution)**:

1. **Zero-Custody Local Vault:** Kunci privat tidak pernah dikirim ke internet, peladen Vercel, maupun API PumpPortal. Kunci hanya didekripsi ke RAM peramban pengguna saat sesi aktif.
2. **Kriptografi Standar Tinggi:** Menggunakan Web Crypto API (`PBKDF2` 100.000 iterasi SHA-256 + `AES-GCM-256`) dengan Salt 16-byte dan IV 12-byte acak per dompet.
3. **Pemusnahan Memori (Memory Purge):** Saat sesi dikunci atau tab ditutup, buffer byte kunci di RAM wajib di-zero-out (`buffer.fill(0)`) dan referensi `Keypair` dibuang.
4. **Isolasi Batas Paket Monorepo:**
   * `apps/web`: Aplikasi Next.js 15 Client SPA / PWA (Zustand, TanStack Query 5s adaptive polling, Tailwind CSS, Lucide, Sonner).
   * `packages/solana-engine`: Logika transaksi Solana murni (PumpPortal `/api/trade-local`, deserialisasi `VersionedTransaction` v0, penandatanganan lokal di RAM, penyiaran paralel `Promise.allSettled`). Bebas dependensi UI.
   * `packages/crypto-vault`: Kubah kriptografi Web Crypto API dan IndexedDB (`idb`). **Dilarang keras mengimpor modul jaringan/HTTP (Zero Network Egress)**.
   * `packages/types`: Single Source of Truth untuk kontrak skema runtime Zod, antarmuka TypeScript, DTOs, dan konstanta default.
   * `packages/ui`: Komponen visual desain sistem terstandardisasi (Cyberpunk Dark Mode DeFi, Radix UI primitives, data table).
   * `packages/typescript-config` & `packages/eslint-config`: Standar konfigurasi kompilasi dan linting bersama.

---

## 2. Protokol Kolaborasi Git Tim (Multi-Device Workflow)

Untuk mencegah konflik kode antar-developer dan antar-perangkat, tim wajib mematuhi aturan percabangan berikut:

### 2.1 Aturan Percabangan
* **Branch `main`:** Khusus rilis produksi stabil (*Production*). Terkunci dan hanya menerima merge dari `dev`.
* **Branch `dev`:** **Branch aktif utama untuk seluruh tim pengembangan.** Seluruh pekerjaan fitur, perbaikan bug, commit, dan push WAJIB diarahkan ke branch `dev`.

### 2.2 Siklus Standar Pengembangan Harian
```bash
# 1. Pastikan berada di branch dev
git checkout dev

# 2. WAJIB: Tarik perubahan terbaru dari remote sebelum menulis kode baru
git pull --rebase origin dev

# 3. Lakukan pekerjaan pengembangan atau perbaikan bug

# 4. Periksa status berkas
git status

# 5. Tambahkan perubahan ke staging
git add <file-paths>

# 6. Buat commit terstruktur (Conventional Commits)
git commit -m "feat(modul): ringkasan perubahan jelas"

# 7. WAJIB: Tarik kembali perubahan terbaru dari remote sebelum push
git pull --rebase origin dev

# 8. Push perubahan ke remote dev
git push origin dev
```

### 2.3 Larangan Keras Git
* **DILARANG** melakukan `git push --force` ke branch `dev` maupun `main`.
* **DILARANG** melakukan commit langsung ke branch `main` untuk pekerjaan development harian.
* **DILARANG** meninggalkan file scratch sementara atau kredensial rahasia di repositori git.

---

## 3. Tata Kelola Sesi & Pelacakan PRD (.agents/02-session-state/)

Untuk memastikan seluruh agen AI dan developer di berbagai perangkat memiliki pemahaman status yang sinkron, sistem menggunakan mekanisme **Active Session State**:

* **Lokasi Berkas:** `.agents/02-session-state/active-session.json` (CLI: `node .agents/02-session-state/session-manager.js`)
* **Tujuan:**
  1. Melacak tujuan aktif saat ini (`active_goal`).
  2. Mencatat milestone yang telah terverifikasi lolos (`completed_milestones`) beserta nomor seksi PRD yang dicakup.
  3. Mengunci keputusan arsitektur dan batasan teknis (`established_constraints`) agar tidak terjadi pergeseran tujuan (*goal drift*).
  4. Menyediakan daftar aksi terdekat yang direkomendasikan (`next_recommended_actions`).
  5. Memetakan 5 Epic utama PRD ke status pengerjaan nyata (`prd_tracking`).

> [!IMPORTANT]
> **Protokol Sinkronisasi Sesi:** Setiap kali ada penyelesaian milestone baru, penambahan fitur, atau instruksi kerja baru, perbarui `active-session.json`, lakukan commit, dan push ke branch `dev` agar tim lain dapat melanjutkan dengan konteks yang akurat.

---

## 4. Evaluasi 7 Pilar Sebelum Menulis Kode (Review Gate)

Sebelum menulis atau mengedit kode, developer dan agen AI wajib mengevaluasi 7 pilar kelayakan:

1. **Pilar 1 (Scope):** Apakah perubahan berada dalam batasan PRD v1.1 dan model Pure Client-Side?
2. **Pilar 2 (Security):** Apakah ada potensi kebocoran kunci privat atau pelanggaran isolasi RAM?
3. **Pilar 3 (Monorepo Boundary):** Apakah kode ditempatkan di paket yang tepat tanpa pelanggaran dependensi (misal: dilarang mengimpor fetch di crypto-vault)?
4. **Pilar 4 (Performance):** Apakah eksekusi penandatanganan (< 50ms) dan penyiaran tetap non-blocking?
5. **Pilar 5 (UX/UI):** Apakah tampilan mematuhi tema Cyberpunk Dark DeFi terminal dengan kontras WCAG AA?
6. **Pilar 6 (Edge Cases):** Bagaimana mitigasi kegagalan jika PumpPortal timeout, RPC HTTP 429, atau saldo SOL tidak mencukupi untuk rent reserve?
7. **Pilar 7 (Rollback & Modularity):** Apakah modul mudah di-revert tanpa mengganggu paket lainnya?

---

## 5. Standar Rekayasa Kode & Anti-Slop Policy

1. **Bebas Karakter Em Dash (Aturan R-02):**
   * Dilarang keras menggunakan simbol em dash (U+2014) di seluruh dokumen markdown, copywriting UI, pesan error, nama berkas, maupun komentar kode.
   * Gunakan tanda hubung biasa `-`, titik dua `:`, atau tanda kurung `()`.
2. **Guard Clauses & Early Return:**
   * Hindari penulisan `if-else` bertingkat dalam (*pyramid of doom*). Validasi kondisi gagal di awal fungsi dan lakukan return langsung.
3. **Result Pattern pada Service Layer:**
   * Kembalikan objek `{ success: true, data }` atau `{ success: false, error }` untuk memudahkan penanganan error tanpa crash runtime.
4. **Zero Dead Code:**
   * Hapus tuntas kode usang, berkas eksperimen sementara, dan fungsi yang tidak diimpor.
5. **Polyfill Buffer di Browser:**
   * Pastikan polyfill `buffer` aktif pada runtime Next.js 15 client-side agar pustaka `@solana/web3.js` dan `bs58` berjalan tanpa error `Buffer is not defined`.

---

## 6. Persiapan Lingkungan Pengembangan Lokal

### 6.1 Kebutuhan Sistem
* Node.js: `v22.x` atau lebih baru
* Package Manager: `pnpm` (versi 10.x atau 12.x)
* Git

### 6.2 Langkah Instalasi & Menjalankan Proyek
```bash
# 1. Kloning repositori (jika baru) dan beralih ke dev
git checkout dev
git pull --rebase origin dev

# 2. Salin template environment
cp .env.example .env.local

# 3. Isi variabel penting pada .env.local (lihat CONFIG_GUIDE.md)
# Terutama: NEXT_PUBLIC_SOLANA_RPC_URL (Helius Private RPC)

# 4. Instalasi seluruh dependensi workspace
pnpm install

# 5. Jalankan server pengembangan
pnpm dev

# 6. Menjalankan pengujian unit (Vitest)
pnpm test

# 7. Menjalankan pemeriksaan tipe & linter
pnpm build
pnpm lint
```

---

## 7. Matriks Pelacakan Milestone PRD v1.1

| Milestone | Ruang Lingkup | Target Paket | Status |
| :--- | :--- | :--- | :--- |
| **M0: Setup Fondasi & Tata Kelola** | PRD v1.1, AGENTS.md, CONFIG_GUIDE.md, DEVELOPMENT_GUIDE.md, session-state | Root, `.agents/` | **SELESAI (PASS)** |
| **M1: Kontrak Skema & Tipe Data** | Zod schemas, TypeScript types, DTOs, konstanta RPC & Trading | `packages/types` | SIAP DIKERJAKAN |
| **M2: Kubah Kriptografi Terisolasi** | PBKDF2, AES-GCM-256, IndexedDB (`idb`), RAM memory zeroing, Vitest | `packages/crypto-vault` | SIAP DIKERJAKAN |
| **M3: Mesin Eksekusi Solana** | PumpPortal trade-local, VersionedTx v0 signer, `Promise.allSettled`, Vitest | `packages/solana-engine` | SIAP DIKERJAKAN |
| **M4: Desain Sistem & Komponen UI** | Radix UI primitives, Tailwind CSS tokens, Glassmorphism, Data Table | `packages/ui` | DIRENCANAKAN |
| **M5: Terminal Frontend Next.js 15** | TanStack Query 5s polling, Zustand store, Panic Sell All, Trade Ledger | `apps/web` | DIRENCANAKAN |
| **M6: Audit Keamanan & Integrasi Akhir** | Zero-leakage audit, error resilience testing, sanitasi memori akhir | Seluruh Workspace | DIRENCANAKAN |

---

## 8. Panduan Berkas Dokumentasi Terkait

* **[PRD.md](./PRD.md):** Spesifikasi Kebutuhan Produk lengkap (14 Seksi).
* **[CONFIG_GUIDE.md](./CONFIG_GUIDE.md):** Panduan langkah demi langkah memperoleh kredensial RPC Helius, QuickNode, PumpPortal, DexScreener, dan Supabase.
* **[AGENTS.md](./AGENTS.md):** Tata kelola orkestrasi multi-agen dan pemetaan skill AI.
* **[.agents/02-session-state/active-session.json](./.agents/02-session-state/active-session.json):** Status sesi aktif dan pelacakan batasan teknis.
* **[.agents/knowledge/terminal-cases.md](./.agents/knowledge/terminal-cases.md):** Bank kasus penanganan bug rate limit RPC, format v0, dan pembersihan memori RAM.
