# SOP Pembuatan Modul / Paket Baru di Monorepo

> **Kapan Digunakan:** Ketika menambahkan fungsi baru atau paket baru dalam monorepo Turborepo + pnpm.

---

## Langkah Kerja Terstruktur

### Tahap 1: Pemetaan Tipe & Skema di `@repo/types`
1. Buka `packages/types/src/index.ts`.
2. Definisikan tipe data TypeScript (DTO) dan skema validasi Zod untuk data yang akan ditangani.
3. Contoh: Definisikan parameter request transaksi baru atau format metadata dompet.

### Tahap 2: Implementasi Logika Inti pada Paket Target
1. Jika berkaitan dengan Solana/PumpPortal: kembangkan di `packages/solana-engine/src/`.
2. Jika berkaitan dengan Web Crypto/IndexedDB: kembangkan di `packages/crypto-vault/src/`.
3. Jika komponen tampilan: kembangkan di `packages/ui/src/`.
4. Ekspor fungsi publik melalui `index.ts` pada paket bersangkutan.

### Tahap 3: Pengujian Unit Mandiri (Vitest)
1. Tulis berkas tes `*.test.ts` di dalam paket terkait.
2. Jalankan pengujian unit spesifik paket:
   ```bash
   pnpm --filter <nama-paket> test
   ```
3. Pastikan seluruh pengujian lulus 100% sebelum menghubungkannya ke UI.

### Tahap 4: Integrasi ke Aplikasi Web (`apps/web`)
1. Impor fungsi dari `@repo/<nama-paket>` ke dalam komponen atau hook di `apps/web`.
2. Hubungkan dengan Zustand store atau TanStack Query.
3. Verifikasi interaksi antarmuka di peramban.
