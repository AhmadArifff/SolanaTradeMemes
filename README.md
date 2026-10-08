# SolanaTradeMemes

> **Pure Client-Side Multi-Wallet Trading Terminal for Solana Memecoins**  
> Eksekusi perdagangan instan multi-dompet dengan nol komputasi server, privasi kunci kriptografis total, dan kalkulasi PnL real-time.

---

## 1. Ikhtisar Arsitektur

SolanaTradeMemes beroperasi dengan model **Pure Client-Side Terminal (Zero Backend Execution)**. Seluruh manajemen kunci privat, penyusunan transaksi, penandatanganan kriptografis, dan penyiaran ke validator diproses langsung di peramban pengguna tanpa membebani server atau basis data terpusat.

```
+-----------------------------------------------------------------------------------------+
|                                  MONOREPO TECH STACK                                    |
|                                                                                         |
|  [Orchestrator]     : Turborepo + pnpm (Workspaces)                                     |
|  [Frontend App]     : Next.js 15 (App Router - Pure Client SPA / PWA on Vercel)         |
|  [State & Cache]    : Zustand (Client UI State) + TanStack Query v5 (5s Polling Engine) |
|  [Solana Engine]    : @solana/web3.js (v1.95+ v0 Versioned Tx) + bs58 + PumpPortal API   |
|  [Security Vault]   : Web Crypto API (SubtleCrypto PBKDF2 + AES-GCM-256) + IndexedDB     |
|  [Trade Ledger]     : IndexedDB persistent store + Realized PnL (Weighted Avg Cost)     |
|  [Schema & Types]   : Zod + TypeScript (Strict Mode)                                    |
|  [Design System]    : Tailwind CSS + Radix UI Primitives + Lucide + Sonner               |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Fitur Utama

* **Zero-Custody Local Vault:** Kunci privat dienkripsi menggunakan Web Crypto API (`PBKDF2` 100.000 iterasi + `AES-GCM-256`) dan disimpan di IndexedDB lokal. Kunci tidak pernah meninggalkan peramban.
* **Integrasi PumpPortal `trade-local`:** Memanggil API PumpPortal untuk merakit instruksi transaksi mentah tanpa mengekspos kunci, lalu dideserialisasi ke `VersionedTransaction` (v0) dan ditandatangani di memori RAM.
* **Penyiaran Paralel Multi-Dompet:** Menggunakan `Promise.allSettled()` untuk menembakkan transaksi dari 5 hingga 30 dompet secara serentak langsung ke Private RPC (Helius/QuickNode).
* **Pemantauan Harga Real-Time (5s Polling):** TanStack Query melakukan polling harga berkala setiap 5 detik dengan *adaptive throttling* otomatis (melambat saat tab tidak aktif).
* **Buku Besar Riwayat Transaksi & Realized PnL:** Mencatat seluruh transaksi beli/jual secara persisten di IndexedDB, menghitung keuntungan/kerugian terealisasi (Realized PnL & ROI %) per trade, serta menyediakan ekspor ke CSV/JSON.
* **Likuidasi Darurat ("Panic Sell All"):** 1-klik untuk menjual 100% saldo token di seluruh dompet sekaligus saat terindikasi *rug pull*.

---

## 3. Struktur Direktori Monorepo

```
SolanaTradeMemes/
├── apps/
│   ├── web/                     # Next.js 15 Client SPA / PWA Terminal (Vercel)
│   └── (future: desktop/cli)/   # Ekstensibilitas: Desktop (Tauri) atau CLI Sniper
├── packages/
│   ├── solana-engine/           # PumpPortal API, v0 Versioned Tx Signer, Broadcast
│   ├── crypto-vault/            # Web Crypto API, IndexedDB, Memory Zeroing
│   ├── types/                   # Zod Validation Schemas, TypeScript DTOs, Constants
│   ├── ui/                      # Shared Design System: Radix UI, Tailwind CSS tokens
│   ├── eslint-config/           # Standar konfigurasi linting
│   └── typescript-config/       # Konfigurasi tsconfig dasar
├── .agents/                     # Tata kelola agen AI, aturan, workflows, dan skills
├── AGENTS.md                    # File master tata kelola agen
├── PRD.md                       # Spesifikasi Kebutuhan Produk (PRD) v1.1 Monorepo
├── turbo.json                   # Konfigurasi Turborepo pipeline caching
└── pnpm-workspace.yaml          # Konfigurasi ruang kerja pnpm
```

---

## 4. Alur Kerja Git & Kolaborasi Tim (Git Workflow)

Proyek ini dikembangkan oleh tim kolaboratif multi-perangkat. Seluruh anggota tim wajib mematuhi aturan percabangan berikut:

### Aturan Percabangan
* **Branch `main`:** Khusus rilis produksi (*Production*). Terkunci dan stabil.
* **Branch `dev`:** **Branch aktif utama pengembangan.** Seluruh pekerjaan fitur, perbaikan bug, commit, dan push diarahkan ke branch `dev`.

### Protokol Wajib Sebelum Push (`git pull` Dahulu)
Untuk mencegah konflik kode antar-developer:

```bash
# 1. Pastikan berada di branch dev
git checkout dev

# 2. Tarik perubahan terbaru dari remote sebelum menulis kode baru
git pull --rebase origin dev

# 3. Setelah selesai bekerja, buat commit terstruktur
git add .
git commit -m "feat(modul): ringkasan perubahan"

# 4. Tarik kembali perubahan terbaru sebelum push
git pull --rebase origin dev

# 5. Push perubahan ke remote dev
git push origin dev
```

---

## 5. Dokumentasi Teknis

* **[PRD.md](./PRD.md):** Spesifikasi fungsional dan teknis lengkap.
* **[AGENTS.md](./AGENTS.md):** Tata kelola agen multi-role dan aturan arsitektur.
* **[.agents/](./.agents/README.md):** Peta navigasi aturan keamanan, alur kerja (SOP), bank kasus, dan skill khusus.
