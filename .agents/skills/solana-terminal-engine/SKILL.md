---
name: solana-terminal-engine
description: >
  Specialized skill for engineering high-performance Solana trading engines.
  Use when dealing with Solana Web3.js VersionedTransaction (v0), Address Lookup Tables (ALT),
  PumpPortal /api/trade-local API integration, local buffer deserialization and signing,
  parallel transaction broadcasting with Promise.allSettled, private RPC connection management,
  and transaction confirmation tracking.
---

# Solana Terminal Engine Skill

Skill ini memandu implementasi teknis mesin perdagangan Solana berkecepatan tinggi dengan arsitektur Pure Client-Side di dalam paket `@repo/solana-engine`.

---

## 1. Integrasi PumpPortal `trade-local`

PumpPortal menyediakan endpoint untuk merakit instruksi transaksi tanpa mengharuskan pengguna membagikan kunci rahasia:
* **Endpoint:** `POST https://pumpportal.fun/api/trade-local`
* **Implementasi Pemanggilan:**
```typescript
export async function createTradeLocalTransaction(params: {
  publicKey: string;
  action: 'buy' | 'sell';
  mint: string;
  amount: number;
  denominatedInSol: boolean;
  slippage: number;
  priorityFee: number;
  pool?: 'pump' | 'raydium';
}): Promise<Uint8Array> {
  const response = await fetch('https://pumpportal.fun/api/trade-local', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      publicKey: params.publicKey,
      action: params.action,
      mint: params.mint,
      amount: params.amount,
      denominatedInSol: params.denominatedInSol ? 'true' : 'false',
      slippage: params.slippage,
      priorityFee: params.priorityFee,
      pool: params.pool || 'pump',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PumpPortal error (${response.status}): ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
```

---

## 2. Deserialisasi & Penandatanganan Versi v0 (VersionedTransaction)

```typescript
import { VersionedTransaction, Keypair } from '@solana/web3.js';

export function signVersionedTransaction(
  rawBytes: Uint8Array,
  keypair: Keypair
): VersionedTransaction {
  // Deserialisasi dari buffer biner mentah
  const tx = VersionedTransaction.deserialize(rawBytes);
  // Tandatangani dengan keypair lokal akun
  tx.sign([keypair]);
  return tx;
}
```

---

## 3. Penyiaran Paralel Multi-Dompet (`Promise.allSettled`)

```typescript
import { Connection, VersionedTransaction } from '@solana/web3.js';

export interface WalletExecutionTask {
  publicKey: string;
  signedTx: VersionedTransaction;
}

export interface BroadcastResult {
  publicKey: string;
  status: 'fulfilled' | 'rejected';
  signature?: string;
  error?: string;
}

export async function broadcastBatchTransactions(
  connection: Connection,
  tasks: WalletExecutionTask[]
): Promise<BroadcastResult[]> {
  const settled = await Promise.allSettled(
    tasks.map(async (task) => {
      const rawBytes = task.signedTx.serialize();
      const signature = await connection.sendRawTransaction(rawBytes, {
        skipPreflight: true,
        maxRetries: 3,
      });
      return { publicKey: task.publicKey, signature };
    })
  );

  return settled.map((result, index) => {
    const targetPubkey = tasks[index].publicKey;
    if (result.status === 'fulfilled') {
      return {
        publicKey: targetPubkey,
        status: 'fulfilled',
        signature: result.value.signature,
      };
    } else {
      return {
        publicKey: targetPubkey,
        status: 'rejected',
        error: result.reason?.message || 'Transaction broadcast failed',
      };
    }
  });
}
```
