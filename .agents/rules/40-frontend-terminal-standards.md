# 40-frontend-terminal-standards.md: Standar Antarmuka Frontend Terminal & UI/UX

Dokumen ini mendefinisikan standar pengembangan antarmuka visual untuk `apps/web` dan `@repo/ui`.

---

## 1. Arsitektur Komponen Next.js (Pure Client SPA)

1. Karena aplikasi tidak memiliki database backend, seluruh halaman interaktif menggunakan deklarasi `'use client'`.
2. Dilarang menggunakan server-side database fetching atau Server Actions untuk operasional trading.
3. Halaman dioptimalkan agar dapat diekspor secara statis (*Static Export* / PWA) dan di-cache penuh oleh CDN Vercel.

---

## 2. Polling Harga & Portofolio (TanStack Query v5)

1. Gunakan TanStack Query dengan interval polling teratur:
   ```typescript
   export function useTokenPrice(mintAddress: string) {
     return useQuery({
       queryKey: ['token-price', mintAddress],
       queryFn: () => fetchTokenPrice(mintAddress),
       refetchInterval: (query) => {
         // Adaptive Polling: 30 detik jika tab tidak aktif, 5 detik jika aktif
         return typeof document !== 'undefined' && document.hidden ? 30000 : 5000;
       },
       enabled: Boolean(mintAddress),
       staleTime: 3000,
     });
   }
   ```
2. Kalkulasi laba-rugi (*Unrealized PnL*) dihitung secara reaktif di sisi klien menggunakan memoized selector:
   $$\text{PnL \%} = \frac{\text{Nilai Saat Ini} - \text{Modal Beli}}{\text{Modal Beli}} \times 100$$

---

## 3. Desain Visual & Tipografi (Cyberpunk DeFi Terminal)

1. **Tema Warna:** Dark mode dominan (`bg-zinc-950`, `border-zinc-800/80`, `card: zinc-900/50`).
2. **Pewarnaan Semantik Keuangan:**
   * Laba (*Profit*): Hijau Emerald terang (`text-emerald-400`, `bg-emerald-500/10`).
   * Rugi (*Loss*): Merah Rose tajam (`text-rose-400`, `bg-rose-500/10`).
   * Netral: Abu-abu Slate (`text-zinc-400`).
3. **Pure Numeric & Monospace Typography:**
   * Alamat Public Key, Mint CA, dan Hash Transaksi wajib menggunakan font Monospace (`font-mono`) dengan fitur salin satu klik (*one-click copy*).
   * Angka persentase dan nilai SOL diformat rapi tanpa imbuhan ambigu.

---

## 4. Aksesibilitas & Responsivitas Mobile

1. Mematuhi standar WCAG AA dengan rasio kontras teks minimal 4.5:1 terhadap latar belakang gelap.
2. Ukuran tombol dan target sentuh minimal 44x44px.
3. Menjamin layout fleksibel tanpa kebocoran overflow horizontal pada layar ponsel (R-03).
