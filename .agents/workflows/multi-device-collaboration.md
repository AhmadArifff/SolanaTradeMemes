# SOP Kolaborasi Tim & Alur Percabangan Git (Multi-Device Collaboration)

> **Kapan Digunakan:** Wajib dipatuhi pada setiap siklus pengerjaan fitur, perbaikan bug, dan sebelum melakukan `git push` ke repositori remote.

---

## 1. Aturan Percabangan (Branching Strategy)

* **Branch `main` (Production):**
  * Bertindak sebagai *Release/Production* yang stabil.
  * Hanya menerima merge dari `dev` setelah pengujian fitur tuntas dan terverifikasi.
* **Branch `dev` (Development):**
  * **Branch aktif utama untuk seluruh tim pengembangan.**
  * Setiap pengerjaan tugas, penambahan fitur, dan perbaikan harian WAJIB berada di branch `dev`.
  * Setiap *commit* dan *push* perubahan langsung diarahkan ke `dev`.

---

## 2. Protokol Pra-Push: Wajib `git pull` Dahulu

Karena proyek ini dikerjakan oleh tim multi-developer di lingkungan perangkat berbeda, untuk mengeliminasi potensi konflik kode (*code conflict*):

### Langkah Standar Sebelum Mulai Bekerja:
```bash
# 1. Pastikan berada di branch dev
git checkout dev

# 2. Tarik perubahan terbaru dari remote sebelum menulis kode baru
git pull --rebase origin dev
```

### Langkah Standar Sebelum Melakukan Push:
```bash
# 1. Periksa status berkas yang diubah
git status

# 2. Stage berkas yang relevan (hindari berkas sampah)
git add <file-paths>

# 3. Buat commit deskriptif
git commit -m "feat(modul): deskripsi perubahan ringkas"

# 4. WAJIB pull rebase terlebih dahulu sebelum push
git pull --rebase origin dev

# 5. Jika ada konflik, selesaikan secara hati-hati, lalu push ke dev
git push origin dev
```

---

## 3. Larangan Keras Git

1. **DILARANG** melakukan `git push --force` ke branch `dev` maupun `main`.
2. **DILARANG** melakukan commit langsung ke `main` untuk pekerjaan development harian.
3. **DILARANG** melakukan *stash pop* atau *hard reset* tanpa memeriksa perbedaan kode (*diff*) terlebih dahulu.
