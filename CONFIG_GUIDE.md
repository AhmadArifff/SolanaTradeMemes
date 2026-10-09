# Panduan Lengkap Memperoleh & Menyiapkan Konfigurasi (.env)

Dokumen ini berisi panduan langkah demi langkah bagi tim pengembang dan pengguna untuk memperoleh seluruh kredensial, endpoint RPC privat, dan API eksternal yang dibutuhkan oleh **SolanaTradeMemes**.

---

## 1. Ringkasan Kebutuhan Kredensial

| Layanan | Kategori | Biaya | Wajib / Opsional | Kebutuhan Registrasi |
| :--- | :--- | :--- | :--- | :--- |
| **Helius** | Solana RPC & WSS Utama | Gratis / Berbayar | **Wajib** | Registrasi akun di Helius |
| **QuickNode / Alchemy** | Solana RPC Cadangan | Gratis / Berbayar | Opsional (Disarankan) | Registrasi akun QuickNode / Alchemy |
| **PumpPortal** | DEX Trade Engine | Gratis | **Wajib** | Tanpa Registrasi (Endpoint Publik) |
| **DexScreener** | Price & Market Data | Gratis | **Wajib** | Tanpa Registrasi (Endpoint Publik) |
| **Supabase** | Cloud Sync Watchlist | Gratis | Opsional (Non-Sensitif) | Registrasi akun di Supabase |

---

## 2. Panduan Mendapatkan Solana Private RPC (Helius)

Penyedia RPC privat (seperti **Helius**) mutlak diperlukan agar penembakan transaksi multi-dompet secara serentak tidak terblokir kuota *rate-limiting* (HTTP 429) yang ada pada RPC publik bawaan Solana.

### Langkah Memperoleh RPC & WSS Helius:
1. Kunjungi portal resmi Helius di: [https://helius.dev](https://helius.dev)
2. Klik tombol **"Get Started"** atau **"Sign In"** (dapat menggunakan akun Google atau GitHub).
3. Setelah masuk ke **Dashboard**:
   * Navigasi ke menu **"RPCs"** pada bilah samping (*sidebar*).
   * Pilih jaringan: **Mainnet**.
4. Anda akan melihat dua URL penting:
   * **HTTPS RPC URL:**  
     Format: `https://mainnet.helius-rpc.com/?api-key=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`  
     $\rightarrow$ Salin nilai ini ke `NEXT_PUBLIC_SOLANA_RPC_URL`.
   * **WebSockets (WSS) URL:**  
     Format: `wss://mainnet.helius-rpc.com/?api-key=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`  
     $\rightarrow$ Salin nilai ini ke `NEXT_PUBLIC_SOLANA_WSS_URL`.
5. Salin nilai parameter `api-key` (kode unik setelah tanda `=`) ke:
   * `NEXT_PUBLIC_HELIUS_API_KEY`.

> [!TIP]
> Paket gratis Helius (*Free Tier*) menyediakan 100.000 kredit per hari, yang sudah sangat mencukupi untuk kebutuhan pengujian dan transaksi harian tim.

---

## 3. Panduan Mendapatkan RPC Cadangan (QuickNode atau Alchemy)

Untuk mengantisipasi situasi di mana RPC utama mengalami *downtime* atau pemeliharaan jaringan, siapkan RPC cadangan.

### Opsi A: QuickNode
1. Kunjungi: [https://www.quicknode.com](https://www.quicknode.com)
2. Buat akun dan klik **"Create Endpoint"**.
3. Pilih rantai: **Solana**, lalu pilih jaringan: **Mainnet-Beta**.
4. Selesaikan pembuatan endpoint gratis (*Free Tier*).
5. Salin URL HTTPS yang dihasilkan ke `NEXT_PUBLIC_FALLBACK_RPC_URL`.

### Opsi B: Alchemy
1. Kunjungi: [https://www.alchemy.com](https://www.alchemy.com)
2. Masuk ke Dashboard, klik **"Create App"**.
3. Pilih rantai: **Solana**, jaringan: **Mainnet**.
4. Klik **"API Key"**, salin URL HTTPS ke `NEXT_PUBLIC_FALLBACK_RPC_URL`.

---

## 4. Konfigurasi DEX Engine & Data Pasar (Tanpa Registrasi)

Kedua layanan berikut beroperasi secara publik dan **tidak memerlukan API Key atau pendaftaran akun**:

### 1. PumpPortal API (`NEXT_PUBLIC_PUMPPORTAL_API_URL`)
* **URL:** `https://pumpportal.fun/api/trade-local`
* **Cara Kerja:** Endpoint ini menerima parameter transaksi (public key, token mint, slippage, amount) dan mengembalikan array byte transaksi mentah tanpa tanda tangan.
* **Tindakan:** Cukup masukkan URL default tersebut di berkas `.env.local`.

### 2. DexScreener API (`NEXT_PUBLIC_DEXSCREENER_API_URL`)
* **URL:** `https://api.dexscreener.com/latest/dex/tokens`
* **Cara Kerja:** Menyediakan harga token real-time, grafik, dan data likuiditas tanpa batasan ketat.
* **Tindakan:** Cukup masukkan URL default tersebut di berkas `.env.local`.

---

## 5. Panduan Menyiapkan Supabase (Opsional - Data Non-Sensitif)

> [!IMPORTANT]
> **Batasan Keamanan:** Supabase HANYA digunakan jika tim ingin menyinkronkan daftar token favorit (*Watchlist*) antar-perangkat. DILARANG KERAS menyimpan kunci privat, password, atau data sensitif apapun di Supabase!

### Langkah Menyiapkan Supabase:
1. Kunjungi: [https://supabase.com](https://supabase.com)
2. Masuk menggunakan akun GitHub Anda.
3. Klik **"New Project"**, lalu isi:
   * **Name:** `solana-trade-memes`
   * **Database Password:** Buat password yang kuat dan simpan di pengelola kata sandi Anda.
   * **Region:** Pilih wilayah terdekat (misal: *Singapore* untuk pengguna Asia Tenggara).
4. Setelah proyek selesai dibuat (~1-2 menit):
   * Masuk ke menu **Project Settings** (ikon roda gigi di pojok bawah).
   * Pilih submenu **"API"**.
5. Pada bagian **Project API Keys & Configuration**, salin dua nilai berikut:
   * **Project URL:**  
     Format: `https://[project-ref].supabase.co`  
     $\rightarrow$ Salin ke `NEXT_PUBLIC_SUPABASE_URL`.
   * **anon / public key:**  
     Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`  
     $\rightarrow$ Salin ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 6. Langkah Menyiapkan Berkas `.env.local`

Ikuti langkah-langkah berikut pada mesin lokal Anda:

### Langkah 1: Gandakan Berkas Template
Jalankan perintah ini di terminal root proyek:
```bash
cp .env.example .env.local
```
*(Untuk pengguna PowerShell di Windows, gunakan `Copy-Item .env.example .env.local`)*

### Langkah 2: Isi Variabel di `.env.local`
Buka berkas `.env.local` dan ganti nilai placeholder dengan kredensial riil yang telah Anda salin:

```env
# 1. Solana Private RPC (Helius)
NEXT_PUBLIC_SOLANA_RPC_URL="https://mainnet.helius-rpc.com/?api-key=PASTE_HELIUS_API_KEY_DISINI"
NEXT_PUBLIC_SOLANA_WSS_URL="wss://mainnet.helius-rpc.com/?api-key=PASTE_HELIUS_API_KEY_DISINI"
NEXT_PUBLIC_SOLANA_CLUSTER="mainnet-beta"
NEXT_PUBLIC_FALLBACK_RPC_URL="https://solana-mainnet.g.alchemy.com/v2/PASTE_KEY_CADANGAN_DISINI"
NEXT_PUBLIC_HELIUS_API_KEY="PASTE_HELIUS_API_KEY_DISINI"

# 2. DEX Engine & Data Pasar (Gunakan Default)
NEXT_PUBLIC_PUMPPORTAL_API_URL="https://pumpportal.fun/api/trade-local"
NEXT_PUBLIC_DEXSCREENER_API_URL="https://api.dexscreener.com/latest/dex/tokens"

# 3. Trading Guardrails & Presets
NEXT_PUBLIC_DEFAULT_SLIPPAGE_BPS=1000
NEXT_PUBLIC_DEFAULT_PRIORITY_FEE=0.005
NEXT_PUBLIC_COMPUTE_UNIT_LIMIT=200000
NEXT_PUBLIC_RENT_EXEMPT_RESERVE=0.005

# 4. Polling Timers (ms)
NEXT_PUBLIC_PRICE_POLL_INTERVAL_ACTIVE_MS=5000
NEXT_PUBLIC_PRICE_POLL_INTERVAL_BLUR_MS=30000

# 5. Supabase (Opsional)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

---

## 7. Prosedur Uji Validasi Koneksi (Health Check)

Setelah mengisi `.env.local`, pastikan koneksi RPC Anda berfungsi normal sebelum menjalankan aplikasi:

### 1. Uji RPC Solana via cURL
Jalankan perintah berikut di terminal:
```bash
curl -X POST "https://mainnet.helius-rpc.com/?api-key=PASTE_HELIUS_API_KEY_DISINI" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getSlot"}'
```
* **Hasil Diharapkan:** Mengembalikan nomor slot Solana terkini (contoh: `{"jsonrpc":"2.0","result":330541289,"id":1}`).

### 2. Uji Koneksi PumpPortal API
Jalankan uji ping sederhana:
```bash
curl -I "https://pumpportal.fun/api/trade-local"
```
* **Hasil Diharapkan:** Mengembalikan status respons HTTP (bukan koneksi gagal).

---

## 8. Pertanyaan Umum & Pemecahan Masalah (FAQ)

### Q1: Apakah saya harus membayar untuk RPC Helius?
* **Jawab:** Tidak untuk tahap pengembangan. Paket *Free Tier* Helius menyediakan kuota yang memadai. Jika volume transaksi terminal meningkat drastis di kemudian hari, tim dapat mempertimbangkan paket berbayar (*Hacker* atau *Business*).

### Q2: Mengapa terminal menampilkan error HTTP 429?
* **Jawab:** Error 429 berarti batas kuota permintaan terlampaui. Pastikan Anda tidak menggunakan RPC publik default (`api.mainnet-beta.solana.com`). Periksa apakah `NEXT_PUBLIC_SOLANA_RPC_URL` telah diisi dengan endpoint RPC privat Anda.

### Q3: Apakah aman membagikan berkas `.env.local` ke developer lain?
* **Jawab:** **Dilarang membagikan file `.env.local` secara publik atau meng-commit-nya ke Git.** Berkas `.env.local` telah dimasukkan ke dalam `.gitignore`. Setiap developer di tim wajib membuat berkas `.env.local` masing-masing berdasarkan template `.env.example`.
