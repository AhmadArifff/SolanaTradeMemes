# 01-workflow-discipline.md: Disiplin Alur Kerja & Review Gate

Dokumen ini mengatur tata tertib eksekusi teknis agen guna memastikan setiap perubahan kode terencana, terverifikasi, dan bebas dari cacat regresi.

---

## 1. Siklus Kerja OODA Loop

Setiap agen wajib menjalankan siklus **OODA (Observe -> Orient -> Decide -> Act)**:
1. **Observe:** Membaca berkas target, memeriksa dependensi di `package.json`, dan memahami konteks permintaan pengguna.
2. **Orient:** Mengidentifikasi batasan arsitektur (PRD.md, batasan monorepo, isolasi keamanan Web Crypto).
3. **Decide:** Menyusun rencana perubahan terstruktur, memilih tool yang tepat, dan memetakan acceptance criteria.
4. **Act:** Menulis atau mengedit kode secara presisi dan terarah.

---

## 2. Review Gate 7 Pilar

Sebelum menulis kode atau membuat berkas baru, agen wajib meninjau 7 pilar kelayakan:
1. **Scope:** Apakah perubahan berada dalam ruang lingkup MVP v1.1 di PRD?
2. **Security Impact:** Apakah ada risiko kebocoran kunci privat atau eksposur RAM?
3. **Monorepo Boundary:** Apakah kode ditempatkan di paket yang tepat (`@repo/solana-engine`, `@repo/crypto-vault`, `@repo/types`, atau `apps/web`)?
4. **Performance:** Apakah fungsi penandatanganan dan penyiaran tetap non-blocking?
5. **UX Impact:** Apakah tampilan konsisten dengan tema cyberpunk dark mode terminal?
6. **Edge Cases:** Bagaimana penanganan jika PumpPortal timeout atau RPC rate limit?
7. **Rollback Plan:** Apakah perubahan modular dan mudah di-revert jika terjadi kegagalan?

---

## 3. Pemisahan Peran Builder vs Reviewer (No Self-Review)

1. Kode yang dibuat oleh peran Builder (`frontend-engineer`, `backend-engineer`) wajib melalui evaluasi kritis Reviewer (`qa-engineer` atau `tech-critic`).
2. Builder dilarang mengklaim fitur selesai tanpa memvalidasi skenario error dan kegagalan tepi (*edge cases*).

---

## 4. Batas Putaran Revisi (Circuit Breaker)

Jika terjadi siklus perbaikan berulang sebanyak $\ge$ 3 kali pada satu masalah yang sama antara QA dan Builder:
1. Hentikan otomatisasi secara terhormat.
2. Jelaskan kendala fundamental kepada pengguna secara transparan.
3. Minta arahan pengguna (*Human-in-the-Loop*) sebelum melanjutkan.
