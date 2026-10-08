# Peta Navigasi Agen (.agents/) - Solana Trade Memes

Selamat datang di repositori tata kelola agen untuk **Solana Trade Memes (Pure Client-Side Multi-Wallet Trading Terminal)**.

Folder `.agents/` ini berfungsi sebagai pusat aturan, prosedur kerja, bank kasus, dan skill spesifik yang memandu seluruh AI coding agent saat merancang, mengimplementasikan, dan menguji kode pada proyek ini.

---

## 1. Struktur Folder .agents/

```
.agents/
├── rules/                    # Aturan mutlak & standar rekayasa per bidang
│   ├── 00-core-guardrails.md # Aturan mutlak keamanan kunci privat & larangan keras
│   ├── 01-workflow-discipline.md # Siklus OODA, Review Gate, DoR/DoD
│   ├── 10-monorepo-standards.md  # Turborepo, pnpm workspaces, isolasi paket
│   ├── 20-crypto-vault-standards.md # Web Crypto API, PBKDF2, AES-GCM, IndexedDB
│   ├── 30-solana-engine-standards.md # @solana/web3.js v0, PumpPortal trade-local, broadcast
│   ├── 40-frontend-terminal-standards.md # Next.js 15 Client SPA, TanStack Query, UI/UX
│   └── 50-testing-qa-standards.md # Vitest, Playwright, test vectors
├── workflows/                # Prosedur kerja baku (SOP)
│   ├── task-review-protocol.md   # Evaluasi 7 Pilar sebelum mulai ngoding
│   ├── new-package-or-module.md  # Pembuatan paket baru di Monorepo
│   ├── crypto-security-audit.md  # Audit kebocoran kunci privat
│   ├── multi-device-collaboration.md # SOP alur git branch dev & pull rebase
│   └── playwright-testing.md     # SOP pengujian otomatis peramban (on-demand)
├── skills/                   # Keahlian khusus proyek (On-Demand Skills)
│   ├── solana-terminal-engine/   # Logika transaksi Solana v0 & PumpPortal
│   └── crypto-vault-security/    # Kriptografi Web Crypto & IndexedDB terisolasi
├── session-state/            # Status pelacak sesi aktif & batasan terkunci
│   └── active-session.json   # SOT pelacakan PRD, milestone lolos, & aksi selanjutnya
├── 02-session-state/         # Mirror session-state untuk kompatibilitas lintas agen
│   └── active-session.json
├── knowledge/                # Bank kasus & mitigasi error
│   ├── README.md                 # Panduan bank kasus
│   └── terminal-cases.md         # Catatan bug, solusi rate limit RPC & PumpPortal
└── README.md                 # Berkas navigasi utama ini
```

---

## 2. Prinsip Rekayasa Utama Proyek

1. **Pure Client-Side Zero-Custody:** Kunci privat tidak pernah menyentuh server Vercel atau server PumpPortal. Semua penandatanganan dilakukan di RAM peramban.
2. **Kedaulatan Aturan Lokal:** Aturan di `.agents/rules/` adalah hukum tertinggi proyek. Jika ada konflik dengan preferensi bawaan model, aturan lokal ini 100% dipatuhi.
3. **Monorepo Separation of Concerns:** Paket kriptografi (`packages/crypto-vault`) dilarang mengimpor modul jaringan. Paket Solana (`packages/solana-engine`) agnostik terhadap UI antarmuka.
4. **Anti-Slop Strict Standards:** Bebas dari karakter em dash (R-02), bebas dari dead code sisa iterasi lama, dan bebas dari jargon teknis yang membingungkan pengguna di antarmuka.
