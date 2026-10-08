# 30-solana-engine-standards.md: Standar Mesin Eksekusi Solana & PumpPortal

Dokumen ini mendefinisikan standar teknis penyiaran transaksi dan integrasi API untuk `@repo/solana-engine`.

---

## 1. Integrasi API PumpPortal `trade-local`

1. **Alamat Endpoint:** `POST https://pumpportal.fun/api/trade-local`
2. **Payload Wajib:**
   ```json
   {
     "publicKey": "<PUBLIC_KEY_DOMPET>",
     "action": "buy" | "sell",
     "mint": "<TOKEN_MINT_ADDRESS>",
     "amount": 0.5,
     "denominatedInSol": "true",
     "slippage": 10,
     "priorityFee": 0.005,
     "pool": "pump"
   }
   ```
3. **Format Respons:** Respons berupa `ArrayBuffer` biner dari transaksi yang belum ditandatangani (*unsigned serialized transaction*).

---

## 2. Deserialisasi & Penandatanganan Versi v0 (VersionedTransaction)

1. Format transaksi modern Solana (khususnya Pump.fun & Raydium) wajib menggunakan `VersionedTransaction`:
   ```typescript
   import { VersionedTransaction, Keypair } from "@solana/web3.js";

   export function signLocalTradeTransaction(
     rawBytes: Uint8Array,
     keypair: Keypair
   ): VersionedTransaction {
     const transaction = VersionedTransaction.deserialize(rawBytes);
     transaction.sign([keypair]);
     return transaction;
   }
   ```
2. Dilarang mengonversi transaksi v0 kembali ke format legacy `Transaction` karena akan merusak struktur Address Lookup Tables (ALT).

---

## 3. Penyiaran Paralel (Parallel RPC Direct Egress)

1. Semua transaksi yang telah ditandatangani disiarkan ke endpoint Private RPC (Helius/QuickNode) menggunakan `Promise.allSettled`:
   ```typescript
   const broadcastResults = await Promise.allSettled(
     signedTransactions.map(async ({ keypair, tx }) => {
       const rawTx = tx.serialize();
       const signature = await connection.sendRawTransaction(rawTx, {
         skipPreflight: true,
         maxRetries: 3,
       });
       return { publicKey: keypair.publicKey.toBase58(), signature };
     })
   );
   ```
2. Parameter `{ skipPreflight: true }` digunakan untuk mempercepat waktu propagasi transaksi langsung ke leader validator tanpa menunggu simulasi RPC lokal.

---

## 4. Penanganan Error Transaksi

1. Tangkap kode error umum Solana:
   * `0x1770` (Custom Program Error 6000): Slippage Tolerance Exceeded.
   * `0x1` (Insufficient Funds): Saldo SOL tidak mencukupi untuk gas fee atau transaksi.
   * `BlockhashNotFound`: Blockhash kadaluarsa akibat latensi jaringan.
2. Setiap error wajib dipetakan ke pesan ramah pengguna tanpa memutus eksekusi dompet lain dalam batch yang sama.
