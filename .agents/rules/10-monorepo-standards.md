# 10-monorepo-standards.md: Standar Arsitektur Monorepo (Turborepo + pnpm)

Dokumen ini mengatur struktur direktori, isolasi paket, dan aturan dependensi dalam monorepo Solana Trade Memes.

---

## 1. Tata Kelola Ruang Kerja (pnpm Workspaces)

Monorepo menggunakan file konfigurasi `pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Seluruh impor internal antar-paket WAJIB menggunakan format namespace `@repo/*`:
* `@repo/solana-engine`
* `@repo/crypto-vault`
* `@repo/types`
* `@repo/ui`
* `@repo/eslint-config`
* `@repo/typescript-config`

---

## 2. Batasan Keras Antar-Paket (Package Boundaries)

1. **Paket `@repo/crypto-vault`:**
   * **DILARANG** mengimpor modul HTTP/Fetch, WebSocket, RPC client, atau UI library.
   * Hanya diperbolehkan bergantung pada Web Crypto API bawaan browser, pustaka IndexedDB (`idb`), dan `@repo/types`.
   * Tujuannya adalah menjamin secara mutlak bahwa modul kriptografi ini bebas dari celah transmisi data (*zero network egress*).
2. **Paket `@repo/solana-engine`:**
   * **DILARANG** mengimpor komponen UI (React, JSX, Tailwind, DOM elements).
   * Murni modul logika TypeScript yang mengolah transaksi `@solana/web3.js`, API PumpPortal `trade-local`, dan RPC broadcaster.
3. **Paket `@repo/types`:**
   * Single Source of Truth untuk antarmuka TypeScript dan skema Zod.
   * Tidak boleh memiliki logika bisnis atau dependensi runtime berat.
4. **Paket `@repo/ui`:**
   * Berisi komponen desain sistem murni (Radix UI, Tailwind CSS).
   * Tidak boleh menyimpan logika penandatanganan transaksi atau dekripsi kunci.
5. **Aplikasi `apps/web`:**
   * Aplikasi Next.js 15 yang merajut seluruh paket di atas ke dalam tampilan terminal interaktif.

---

## 3. Resolusi Dependensi & Keamanan

1. Dilarang memasang dependensi phantom (*phantom dependencies*). Selalu gunakan `pnpm add <pkg> --filter <target-package>`.
2. Versi `@solana/web3.js` wajib seragam di seluruh workspace (minimal versi 1.95+ dengan dukungan VersionedTransaction v0).
3. Setiap paket wajib memiliki skrip `build`, `lint`, dan `test` yang terdaftar dalam `turbo.json`.
