# Peta Indeks & Cakupan PRD.md (PRD Index Map)

Dokumen ini memetakan seluruh 15 bab pada [`PRD.md`](../../PRD.md) terhadap komponen monorepo, berkas aturan `.agents/rules/`, dan lokasi kode implementasi di `apps/` dan `packages/`.

---

## Tabel Pemetaan Menyeluruh 15 Bab PRD

| Bab PRD | Topik & Modul Utama | Status Sesi | Paket / Aplikasi Monorepo | Berkas Aturan / SOP Terkait |
| :--- | :--- | :--- | :--- | :--- |
| **Bab 1** | Ringkasan Eksekutif & Pure Client-Side Architecture | COMPLETED | Root Workspace | `00-core-guardrails.md` |
| **Bab 2** | Problem Statement & Risiko Server Kustodian | COMPLETED | Root Workspace | `00-core-guardrails.md` |
| **Bab 3** | Target Personas (Multi-Wallet Meme Scalper) | COMPLETED | `apps/web` | `40-frontend-terminal-standards.md` |
| **Bab 4** | Arsitektur Monorepo Turborepo + pnpm Workspaces | COMPLETED | Monorepo Root | `10-monorepo-standards.md` |
| **Bab 5** | Review & Rekomendasi Tech Stack | COMPLETED | Monorepo Root | `10-monorepo-standards.md` |
| **Bab 6** | Diagram Alur & Interaksi Antar-Paket | COMPLETED | Monorepo Root | `task-review-protocol.md` |
| **Bab 7.1**| Kubah Kriptografi Lokal (PBKDF2 + AES-GCM) | IN_PROGRESS | `packages/crypto-vault` | `20-crypto-vault-standards.md` |
| **Bab 7.2**| Mesin Eksekusi Solana (v0 Signer & PumpPortal) | IN_PROGRESS | `packages/solana-engine` | `30-solana-engine-standards.md` |
| **Bab 7.3**| Pemantauan Harga 5 Detik & Portofolio Aktif | MAPPED | `apps/web` (TanStack Query) | `40-frontend-terminal-standards.md` |
| **Bab 7.4**| Buku Besar Riwayat Transaksi & Realized PnL | MAPPED | `apps/web` (IndexedDB) | `40-frontend-terminal-standards.md` |
| **Bab 7.5**| Likuidasi Darurat Panic Sell All & Presets | MAPPED | `packages/solana-engine` | `30-solana-engine-standards.md` |
| **Bab 8** | Alur Pipeline Data & Eksekusi (8 Tahapan) | COMPLETED | `packages/types` | `new-package-or-module.md` |
| **Bab 9** | Batasan Ruang Lingkup (In-Scope vs Out-of-Scope)| COMPLETED | Root Workspace | `task-review-protocol.md` |
| **Bab 10** | User Stories & Acceptance Criteria (Epic 1 s.d 5)| COMPLETED | End-to-End Apps | `PRD.md` Bab 10 |
| **Bab 11** | Persyaratan Non-Fungsional (Performa & CSP) | COMPLETED | Monorepo Root | `00-core-guardrails.md` |
| **Bab 12** | Matriks Penanganan Error (429, Slippage, Crash)| COMPLETED | `packages/solana-engine` | `terminal-cases.md` |
| **Bab 13** | Metrik Keberhasilan & Target Peluncuran | COMPLETED | QA Gate | `50-testing-qa-standards.md` |
| **Bab 14** | Panduan Eksekusi Setup Monorepo | COMPLETED | Root Workspace | `PRD.md` Bab 14 |
| **Bab 15** | Matriks Konfigurasi Lingkungan (.env Matrix) | COMPLETED | Root Workspace | `CONFIG_GUIDE.md`, `.env.example` |
