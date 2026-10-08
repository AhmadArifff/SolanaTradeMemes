# Knowledge Base: Solana Trade Memes

Folder ini menyimpan dokumentasi studi kasus, preseden arsitektur, dan solusi penanganan bug yang pernah terjadi dalam ekosistem perdagangan Solana client-side dan integrasi PumpPortal.

---

## Daftar Berkas Rujukan

* **[terminal-cases.md](./terminal-cases.md)**: Bank kasus teknis mencakup:
  1. Penanganan HTTP 429 Rate Limit saat penyiaran 20+ transaksi ke RPC Solana.
  2. Quirks API PumpPortal `trade-local` dan format byte array serialization.
  3. Deserialisasi VersionedTransaction v0 vs Address Lookup Tables (ALT).
  4. Penanganan IndexedDB desync dan pemulihan vault saat browser crash.
