# Protokol Review Task (7 Pilar Evaluasi)

> **Kapan Digunakan:** Wajib dievaluasi sebelum agen mulai menulis atau memodifikasi kode pada tugas apapun.

---

## 7 Pilar Evaluasi Sebelum Pengerjaan

1. **Pilar 1: Scope & Boundaries**
   * Apakah tugas ini relevan dengan spesifikasi di PRD v1.1?
   * Apakah ada potensi scope creep yang melanggar arsitektur pure client-side?
2. **Pilar 2: Keamanan Kunci Privat (Zero-Leakage)**
   * Apakah ada kemungkinan kode baru mengekspos kunci ke luar peramban?
   * Apakah data di memori dibersihkan saat sesi berakhir?
3. **Pilar 3: Isolasi Paket Monorepo**
   * Di paket mana kode ini seharusnya berada (`@repo/solana-engine`, `@repo/crypto-vault`, `@repo/types`, `@repo/ui`, atau `apps/web`)?
   * Apakah ada pelanggaran batas dependensi (misal mengimpor UI ke dalam engine)?
4. **Pilar 4: Performa & Latensi Eksekusi**
   * Apakah proses penandatanganan dan penyiaran tetap asinkron dan non-blocking?
   * Apakah polling harga TanStack Query sudah menerapkan adaptive interval?
5. **Pilar 5: Konsistensi UI/UX & Tema**
   * Apakah antarmuka mematuhi tema Cyberpunk Dark Mode DeFi?
   * Apakah angka dan persentase disajikan secara presisi?
6. **Pilar 6: Penanganan Kegagalan (Edge Cases & Fallbacks)**
   * Bagaimana jika panggilan PumpPortal gagal atau RPC mengembalikan HTTP 429?
   * Apakah `Promise.allSettled` menangani kegagalan parsial dengan anggun?
7. **Pilar 7: Rollback & Modularitas**
   * Jika kode ini ditarik kembali, apakah dampaknya terisolasi tanpa merusak paket lain?
