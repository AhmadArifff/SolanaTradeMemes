# Product Requirements Document (PRD): Solana Pure Client-Side Multi-Wallet Trading Terminal (Monorepo Architecture)

**Product:** Solana Trade Memes (Pure Client-Side Terminal)  
**Author:** Lead Systems Product Manager  
**Date:** 2026-10-08  
**Version:** v1.1 (Monorepo Edition)  
**Status:** Approved for Implementation  
**Architecture:** Turborepo + pnpm Workspaces  
**Target Platform:** Web (Desktop-first Optimized, Responsive PWA Ready)  

---

## 1. Executive Summary

Solana Pure Client-Side Trading Terminal adalah platform eksekusi perdagangan memecoin terdesentralisasi berkinerja tinggi yang dirancang khusus untuk trader desentralisasi (degen/scalper) di ekosistem Solana. Sistem ini beroperasi 100% pada model **Pure Client-Side Architecture**, di mana seluruh manajemen kunci privat, deskripsi instruksi, penandatanganan transaksi (signing), dan penyiaran (broadcast) dieksekusi secara lokal di dalam peramban (browser) pengguna tanpa perantara backend server, database terpusat, maupun beban komputasi di Vercel.

Dalam pembaruan v1.1, proyek ini distrukturkan menggunakan arsitektur **Monorepo (Turborepo + pnpm)**. Pemisahan modular ini memisahkan logika UI antarmuka (`apps/web`), mesin eksekusi Solana (`packages/solana-engine`), kubah keamanan kriptografi lokal (`packages/crypto-vault`), sistem desain antarmuka (`packages/ui`), dan kontrak tipe data bersama (`packages/types`). Pendekatan ini menjamin isolasi keamanan ketat pada modul kriptografi, pengujian unit yang terisolasi, serta membuka kemampuan ekspansi ke aplikasi desktop (Tauri) atau headless CLI di masa depan.

---

## 2. Problem Statement & Latar Belakang

### 2.1 Latar Belakang Industri
Perdagangan memecoin di Solana (khususnya ekosistem Pump.fun dan Raydium) membutuhkan kecepatan eksekusi sub-detik (*sub-second execution*) dan strategi multi-dompet (*multi-wallet bundling / sniping*). Saat ini, sebagian besar bot perdagangan yang beredar (seperti Telegram trading bot atau SaaS trading platform) mengadopsi model kustodian berbasis server:
1. Pengguna wajib menitipkan *private key* mereka ke basis data server pengembang bot.
2. Server pengembang menjadi sasaran empuk peretasan database, serangan penarikan dana ilegal (*exit scam* / *rug pull* oleh oknum internal), atau eksfiltrasi kredensial.
3. Ketergantungan server runtime terpusat (seperti serverless functions Vercel atau AWS Lambda) rentan mengalami *timeout* (10-15 detik), *rate limiting*, dan biaya komputasi yang mahal saat memproses ratusan penandatanganan transaksi secara serentak.

### 2.2 Pernyataan Masalah
> **Masalah Utama:** Trader membutuhkan terminal multi-dompet berkecepatan tinggi yang dapat mengeksekusi transaksi secara paralel tanpa pernah mengekspos kunci privat ke server pihak ketiga manapun, tanpa risiko kebocoran database, dan tanpa batasan komputasi server terpusat.
> 
> **Pihak Terdampak:** Solana memecoin traders, sniper, liquidity providers, dan sindikat trader multi-wallet.
> 
> **Dampak Risiko Saat Ini:** Potensi kerugian 100% modal akibat kebocoran database server pihak ketiga, latensi eksekusi tinggi akibat antrean pemrosesan server perantara, dan kegagalan transaksi beruntun akibat RPC rate-limiting terpusat.

---

## 3. Profil Pengguna (Target Personas)

### 3.1 Persona Utama: Algorithmic & High-Frequency Meme Scalper
* **Nama:** "Solana Degen / Multi-Wallet Sniper"
* **Karakteristik:** Memiliki 5 sampai 30 dompet burner/sekunder untuk mendistribusikan volume pembelian, meminimalkan slippage, dan menghindari deteksi pelacak dompet tunggal.
* **Tujuan Utama:** Menembakkan transaksi beli/jual secara serentak ke semua dompet dalam 1 blok slot Solana (< 400ms).
* **Frustrasi Utama:** Server bot trading lempar transaksi secara lambat (*lagging*), kunci privat disimpan di database server yang rentan di-hack, limit kuota RPC publik membuat transaksi gagal masal (*drop transactions*).

### 3.2 Anti-Persona (Bukan Sasaran Target)
* **Pengguna:** Investor kasual jangka panjang (*long-term passive holder*) yang hanya bertransaksi 1 bulan sekali dengan hardware wallet (Ledger) dan membutuhkan panduan langkah demi langkah yang ramah pemula.

---

## 4. Arsitektur Monorepo & Struktur Direktori

Sistem menggunakan **Turborepo** dengan manajer paket **pnpm (Workspaces)** untuk orkestrasi *build pipeline*, *caching*, dan resolusi dependensi yang ketat.

```
SolanaTradeMemes/
├── apps/
│   ├── web/                          # Next.js 15 (App Router) Pure Client Terminal & PWA
│   └── (future: desktop/cli)/        # Ekstensibilitas: Desktop Terminal (Tauri) / Headless Bot
├── packages/
│   ├── solana-engine/                # Engine Solana: PumpPortal client, v0 signer, broadcast
│   ├── crypto-vault/                 # Kriptografi lokal: Web Crypto API, PBKDF2, AES-GCM, idb
│   ├── types/                        # Kontrak tipe TypeScript, Zod validation schemas, constants
│   ├── ui/                           # Sistem desain UI: Radix UI primitives, Tailwind CSS tokens
│   ├── eslint-config/                # Standar konfigurasi linting bersama
│   └── typescript-config/            # Konfigurasi tsconfig dasar
├── pnpm-workspace.yaml               # Definisi workspace monorepo
├── turbo.json                        # Definisi pipeline task build, test, lint, dev
├── package.json                      # Konfigurasi root monorepo
└── PRD.md                            # Dokumen spesifikasi kebutuhan produk
```

### 4.1 Pembagian Peran Aplikasi & Paket Monorepo

| Paket / Aplikasi | Peran & Tanggung Jawab Utama | Dependensi Kunci |
| :--- | :--- | :--- |
| `apps/web` | Penyaji antarmuka visual (UI), state sesi, dan orkestrator alur kerja di peramban. Dihosting statis di Vercel. | `next`, `react`, `@tanstack/react-query`, `zustand`, `@repo/solana-engine`, `@repo/crypto-vault`, `@repo/types`, `@repo/ui` |
| `packages/solana-engine` | Logika transaksi Solana murni: pemanggilan API PumpPortal `trade-local`, deserialisasi `VersionedTransaction` (v0), penandatanganan dengan Keypair lokal, dan penyiaran paralel via `Promise.allSettled`. | `@solana/web3.js`, `@solana/spl-token`, `bs58`, `@repo/types` |
| `packages/crypto-vault` | Manajemen enkripsi/dekripsi lokal tanpa dependensi jaringan: Web Crypto API (SubtleCrypto PBKDF2 + AES-GCM-256), penyimpanan terenkripsi IndexedDB (`idb`), dan pemusnahan memori (*memory zeroing*). | `idb`, `@repo/types` (Zero external network dependencies) |
| `packages/types` | Kontrak data bersama (*single source of truth*): Skema validasi runtime Zod, tipe TypeScript untuk wallet, transaksi, respons PumpPortal, dan konstanta default RPC. | `zod` |
| `packages/ui` | Komponen visual desain sistem terstandardisasi: Glassmorphism shell, data table, dialog konfirmasi, metrik kartu, tombol aksi cepat. | `tailwindcss`, `@radix-ui/react-*`, `lucide-react`, `sonner` |

---

## 5. Review & Rekomendasi Tech Stack

Berikut adalah analisis dan evaluasi menyeluruh terhadap pemilihan teknologi:

```
+-----------------------------------------------------------------------------------------+
|                                  MONOREPO TECH STACK                                    |
|                                                                                         |
|  [Orchestrator]     : Turborepo + pnpm (Workspaces)                                     |
|  [Frontend App]     : Next.js 15 (App Router - Pure Client SPA / PWA on Vercel)         |
|  [State & Cache]    : Zustand (Client UI State) + TanStack Query v5 (5s Polling Engine) |
|  [Solana Engine]    : @solana/web3.js (v1.95+ v0 Versioned Tx) + bs58 + PumpPortal API   |
|  [Security Vault]   : Web Crypto API (SubtleCrypto PBKDF2 + AES-GCM-256) + IndexedDB     |
|  [Schema & Types]   : Zod + TypeScript (Strict Mode)                                    |
|  [Design System]    : Tailwind CSS + Radix UI Primitives + Lucide + Sonner               |
|  [Testing Pipeline] : Vitest (Unit Tests Packages) + Playwright (E2E Browser Automation) |
+-----------------------------------------------------------------------------------------+
```

### 5.1 Evaluasi Lapisan Monorepo (Turborepo + pnpm)
* **Kelebihan Utama:**
  1. **Strict Security Isolation:** Paket `packages/crypto-vault` tidak memiliki akses ke dependensi jaringan atau UI. Ini mempermudah audit keamanan karena kodenya terisolasi 100%.
  2. **Zero Dependency Duplication:** Pustaka berat seperti `@solana/web3.js` hanya diinstal satu kali dan di-*symlink* oleh pnpm secara efisien.
  3. **High-Speed Build Caching:** Turborepo menyimpan cache hasil kompilasi dan linting sehingga proses CI/CD dan verifikasi lokal berjalan dalam hitungan detik.
  4. **Ekstensibilitas Masa Depan:** Jika tim ingin membangun aplikasi desktop (`apps/desktop` via Tauri) untuk performa lebih ekstrem, seluruh paket inti (`solana-engine`, `crypto-vault`, `types`) dapat langsung digunakan kembali tanpa menulis ulang kode.

### 5.2 Evaluasi Frontend (`apps/web`)
* **Framework:** Next.js 15 (App Router)
  * **Strategi Rendering:** Pure Client-Side SPA (`'use client'`). Server Actions dinonaktifkan untuk transaksi. Halaman diekspor sebagai aset statis (*Static Export*) sehingga Vercel bertindak murni sebagai CDN berlatensi ultra-rendah.
  * **Kemampuan PWA:** Dilengkapi *Service Worker* dasar untuk *offline asset caching*, memungkinkan terminal dibuka seketika layaknya aplikasi desktop.
* **State Management:**
  * **Zustand:** Mengelola state ringan lokal (status unlock vault, daftar dompet aktif terpilih, preferensi slippage, dan konfigurasi RPC URL).
  * **TanStack Query v5:** Mengelola interval polling harga 5 detik, pembaruan saldo akun token, serta refetching reaktif dengan *window focus / visibility detection*.

### 5.3 Evaluasi Mesin Solana (`packages/solana-engine`)
* **Solana SDK:** `@solana/web3.js` (versi 1.95+)
  * Wajib mendukung `VersionedTransaction` (v0) dan `MessageV0`.
  * Integrasi PumpPortal: Endpoint `https://pumpportal.fun/api/trade-local` mengembalikan *serialized unsigned transaction buffer* yang langsung dideserialisasi di memori klien.
* **Penyiaran Paralel:** Menggunakan `Promise.allSettled()` yang mengeksekusi `connection.sendRawTransaction()` secara serentak ke Private RPC dengan opsi `{ skipPreflight: true, maxRetries: 3 }`.

### 5.4 Evaluasi Kubah Kriptografi (`packages/crypto-vault`)
* **Kriptografi:** Web Crypto API bawaan browser (`window.crypto.subtle`).
  * Menggunakan `PBKDF2` (100.000 iterasi, SHA-256) untuk menghasilkan derivasi enkripsi dari Master Password.
  * Menggunakan `AES-GCM` 256-bit dengan *Initialization Vector* (IV) 12-byte unik per entri dompet.
* **Penyimpanan:** IndexedDB via pustaka `idb` (ukuran pustaka < 2 kB, performa asynchronous non-blocking).
* **Sanitasi Memori:** Menyediakan fungsi `purgeVaultMemory()` yang menghapus instance `Keypair` dari memori heap JavaScript saat pengguna menekan tombol "Lock" atau saat tab browser ditutup (`beforeunload`).

---

## 6. Diagram Alur & Interaksi Antar-Paket

```
+-----------------------------------------------------------------------------------------------+
|                                  USER BROWSER RUNTIME                                         |
|                                                                                               |
|   +---------------------------------------------------------------------------------------+   |
|   | apps/web (Next.js UI Terminal)                                                        |   |
|   |                                                                                       |   |
|   |  [Master Password Input] ----> memanggil @repo/crypto-vault                           |   |
|   |                                         |                                             |   |
|   |                                         v                                             |   |
|   |                         +-----------------------------------+                         |   |
|   |                         | packages/crypto-vault             |                         |   |
|   |                         | - PBKDF2 Master Key Derivation    |                         |   |
|   |                         | - AES-GCM-256 Decrypt IndexedDB   |                         |   |
|   |                         +-----------------+-----------------+                         |   |
|   |                                           |                                           |   |
|   |                                           v                                           |   |
|   |                         [Decrypted Keypairs di RAM]                                   |   |
|   |                                           |                                           |   |
|   |  [Input Token CA & Nominal]               |                                           |   |
|   |  [5s Polling Price via TanStack Query]    |                                           |   |
|   |          |                                |                                           |   |
|   |          v                                v                                           |   |
|   |  [Klik "Execute Buy/Sell"] ---> memanggil @repo/solana-engine                          |   |
|   |                                           |                                           |   |
|   +-------------------------------------------|-------------------------------------------+   |
|                                               |                                               |
|   +-------------------------------------------v-------------------------------------------+   |
|   | packages/solana-engine                                                                |   |
|   |                                                                                       |   |
|   |  1. HTTP POST ke PumpPortal /api/trade-local (Mengirim Pubkey & Param)                |   |
|   |     <--- Menerima Unsigned Raw VersionedTx Buffer                                     |   |
|   |  2. Deserialisasi ke VersionedTransaction (v0) via @solana/web3.js                    |   |
|   |  3. Penandatanganan Lokal dengan Keypair dari RAM                                     |   |
|   |  4. Penyiaran Paralel via Promise.allSettled() langsung ke Private RPC                |   |
|   +-------------------------------------------+-------------------------------------------+   |
+-----------------------------------------------|-----------------------------------------------+
                                                | Direct Browser HTTP POST
                                                v
                      +---------------------------------------------------+
                      | Private Solana RPC Node (Helius / QuickNode)      |
                      | - sendRawTransaction ({ skipPreflight: true })    |
                      +-------------------------+-------------------------+
                                                |
                                                v
                      +---------------------------------------------------+
                      | Solana Validator Cluster (Slot Inclusion & Block) |
                      +---------------------------------------------------+
```

---

## 7. Rincian Modul & Spesifikasi Fungsional

### 7.1 Modul Vault Kriptografi (`packages/crypto-vault`)
* **Kebutuhan Fungsional:**
  1. **Inisialisasi Master Password:** Pengguna menentukan Master Password saat pertama kali menggunakan aplikasi.
  2. **Derivasi Kunci Simetris:** Menggunakan `crypto.subtle.deriveKey` dengan parameter PBKDF2 (Salt 16-byte acak, SHA-256, 100.000 iterasi) untuk menghasilkan kunci AES-GCM 256-bit.
  3. **Enkripsi Kunci Privat:** Setiap private key dienkripsi menggunakan AES-GCM dengan IV 12-byte acak, lalu disimpan ke IndexedDB sebagai objek biner terenkripsi.
  4. **Pemusnahan Memori (Memory Zeroing):** Menyediakan mekanisme eksplisit untuk menghapus referensi kunci di RAM saat sesi terkunci atau tidak aktif selama 15 menit.
  5. **Validasi Skema:** Menggunakan skema validasi dari `@repo/types` untuk memastikan kunci privat berformat Base58 dengan panjang valid (64 bytes).

### 7.2 Modul Mesin Solana (`packages/solana-engine`)
* **Kebutuhan Fungsional:**
  1. **Integrasi PumpPortal Trade-Local:**
     * Membangun payload transaksi:
       ```typescript
       interface TradeLocalRequest {
         publicKey: string;
         action: "buy" | "sell";
         mint: string;
         amount: number;
         denominatedInSol: boolean;
         slippage: number;
         priorityFee: number;
         pool: "pump" | "raydium";
       }
       ```
     * Mengirim permintaan POST ke `https://pumpportal.fun/api/trade-local`.
     * Menerima byte array transaksi tanpa tanda tangan.
  2. **Deserialisasi & Penandatanganan v0:**
     * Mengonversi buffer byte menjadi `VersionedTransaction.deserialize(buffer)`.
     * Menandatangani pesan transaksi menggunakan `tx.sign([localKeypair])`.
  3. **Penyiaran Paralel:**
     * Menjalankan penyiaran serentak menggunakan `Promise.allSettled()` ke RPC privat yang dikonfigurasi.
     * Mengembalikan status per dompet:
       ```typescript
       interface TradeExecutionResult {
         publicKey: string;
         status: "success" | "error";
         signature?: string;
         error?: string;
       }
       ```

### 7.3 Modul Pemantauan & Portofolio (`apps/web`)
* **Kebutuhan Fungsional:**
  1. **Polling Harga 5 Detik:** Menggunakan TanStack Query dengan interval polling 5000ms untuk mengambil harga token dari DexScreener atau PumpPortal API.
  2. **Throttling Cerdas:** Memperlambat interval polling menjadi 30 detik jika jendela browser tidak aktif (`document.hidden = true`).
  3. **Kalkulasi Laba-Rugi Lokal:**
     * Menghitung nilai token real-time: `Saldo Token Dompet x Harga Token Terkini`.
     * Menghitung persentase laba-rugi (*Unrealized PnL*): `((Nilai Saat Ini - Modal Beli) / Modal Beli) x 100%`.
     * Menampilkan metrik agregat: Total Investasi SOL, Nilai Portofolio Terkini, dan Net PnL.

### 7.4 Modul Buku Besar Riwayat Transaksi & Realized PnL (`trade_ledger`)
* **Kebutuhan Fungsional:**
  1. **Penyimpanan Riwayat Persisten (IndexedDB `trade_history`):**
     * Setiap kali transaksi BUY atau SELL terkonfirmasi di blockchain, catatan transaksi disimpan secara lokal di IndexedDB agar riwayat tidak hilang saat peramban ditutup.
     * Skema Data Catatan Buku Besar (`TradeLedgerEntry`):
       ```typescript
       interface TradeLedgerEntry {
         id: string; // UUID v4
         timestamp: number;
         walletPublicKey: string;
         walletLabel: string;
         action: "buy" | "sell";
         tokenMint: string;
         tokenSymbol?: string;
         tokenAmount: number;
         solAmount: number;
         pricePerTokenSol: number;
         signature: string;
         costBasisSol?: number; // Modal beli yang dialokasikan (pada order SELL)
         realizedPnlSol?: number; // Profit/Loss SOL yang terealisasi (pada order SELL)
         realizedPnlPercent?: number; // ROI % yang terealisasi (pada order SELL)
       }
       ```
  2. **Kalkulasi Realized PnL (Weighted Average Cost Basis):**
     * Saat BUY: Akumulasi jumlah token yang dibeli dan modal SOL yang dikeluarkan pada posisi terbuka (*Open Position*).
     * Saat SELL:
       $$\text{Cost Basis Proposional} = \left(\frac{\text{Token Dijual}}{\text{Total Token Dimiliki}}\right) \times \text{Total Modal Beli SOL}$$
       $$\text{Realized PnL (SOL)} = \text{SOL Diterima} - \text{Cost Basis Proposional}$$
       $$\text{Realized ROI (\%)} = \left(\frac{\text{Realized PnL (SOL)}}{\text{Cost Basis Proposional}}\right) \times 100\%$$
  3. **Dashboard Statistik Performa Sesi (Session Analytics):**
     * Menampilkan ringkasan metrik: Total Realized PnL (SOL & USD), Win Rate % (rasio transaksi untung vs rugi), dan Rata-rata ROI per Trade.
  4. **Fitur Ekspor Riwayat:**
     * Menyediakan opsi ekspor buku besar transaksi ke format CSV dan JSON untuk kebutuhan pencatatan dan audit pribadi.

### 7.5 Modul Likuidasi Darurat ("Panic Sell All") & Preset Cepat
* **Kebutuhan Fungsional:**
  1. **Panic Sell All:** Tombol darurat 1-klik untuk menjual 100% saldo token di seluruh dompet terpilih secara serentak ke validator guna memitigasi kerugian saat terjadi indikasi *rug pull*.
  2. **Preset Profil Transaksi:** Pilihan preset cepat untuk Slippage dan Priority Fee (Normal: 5% / 0.001 SOL, Fast: 15% / 0.005 SOL, Turbo: 25% / 0.01 SOL, serta Custom) agar trader dapat bereaksi instan tanpa mengetik ulang.
  3. **Rent-Exempt Reserve Guard:** Pengecekan otomatis agar dompet tidak menghabiskan seluruh SOL saat beli, menyisakan minimal ~0.005 SOL untuk biaya sewa akun token (ATA) dan gas fee transaksi jual berikutnya.

---

## 8. Alur Pipeline Data & Eksekusi

| Tahapan | Komponen Monorepo | Lokasi Pemrosesan | Input | Output |
| :--- | :--- | :--- | :--- | :--- |
| **1. Unlock Vault** | `@repo/crypto-vault` | Browser RAM | Master Password | Instance Keypair aktif di RAM |
| **2. Input Target** | `apps/web` | UI Input | Contract Address (Mint) | Data target token terverifikasi |
| **3. Monitoring** | `apps/web` + TanStack Query | Browser Background | Token Mint Address | Data harga, MC, dan PnL tabel (5s) |
| **4. Penyusunan Tx** | `@repo/solana-engine` | PumpPortal API | Public Key, Amount, Slippage | Raw unsigned VersionedTx buffer |
| **5. Signing** | `@repo/solana-engine` | Browser RAM | Raw Tx + Keypair Lokal | Signed VersionedTx v0 |
| **6. Broadcast** | `@repo/solana-engine` | Browser $\rightarrow$ Private RPC | Signed Tx bytes | Signature hash per dompet |
| **7. Tracking** | `apps/web` + `@repo/ui` | Browser UI Table | Signature hash array | Tautan Solscan / SolanaFM live |
| **8. Ledger & PnL** | `apps/web` + IndexedDB | IndexedDB Klien | Konfirmasi Transaksi | Catatan Riwayat & Realized PnL % |

---

## 9. Batasan Ruang Lingkup (Scope Definition)

### 9.1 In-Scope (Rilis v1.0 MVP Monorepo)
* Struktur Monorepo Turborepo + pnpm dengan 1 aplikasi (`apps/web`) dan 4 paket (`solana-engine`, `crypto-vault`, `types`, `ui`).
* Penyimpanan kunci terenkripsi di IndexedDB menggunakan Web Crypto API (PBKDF2 + AES-GCM-256).
* Konfigurasi endpoint Private RPC kustom (Helius, QuickNode) tersimpan di storage lokal klien.
* Polling harga berkala setiap 5 detik dengan perlambatan cerdas saat tab blur.
* Eksekusi transaksi Buy (SOL) dan Sell (% saldo token: 25%, 50%, 75%, 100%) melalui PumpPortal `trade-local`.
* Deserialisasi dan penandatanganan VersionedTransaction v0 lokal secara langsung di browser.
* Penyiaran paralel berbasis `Promise.allSettled` dengan laporan status transparan per dompet.
* Buku besar riwayat transaksi lokal persisten di IndexedDB (`trade_history` store).
* Pelacak laba-rugi terealisasi (Realized PnL & ROI %) per trade dan ringkasan sesi trading.
* Fitur likuidasi darurat ("Panic Sell All") dan preset profil slippage / priority fee instan.
* Ekspor buku besar transaksi ke format CSV / JSON.
* Unit testing mandiri untuk paket kriptografi dan engine Solana menggunakan Vitest.

### 9.2 Out-of-Scope (Rilis Mendatang)
* Sinkronisasi data ke cloud server terpusat (karena mematuhi prinsip *zero-custody*).
* Aplikasi bot trading otomatis di latar belakang saat browser ditutup.
* Integrasi hardware wallet (Ledger) untuk penandatanganan massal multi-dompet serentak.

---

## 10. User Stories & Kriteria Penerimaan (Acceptance Criteria)

### Epic 1: Manajemen Vault & Kriptografi Lokal
#### Story 1.1: Pembuatan Vault & Impor Dompet Terenkripsi
* **Sebagai** trader multi-wallet,
* **Saya ingin** mengimpor beberapa private key ke dalam vault lokal yang diproteksi Master Password,
* **Agar** kunci dompet saya tersimpan aman di peramban dan siap dipakai bertransaksi tanpa perlu menginput ulang setiap saat.

* **Acceptance Criteria:**
  * **Given** pengguna membuka terminal untuk pertama kali, **When** pengguna memasukkan Master Password (minimal 8 karakter), **Then** `@repo/crypto-vault` membuat derivasi kunci via Web Crypto API dan menginisialisasi IndexedDB vault.
  * **Given** vault dalam kondisi terbuka (unlocked), **When** pengguna memasukkan private key base58, **Then** modul memvalidasi formatnya, mengenkripsinya dengan AES-GCM-256, dan menyimpannya di IndexedDB tanpa pernah mengirim data ke jaringan.
  * **Given** pengguna menekan tombol "Lock Terminal", **When** fungsi dipicu, **Then** seluruh instance Keypair dalam memori peramban dimusnahkan seketika.

### Epic 2: Pemantauan Harga & Portofolio
#### Story 2.1: Polling Harga Real-Time 5 Detik & PnL
* **Sebagai** trader memecoin,
* **Saya ingin** melihat pembaruan harga token dan persentase laba-rugi setiap 5 detik,
* **Agar** saya dapat mengambil keputusan transaksi dengan data harga terkini.

* **Acceptance Criteria:**
  * **Given** alamat kontrak token yang valid telah dimasukkan, **When** terminal berada di halaman aktif, **Then** TanStack Query melakukan request data harga terbaru setiap 5 detik ke API publik.
  * **Given** data harga baru diterima, **When** kalkulasi dijalankan, **Then** tabel dompet memperbarui nilai token, estimasi SOL setara, dan persentase Unrealized PnL secara instan.
  * **Given** pengguna berpindah tab (jendela browser blur), **When** deteksi visibilitas aktif, **Then** interval polling otomatis diperlambat ke 30 detik untuk efisiensi kuota.

### Epic 3: Eksekusi Multi-Wallet Paralel
#### Story 3.1: Pembelian Massal dengan PumpPortal `trade-local`
* **Sebagai** trader multi-wallet,
* **Saya ingin** menembakkan order beli ke 10 dompet aktif secara serentak dengan nominal SOL tertentu,
* **Agar** semua dompet saya mendapatkan alokasi token pada harga yang sama tanpa penundaan.

* **Acceptance Criteria:**
  * **Given** 10 dompet aktif dipilih dan nominal SOL ditentukan (misal: 0.1 SOL per dompet), **When** pengguna menekan tombol "Execute Buy", **Then** `@repo/solana-engine` mengirimkan 10 permintaan HTTP POST paralel ke `https://pumpportal.fun/api/trade-local`.
  * **Given** PumpPortal merespons dengan raw unsigned transaction byte array, **When** respons diterima, **Then** `@repo/solana-engine` mendeserialisasikan transaksi menjadi VersionedTransaction v0 dan menandatanganinya dengan masing-masing Keypair lokal di memori.
  * **Given** 10 transaksi telah ditandatangani, **When** penyiaran paralel dijalankan via `Promise.allSettled`, **Then** seluruh transaksi ditembakkan ke RPC privat secara bersamaan.
  * **Given** penyiaran selesai, **When** hasil dikembalikan, **Then** antarmuka menampilkan status spesifik masing-masing dompet (misal: 9 Berhasil dengan tautan Solscan, 1 Gagal dengan pesan error spesifik).

### Epic 4: Riwayat Transaksi & Realized PnL Tracker
#### Story 4.1: Pencatatan Buku Besar & Perhitungan Realized PnL
* **Sebagai** trader memecoin,
* **Saya ingin** setiap transaksi beli dan jual otomatis tersimpan ke buku besar lokal dan menghitung profit/loss terealisasi saat menjual,
* **Agar** saya dapat memantau performa trading secara akurat tanpa kehilangan catatan historis saat me-refresh browser.

* **Acceptance Criteria:**
  * **Given** transaksi SELL terkonfirmasi di blockchain, **When** sistem memproses hasil broadcast, **Then** sistem mencocokkan jumlah token yang dijual dengan modal beli (Weighted Average Cost Basis), menghitung Realized PnL (SOL & USD), serta ROI %.
  * **Given** perhitungan PnL selesai, **When** data disimpan, **Then** catatan baru ditambahkan ke IndexedDB store `trade_history` dan langsung tampil di tabel Riwayat Transaksi.
  * **Given** pengguna menekan tombol "Export History", **When** format dipilih (CSV atau JSON), **Then** peramban otomatis mengunduh file rekapan transaksi lengkap.

### Epic 5: Likuidasi Darurat & Preset Eksekusi Cepat
#### Story 5.1: Eksekusi Panic Sell All 100% Saldo Dompet
* **Sebagai** trader yang menghadapi risiko rug pull mendadak,
* **Saya ingin** menekan satu tombol Panic Sell All untuk menjual 100% saldo token di seluruh dompet sekaligus,
* **Agar** saya dapat melikuidasi posisi secepat mungkin sebelum likuiditas ditarik.

* **Acceptance Criteria:**
  * **Given** posisi token aktif di beberapa dompet, **When** pengguna menekan tombol "Panic Sell All" dan mengonfirmasi, **Then** `@repo/solana-engine` secara serentak menyusun transaksi sell 100% balance untuk setiap dompet ke PumpPortal dan menyiarkannya via RPC privat dengan prioritas tinggi.
  * **Given** transaksi terkonfirmasi, **When** hasil diterima, **Then** seluruh posisi ditutup, saldo SOL diperbarui, dan kalkulasi PnL akhir dicatat ke riwayat.

---

## 11. Persyaratan Non-Fungsional (Non-Functional Requirements)

### 11.1 Performa & Latensi
* **Waktu Penandatanganan Lokal:** Deserialisasi dan penandatanganan transaksi di peramban wajib selesai dalam waktu kurang dari 50ms per dompet.
* **Throughput Penyiaran:** Mampu menyiarkan hingga 30 transaksi secara serentak menggunakan `Promise.allSettled` tanpa membekukan antarmuka peramban (*UI non-blocking* via microtasks asinkron).
* **Ukuran Bundle Klien:** First Load JS Bundle `apps/web` dijaga di bawah 250 kB gzipped untuk menjamin waktu muat awal super cepat.

### 11.2 Keamanan & Isolasi (Zero-Trust Browser Architecture)
* **Penyimpanan Kunci:** Kunci privat tidak boleh disimpan dalam plaintext di `localStorage` atau `sessionStorage`. Hanya ciphertext hasil enkripsi Web Crypto API yang boleh disimpan di IndexedDB.
* **Content Security Policy (CSP):** Menetapkan header CSP ketat pada Next.js di mana koneksi keluar (`connect-src`) hanya diizinkan ke endpoint RPC terdaftar, API PumpPortal, dan penyedia data harga.
* **Isolasi Paket Kriptografi:** Paket `@repo/crypto-vault` dilarang mengimpor modul jaringan apapun guna menjamin tidak adanya celah eksfiltrasi data.

### 11.3 Keandalan Jaringan (Network Resilience)
* **Private RPC Direct Egress:** Menghindari penggunaan RPC publik bawaan Solana (`api.mainnet-beta.solana.com`) untuk mencegah HTTP 429 Too Many Requests.
* **Graceful Degradation:** Kegagalan transaksi pada salah satu dompet dalam batch tidak boleh membatalkan atau mengganggu konfirmasi dompet lainnya dalam batch yang sama (`Promise.allSettled` pattern).

---

## 12. Matriks Penanganan Error & Skenario Tepi (Edge Cases)

| Skenario | Potensi Masalah | Solusi & Mekanisme Sistem |
| :--- | :--- | :--- |
| **RPC Rate Limit (429)** | Penembakan 20+ transaksi serentak memicu limit RPC | Terapkan exponential backoff dengan jitter dan peringatan ke pengguna untuk menggunakan Private RPC tingkat Dedicated. |
| **Slippage Tolerated Exceeded** | Harga token melompat tajam sebelum transaksi terkonfirmasi di blok | Transaksi akan ditolak oleh program Pump.fun di level validator. Sistem menampilkan status "Slippage Exceeded" di log dompet terkait. |
| **Saldo SOL Tidak Cukup** | Dompet kekurangan SOL untuk membayar biaya sewa akun token (Rent-Exempt) atau gas fee | Validasi saldo pre-flight lokal: blokir eksekusi dompet tersebut dan beri notifikasi peringatan sebelum memanggil API PumpPortal. |
| **PumpPortal API Offline / Down** | Endpoint `trade-local` mengalami kendala koneksi | Tangkap error HTTP status code, batalkan proses signing, dan tampilkan toast dialog "PumpPortal API Unreachable". Kunci tetap aman di lokal. |
| **Browser Crash / Tab Tertutup** | Sesi terputus di tengah pemantauan | Kunci privat di memori terhapus otomatis. Saat dibuka kembali, pengguna cukup menginput Master Password untuk mendekripsi kembali vault dari IndexedDB. |

---

## 13. Metrik Keberhasilan & Target Peluncuran (Success Metrics)

| Metrik | Definisi | Target Sukses |
| :--- | :--- | :--- |
| **Signing to Broadcast Latency** | Durasi dari respons PumpPortal hingga tx terkirim ke RPC | $\le$ 150 ms (untuk batch 10 dompet) |
| **Broadcast Success Rate** | Rasio transaksi multi-dompet yang berhasil mencapai status `processed`/`confirmed` | $\ge$ 92% (pada kondisi RPC privat sehat) |
| **Zero Key Leak Incident** | Tidak ada insiden transmisi kunci privat ke luar peramban | 100% Zero Leakage (Audit verified) |
| **Crash-Free Sessions** | Kestabilan peramban saat polling dan eksekusi berjalan berulang | $\ge$ 99.8% sesi bebas crash |

---

## 14. Panduan Eksekusi Setup Monorepo (Quick Start Guide)

```bash
# 1. Inisialisasi root monorepo dengan pnpm
pnpm init

# 2. Instalasi Turborepo dan TypeScript di root
pnpm add -D turbo typescript @types/node

# 3. Instalasi dependensi workspace
pnpm install

# 4. Menjalankan lingkungan pengembangan
pnpm dev

# 5. Menjalankan pengujian unit mandiri antar-paket
pnpm test
```

---

---

## 15. Matriks Konfigurasi Lingkungan (Environment & Configuration Matrix)

Dokumen ini menetapkan seluruh variabel konfigurasi yang wajib disiapkan di berkas `.env.example` dan lingkungan aplikasi monorepo. Panduan langkah demi langkah untuk memperoleh seluruh API Key dan endpoint ini dapat dibaca pada [CONFIG_GUIDE.md](./CONFIG_GUIDE.md).

### 15.1 Klasifikasi Sensitivitas Konfigurasi

| Kategori | Parameter Lingkungan | Nilai Default / Rekomendasi | Tingkat Sensitivitas | Deskripsi & Kegunaan |
| :--- | :--- | :--- | :--- | :--- |
| **Solana RPC** | `NEXT_PUBLIC_SOLANA_RPC_URL` | `https://mainnet.helius-rpc.com/?api-key=...` | Publik / Restricted | Endpoint Private RPC untuk pembacaan saldo dan broadcast transaksi tanpa rate limit. |
| **Solana RPC** | `NEXT_PUBLIC_SOLANA_WSS_URL` | `wss://mainnet.helius-rpc.com/?api-key=...` | Publik / Restricted | Koneksi WebSocket untuk streaming slot blockhash dan status konfirmasi transaksi secara sub-detik. |
| **Solana RPC** | `NEXT_PUBLIC_SOLANA_CLUSTER` | `mainnet-beta` | Non-Sensitif | Target klaster Solana (`mainnet-beta` untuk live, `devnet` untuk staging/testing). |
| **Solana RPC** | `NEXT_PUBLIC_FALLBACK_RPC_URL` | `https://solana-mainnet.g.alchemy.com/v2/...` | Publik / Restricted | Endpoint RPC sekunder jika penyedia utama mengalami gangguan koneksi atau HTTP 429. |
| **Solana RPC** | `NEXT_PUBLIC_HELIUS_API_KEY` | *(Opsional)* | Restricted | Kunci API khusus Helius untuk estimasi Priority Fee dinamis (`getPriorityFeeEstimate`). |
| **DEX & Trade** | `NEXT_PUBLIC_PUMPPORTAL_API_URL` | `https://pumpportal.fun/api/trade-local` | Non-Sensitif | Endpoint perakit instruksi transaksi mentah (unsigned v0 serialized transaction). |
| **DEX & Trade** | `NEXT_PUBLIC_DEXSCREENER_API_URL`| `https://api.dexscreener.com/latest/dex/tokens` | Non-Sensitif | Sumber polling data harga token, likuiditas, dan market cap real-time. |
| **Trading Defaults**| `NEXT_PUBLIC_DEFAULT_SLIPPAGE_BPS`| `1000` (10%) | Non-Sensitif | Nilai toleransi slippage bawaan saat input pertama kali dibuka. |
| **Trading Defaults**| `NEXT_PUBLIC_DEFAULT_PRIORITY_FEE`| `0.005` SOL | Non-Sensitif | Nilai Priority Fee bawaan per transaksi untuk mempercepat inklusi blok validator. |
| **Trading Defaults**| `NEXT_PUBLIC_COMPUTE_UNIT_LIMIT` | `200000` | Non-Sensitif | Batas Compute Unit per transaksi instruksi Pump.fun. |
| **Trading Defaults**| `NEXT_PUBLIC_RENT_EXEMPT_RESERVE`| `0.005` SOL | Non-Sensitif | Cadangan saldo minimal SOL per dompet agar tidak habis total saat beli (menjamin gas fee sell). |
| **Local Vault IDB** | `VAULT_IDB_DATABASE_NAME` | `solana_terminal_vault_v1` | Konfigurasi Internal | Nama basis data IndexedDB untuk penyimpanan ciphertext dompet terenkripsi. |
| **Local Vault IDB** | `LEDGER_IDB_DATABASE_NAME`| `solana_terminal_ledger_v1`| Konfigurasi Internal | Nama basis data IndexedDB untuk buku besar riwayat transaksi beli/jual persisten. |
| **Crypto Constants**| `KDF_PBKDF2_ITERATIONS` | `100000` | Konfigurasi Internal | Jumlah iterasi derivasi kunci Web Crypto API (standar NIST). |
| **Crypto Constants**| `AUTO_LOCK_TIMEOUT_MS` | `900000` (15 menit) | Konfigurasi Internal | Durasi inaktivitas sebelum kunci di RAM dimusnahkan secara otomatis. |
| **Polling Worker** | `PRICE_POLL_INTERVAL_ACTIVE_MS` | `5000` (5 detik) | Konfigurasi Internal | Interval polling TanStack Query saat jendela browser aktif. |
| **Polling Worker** | `PRICE_POLL_INTERVAL_BLUR_MS` | `30000` (30 detik) | Konfigurasi Internal | Interval polling perlambatan cerdas saat jendela browser terminimalisasi/blur. |
| **Cloud (Opsional)**| `NEXT_PUBLIC_SUPABASE_URL` | *(Opsional)* | Non-Sensitif | URL Supabase jika mengaktifkan sinkronisasi Watchlist token / preset non-sensitif antar-perangkat. |
| **Cloud (Opsional)**| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Opsional)* | Publik | Kunci anonim Supabase dengan Row Level Security (RLS) ketat. |

### 15.2 Batasan Keras Terhadap Supabase (Zero-Custody Boundary)

Jika konfigurasi Supabase diaktifkan dalam proyek:
1. **DILARANG KERAS** menyimpan kunci privat (baik mentah maupun terenkripsi), Master Password, seed phrase, atau alamat kunci privat ke dalam tabel Supabase.
2. Supabase **HANYA BOLEH** digunakan untuk fitur sekunder non-sensitif:
   * Sinkronisasi daftar token favorit (*Watchlist & Bookmarked CA*).
   * Sinkronisasi preferensi antarmuka (tema warna, susunan kolom tabel).
   * Berbagi rekap statistik publik (*Public Trade Showcase* tanpa detail dompet privat).
3. Seluruh data keuangan sensitif dan operasional eksekusi tetap **100% diproses di IndexedDB lokal dan RAM peramban**.

---

## 16. Token Intelligence, Pump.fun Analytics Tabs, & Draggable Token Analyzer Modal

Dokumen ini mendefinisikan spesifikasi kebutuhan untuk modul intelijen token (*Token Intelligence*) dan antarmuka analitik real-time yang mengadopsi fungsionalitas profesional gaya Pump.fun dan Photon/BullX. Seluruh kalkulasi analitik, pemantauan feed transaksi, dan deteksi risiko rugpull berjalan 100% di sisi klien (*Pure Client-Side*) memanfaatkan Private RPC Helius dan REST API DexScreener.

### 16.1 Filosofi & Arsitektur Token Intelligence

1. **Zero-Backend Analytics Pipeline**: Data analitik dihimpun langsung oleh peramban pengguna dari dua sumber utama:
   - **Solana On-Chain RPC (Helius/QuickNode)**: Mengambil data pemegang token aktual secara deterministik melalui `getTokenLargestAccounts` dan `getSignaturesForAddress`.
   - **DEX Market Data (DexScreener API)**: Mengambil data pasangan perdagangan (*pairs*), volume 24 jam, likuiditas, kapitalisasi pasar (*Market Cap*), dan metadata sosial (*websites*, *twitter*, *telegram*).
2. **Deterministic Safety Engine**: Algoritma penghitungan skor keamanan token berbasis aturan (*rule-based heuristic*) tanpa ketergantungan AI eksternal yang lambat, menghasilkan skor 0 sampai 100 dalam hitungan milidetik.
3. **Non-Intrusive Draggable Interface**: Panel analitik mendalam disajikan dalam bentuk modal melayang (*floating modal*) yang dapat dipindahkan posisinya (*draggable*) menggunakan pointer mouse pengguna, sehingga tidak pernah menutupi visualisasi grafik lilin (*candlestick chart*).

### 16.2 Spesifikasi Bottom Tabs Bar (Trades, Holders, About)

Di bawah panel grafik *candlestick*, sistem menyediakan bilah tab analitik interaktif yang menyerupai tampilan resmi Pump.fun:

#### A. Tab Trades (Live Transaction Feed)
- **Fungsi**: Menampilkan rekaman transaksi beli (*Buy*) dan jual (*Sell*) secara langsung (*real-time*).
- **Sub-Filter Bar**:
  - `All`: Menampilkan seluruh aktivitas transaksi.
  - `Buys`: Memfilter hanya transaksi pembelian (indikator warna hijau `#10b981`).
  - `Sells`: Memfilter hanya transaksi penjualan (indikator warna merah `#ef4444`).
  - `≥ $10`: Memfilter transaksi dengan nilai di atas ambang batas tertentu untuk menyaring noise *micro-dust*.
  - `Search`: Pencarian cepat berdasarkan alamat dompet atau hash transaksi.
- **Struktur Kolom**:
  1. `Account`: Avatar identicon dan alamat publik terpotong (misal `GYwA...vL5v`).
  2. `Type`: Badge `BUY` (hijau) atau `SELL` (merah).
  3. `Amount (USD)`: Nilai transaksi dalam denominasi Dolar AS (misal `$304.29`).
  4. `Token Amount`: Jumlah kuantitas token (misal `6.17M QBTC`).
  5. `Market Cap`: Valuasi Market Cap saat transaksi dieksekusi.
  6. `Time`: Stempel waktu relatif (misal `5s ago`, `1m ago`).
  7. `Txn`: Tautan eksternal langsung menuju penjelajah blok Solscan.

#### B. Tab Holders (Distribusi Kepemilikan & PnL)
- **Fungsi**: Membedah konsentrasi pemegang token terbesar untuk mendeteksi monopoli pasokan (*supply monopoly*).
- **Sub-Filter Bar**:
  - `All`: Seluruh pemegang token teratas dari on-chain RPC.
  - `In Profit`: Pemegang yang saat ini berada dalam posisi laba belum terealisasi.
  - `At a Loss`: Pemegang yang saat ini berada dalam posisi rugi belum terealisasi.
- **Struktur Kolom**:
  1. `Holder`: Identitas atau alamat dompet pemegang token.
  2. `Held`: Jumlah token yang disimpan saat ini.
  3. `% Supply`: Persentase kepemilikan relatif terhadap total pasokan (1 Miliar token).
  4. `Position (USD)`: Nilai portofolio dalam Dolar AS berdasarkan harga pasar saat ini.
  5. `Profit / Loss`: Estimasi keuntungan atau kerugian (warna hijau untuk profit, merah untuk loss).
  6. `Avg Entry MC`: Estimasi rata-rata Market Cap saat pemegang mengakumulasi token.

#### C. Tab About (Metadata Proyek & Tautan Komunitas)
- **Fungsi**: Memberikan tinjauan fundamental tentang proyek memecoin yang sedang diamati.
- **Komponen Konten**:
  1. `Project Summary`: Ringkasan deskripsi proyek dan narasi utilitas/meme.
  2. `Token Badges`: Platform DEX (`Pump.fun` / `Raydium`), Quote Currency (`SOL` / `WBTC`), Pair Age.
  3. `Verified Sources`: Tautan sumber resmi (Website, X/Twitter, Telegram, GitHub, Audit link, Solscan).

### 16.3 Spesifikasi Header Action: Tombol "Analyze Token" & Draggable Modal

1. **Tombol Pemicu (*Trigger Button*)**:
   - Diletakkan di header grafik *candlestick* tepat di samping informasi `24h vol`.
   - Label: `[⚡ Analyze Token]` dengan styling Cyberpunk Dark beranimasi glow halus.
2. **Perilaku Draggable Modal**:
   - Modal dibuka di atas layar dengan koordinat default di sudut kanan atas area kerja.
   - Dilengkapi *drag handle* pada bilah judul modal dengan event `onPointerDown`, `onPointerMove`, dan `onPointerUp`.
   - Menggunakan `setPointerCapture` agar perpindahan posisi kursor tetap mulus saat digeser dengan cepat.
   - Mendukung tombol *Minimize*, *Reset Position*, dan *Close*.

### 16.4 Algoritma Safety Score (0-100) & Kategorisasi Risiko

Sistem mengevaluasi 5 parameter utama untuk menghasilkan Skor Keamanan Token:

$$\text{Safety Score} = 100 - P_{\text{dev}} - P_{\text{top10}} - P_{\text{social}} - P_{\text{dump}} + B_{\text{vol}}$$

Di mana:
- $P_{\text{dev}}$: Penalti kepemilikan Dev (jika dev memegang >10% supply: kurangi 35 poin; jika dev sudah 0%: tidak ada penalti).
- $P_{\text{top10}}$: Penalti konsentrasi Top 10 Holders (jika >30% supply: kurangi 25 poin; jika >50%: kurangi 40 poin).
- $P_{\text{social}}$: Penalti ketidaklengkapan sosial (tidak ada Twitter/Telegram/Website: kurangi 20 poin).
- $P_{\text{dump}}$: Penalti penurunan tajam tanpa pemulihan (kurangi 15-30 poin).
- $B_{\text{vol}}$: Bonus likuiditas dan rasio volume terhadap likuiditas yang sehat (hingga +15 poin).

#### Kategori Label Token:
- 🟢 **ORGANIC / LEGIT GEM** (Skor 80 - 100): Distribusi desentralistis sehat, dev pegang <5%, sosial aktif, likuiditas memadai.
- 🟡 **SPECULATIVE MEME** (Skor 50 - 79): Volatilitas tinggi, dev pegang 5%-15%, cocok untuk scalping cepat dengan batas ketat.
- 🔴 **HIGH RISK / RUGPULL DETECTED** (Skor 0 - 49): Dev monopoli >20%, sosial palsu/mati, atau pola *bundling dump*.

### 16.5 Deteksi Diskon Entry ATH (-50% & -70% Dip Zone)

Sistem melacak titik tertinggi sepanjang masa (*All-Time High / ATH*) dari riwayat harga:
1. **Level Diskon -50% ATH**: Sinyal *Speculative Bounce Zone* (koreksi wajar pada tren naik memecoin yang sehat).
2. **Level Diskon -70% ATH**: Sinyal *Deep Value Dip Zone* (area akumulasi diskon ekstrem jika fundamental komunitas masih hidup).
3. Indikator visual menunjukkan posisi harga saat ini terhadap kedua ambang batas diskon tersebut untuk memandu keputusan entry trader.

### 16.6 Emergency Dump Warning & Auto Alert Popup (>70% Drop from Peak)

Jika token mengalami penurunan harga lebih dari **70%** dari titik tertinggi lokal (*local high*) dengan kondisi:
1. Tekanan jual mendominasi (*Sell volume > 75%*), atau
2. Dompet pencipta (*Dev wallet*) melepas kepemilikannya secara masif:

Sistem secara otomatis memunculkan **Emergency Critical Alert Popup**:
> **PERINGATAN KRITIS: CRITICAL DUMP / RUGPULL TERDETEKSI!**  
> Token mengalami penurunan tajam -XX% dari puncak dengan likuiditas mengering.  
> Rekomendasi: **Segera keluar dan likuidasi seluruh posisi (Panic Sell All)!**

Popup dilengkapi tombol satu-klik `[🚨 Lakukan Panic Sell All]` yang langsung memicu fungsi likuidasi darurat ke seluruh dompet aktif.

### 16.7 Client-Side Momentum & Backtest Trade Logger

- Sistem menyediakan ringkasan sinyal momentum: `STRONG BUY`, `ACCUMULATE DIP`, `WAIT & WATCH`, `TAKE PROFIT`, atau `EMERGENCY EXIT`.
- Pengguna dapat mencatat rekomendasi sinyal ke dalam log backtest lokal di IndexedDB guna mengevaluasi efektivitas strategi entry/exit sepanjang sesi perdagangan.

---

### Verifikasi Kepatuhan Standar (Delivery Gate Verification)
- [x] **Zero Em-Dash Policy:** Dokumen sepenuhnya bebas dari karakter em dash (mematuhi aturan R-02).
- [x] **Monorepo Architecture:** Menggunakan struktur Turborepo + pnpm workspaces (`apps/web`, `packages/solana-engine`, `packages/crypto-vault`, `packages/types`, `packages/ui`).
- [x] **Pure Client-Side Model:** Tidak ada ketergantungan database backend terpusat atau penandatanganan transaksi di server Vercel.
- [x] **Kriptografi Standar Industri:** Menggunakan Web Crypto API (PBKDF2 SHA-256 + AES-GCM-256) dan IndexedDB.
- [x] **Arsitektur Resilien:** Mendukung VersionedTransaction v0, Private RPC routing, dan `Promise.allSettled`.
- [x] **Konfigurasi Lengkap:** Matriks variabel lingkungan Bab 15 mencakup Private RPC, DEX API, IndexedDB, dan batasan Supabase.
- [x] **Token Intelligence Terintegrasi:** Bab 16 mendefinisikan tabs analitik gaya Pump.fun, modal analisis draggable, safety score, diskon ATH, dan peringatan darurat rugpull.

