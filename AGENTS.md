# AGENTS.md: Tata Kelola Agen & Arsitektur Sistem Solana Trade Memes

> **Workspace Agentic Entry File**: Berkas ini dibaca secara otomatis di awal setiap sesi pengerjaan proyek **Solana Trade Memes (Pure Client-Side Multi-Wallet Trading Terminal)**. Berkas ini mendefinisikan tata kelola multi-agen, aturan arsitektur monorepo, isolasi keamanan kunci privat, dan pemetaan skill spesifik.

---

## 1. Ringkasan Eksekutif Proyek

* **Produk:** Solana Trade Memes (Pure Client-Side Multi-Wallet Terminal)
* **Arsitektur Utama:** Turborepo + pnpm Workspaces
* **Filosofi Inti:** **Pure Client-Side Terminal (Zero Backend Execution)**. Seluruh manajemen kunci privat, deskripsi instruksi, penandatanganan transaksi (signing), dan penyiaran (broadcast) diproses langsung di peramban (browser) pengguna tanpa perantara backend server, database terpusat, atau komputasi penandatanganan di Vercel.
* **Spesifikasi Lengkap:** Merujuk pada [PRD.md](./PRD.md).

---

## 2. Navigasi Aturan & Pedoman Kerja (`.agents/`)

Seluruh agen wajib membaca dan mematuhi aturan spesifik sesuai domain pengerjaan yang tersimpan di dalam folder `.agents/`:

| Domain | Berkas Aturan | Deskripsi |
| :--- | :--- | :--- |
| **Panduan Tim & Kolaborasi** | [DOC.md](./DOC.md) | Panduan resmi tim, topologi monorepo, SOP 5 langkah, dan peta PRD. |
| **Pelacak Sesi Aktif** | [.agents/02-session-state/active-session.json](./.agents/02-session-state/active-session.json) | State machine pelacak milestone, sprint, dan status 15 bab PRD. |
| **Aturan Mutlak & Larangan Keras** | [.agents/rules/00-core-guardrails.md](./.agents/rules/00-core-guardrails.md) | Proteksi isolasi kunci privat, zero server signing, larangan em dash, dan larangan dead code. |
| **Disiplin Alur Kerja & Review Gate** | [.agents/rules/01-workflow-discipline.md](./.agents/rules/01-workflow-discipline.md) | Siklus OODA, Review Gate 7 Pilar, dan pemisahan Builder vs Reviewer. |
| **Arsitektur Monorepo (Turborepo)** | [.agents/rules/10-monorepo-standards.md](./.agents/rules/10-monorepo-standards.md) | Struktur `apps/*` dan `packages/*`, batasan dependensi, dan resolusi pnpm. |
| **Kubah Keamanan Kriptografi** | [.agents/rules/20-crypto-vault-standards.md](./.agents/rules/20-crypto-vault-standards.md) | Standar Web Crypto API (PBKDF2 + AES-GCM), IndexedDB, dan pemusnahan memori RAM. |
| **Mesin Eksekusi Solana** | [.agents/rules/30-solana-engine-standards.md](./.agents/rules/30-solana-engine-standards.md) | Deserialisasi VersionedTransaction v0, PumpPortal trade-local, dan penyiaran paralel RPC. |
| **Frontend Terminal & UI/UX** | [.agents/rules/40-frontend-terminal-standards.md](./.agents/rules/40-frontend-terminal-standards.md) | Next.js 15 Client SPA, TanStack Query 5s adaptive polling, Zustand, dan Cyberpunk Dark theme. |
| **Testing & Quality Assurance** | [.agents/rules/50-testing-qa-standards.md](./.agents/rules/50-testing-qa-standards.md) | Vitest untuk pengujian paket modular dan Playwright E2E browser automation. |

---

## 3. Matriks Penyesuaian Skill (Skill Matrix)

Untuk pengerjaan proyek ini, agen mengorkestrasikan kombinasi skill global dan skill khusus workspace:

### 3.1 Skill Khusus Workspace (`.agents/skills/`)
1. **`solana-terminal-engine`** ([.agents/skills/solana-terminal-engine/SKILL.md](./.agents/skills/solana-terminal-engine/SKILL.md)):  
   Spesialisasi logika transaksi Solana Web3, deserialisasi VersionedTransaction v0, integrasi PumpPortal API `trade-local`, penandatanganan Keypair lokal di memori, penyiaran paralel `Promise.allSettled`, dan penanganan error RPC/slippage.
2. **`crypto-vault-security`** ([.agents/skills/crypto-vault-security/SKILL.md](./.agents/skills/crypto-vault-security/SKILL.md)):  
   Spesialisasi Web Crypto API (SubtleCrypto PBKDF2 + AES-GCM-256), penyimpanan terenkripsi IndexedDB (`idb`), protokol pembersihan memori (*memory sanitization*), dan audit zero-key-exfiltration.

### 3.2 Skill Global Terdaftar
* **`frontend`** & **`shadcn-ui`**: Desain arsitektur komponen React/Next.js, Radix UI primitives, dark mode cyberpunk/DeFi, dan data table performa tinggi.
* **`motion`** / **`motion-design-skill`**: Micro-interactions, transisi status eksekusi transaksi, dan animasi toast feedback.
* **`antislop`** (`antislop-ui`, `antislop-code`, `antislop-layoutmobile`): Eliminasi cacat kode AI, larangan em dash, higienitas komentar, dan optimasi mobile tanpa overflow.
* **`qa`** & **`playwright`**: Strategi pengujian unit (Vitest) dan pengujian otomatis browser E2E (Playwright, hanya dijalankan jika diminta secara eksplisit).
* **`pm`**: Manajemen dokumen PRD, breakdown fitur, dan validasi acceptance criteria.
* **`tech-critic`**: Audit devil's advocate independen terhadap keamanan kriptografi dan ketahanan transaksi multi-wallet.
* **`goal-tracker`**: Pelacakan status sub-tugas dan pencegahan context drift pada sesi berdurasi panjang.

---

## 4. Prosedur Kerja Baku (Workflows)

* **[Protokol Review Task (7 Pilar)](./.agents/workflows/task-review-protocol.md)**: Wajib dilakukan sebelum menulis kode baru.
* **[SOP Pembuatan Modul / Paket Monorepo](./.agents/workflows/new-package-or-module.md)**: Standar pembuatan paket baru di `packages/*` atau fitur di `apps/web`.
* **[SOP Audit Keamanan Kriptografi](./.agents/workflows/crypto-security-audit.md)**: Prosedur verifikasi zero-leakage kunci privat.
* **[SOP Kolaborasi Tim & Git Workflow](./.agents/workflows/multi-device-collaboration.md)**: Wajib `git pull --rebase origin dev` sebelum mulai dan push ke branch `dev`.
* **[SOP Pengujian Playwright](./.agents/workflows/playwright-testing.md)**: Hanya dijalankan jika diminta eksplisit oleh pengguna.

---

## 5. Bank Kasus & Pengetahuan (Knowledge Base)

* **[Knowledge Base Overview](./.agents/knowledge/README.md)**: Panduan rujukan teknis.
* **[Daftar Kasus Bug & Solusi Terminal](./.agents/knowledge/terminal-cases.md)**: Preseden penanganan rate limit RPC Solana, PumpPortal quirks, dan pemulihan IndexedDB.

---

## 6. Pelacakan Status Sesi & Panduan Pengembangan

* **[Active Session State](./.agents/session-state/active-session.json)**: Status pelacakan kemajuan PRD dan batasan arsitektur terkunci lintas tim.
* **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)**: Panduan kolaborasi harian tim, alur kerja git branch dev, dan review gate 7 pilar.
* **[CONFIG_GUIDE.md](./CONFIG_GUIDE.md)**: Panduan step-by-step setup RPC Helius, PumpPortal, DexScreener, dan variabel .env.local.

