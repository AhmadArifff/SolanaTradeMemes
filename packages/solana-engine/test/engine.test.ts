import { describe, it, expect, vi } from 'vitest';
import {
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
  Connection,
} from '@solana/web3.js';
import bs58 from 'bs58';
import {
  createKeypairFromSecretKey,
  signVersionedTransaction,
  mapSolanaTransactionError,
  broadcastParallelBatch,
  fetchTradeLocalTransaction,
} from '../src/index';

describe('@repo/solana-engine - Mesin Transaksi Solana v0', () => {
  describe('1. Instansiasi Keypair & Validasi Kunci (signer.ts)', () => {
    it('berhasil membuat Keypair dari buffer 64-byte rahasia', () => {
      const generated = Keypair.generate();
      const secretBytes = generated.secretKey;

      const result = createKeypairFromSecretKey(secretBytes);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.publicKey.toBase58()).toBe(generated.publicKey.toBase58());
      }
    });

    it('menolak kunci privat jika panjang byte tidak sama dengan 64', () => {
      const invalidBytes = new Uint8Array(32);
      const result = createKeypairFromSecretKey(invalidBytes);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Kunci privat harus 64 byte');
      }
    });
  });

  describe('2. Deserialisasi & Penandatanganan VersionedTransaction v0 (signer.ts)', () => {
    it('berhasil melakukan deserialisasi dan penandatanganan transaksi v0 lokal di memori', () => {
      const payer = Keypair.generate();
      const recipient = Keypair.generate();
      const dummyBlockhash = bs58.encode(new Uint8Array(32).fill(7));

      // Buat instruksi transfer Solana sederhana
      const instructions = [
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: recipient.publicKey,
          lamports: 1000000,
        }),
      ];

      // Kompilasi ke pesan v0
      const messageV0 = new TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash: dummyBlockhash,
        instructions,
      }).compileToV0Message();

      // Buat unsigned versioned transaction
      const unsignedTx = new VersionedTransaction(messageV0);
      const rawBytes = unsignedTx.serialize();

      // Tandatangani via fungsi signer engine
      const signResult = signVersionedTransaction(rawBytes, payer);
      expect(signResult.success).toBe(true);

      if (signResult.success) {
        const signedTx = signResult.data;
        expect(signedTx.signatures.length).toBe(1);
        // Signature pertama harus ada dan memiliki panjang 64 byte
        expect(signedTx.signatures[0]?.length).toBe(64);
        expect(signedTx.signatures[0]?.some((b) => b !== 0)).toBe(true);
      }
    });
  });

  describe('3. Pemetaan Error Ramah Pengguna (broadcast.ts)', () => {
    it('memetakan custom program error 0x1770 ke pesan slippage', () => {
      const rawErr = new Error('Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1770');
      const friendly = mapSolanaTransactionError(rawErr);
      expect(friendly).toContain('Slippage terlampaui (0x1770)');
    });

    it('memetakan error insufficient funds 0x1 ke pesan saldo tidak mencukupi', () => {
      const rawErr = new Error('SendTransactionError: custom program error: 0x1 (insufficient funds for gas fee)');
      const friendly = mapSolanaTransactionError(rawErr);
      expect(friendly).toContain('Saldo SOL tidak mencukupi');
    });

    it('memetakan error HTTP 429 ke pesan batas kuota rate limit', () => {
      const rawErr = new Error('HTTP status client error (429 Too Many Requests)');
      const friendly = mapSolanaTransactionError(rawErr);
      expect(friendly).toContain('HTTP 429 Rate Limit');
    });

    it('memetakan blockhash expired ke instruksi coba lagi', () => {
      const rawErr = new Error('Transaction failed: BlockhashNotFound');
      const friendly = mapSolanaTransactionError(rawErr);
      expect(friendly).toContain('Blockhash transaksi kadaluarsa');
    });
  });

  describe('4. Penyiaran Paralel Multi-Dompet Promise.allSettled (broadcast.ts)', () => {
    it('menangani penyiaran multi-dompet dengan status fulfilled dan rejected secara independen', async () => {
      const payer1 = Keypair.generate();
      const payer2 = Keypair.generate();
      const dummyBlockhash = bs58.encode(new Uint8Array(32).fill(1));

      const msg1 = new TransactionMessage({
        payerKey: payer1.publicKey,
        recentBlockhash: dummyBlockhash,
        instructions: [],
      }).compileToV0Message();
      const tx1 = new VersionedTransaction(msg1);
      tx1.sign([payer1]);

      const msg2 = new TransactionMessage({
        payerKey: payer2.publicKey,
        recentBlockhash: dummyBlockhash,
        instructions: [],
      }).compileToV0Message();
      const tx2 = new VersionedTransaction(msg2);
      tx2.sign([payer2]);

      // Mock Connection sendRawTransaction: tx1 berhasil, tx2 gagal dengan 0x1770
      const mockConnection = {
        sendRawTransaction: vi.fn().mockImplementation((rawBytes: Uint8Array) => {
          const tx = VersionedTransaction.deserialize(rawBytes);
          if (tx.message.staticAccountKeys[0]?.equals(payer1.publicKey)) {
            return Promise.resolve('5MockSignaturePayer1SuccessXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
          }
          return Promise.reject(new Error('custom program error: 0x1770'));
        }),
      } as unknown as Connection;

      const tasks = [
        { publicKey: payer1.publicKey.toBase58(), walletLabel: 'Dompet A', signedTx: tx1 },
        { publicKey: payer2.publicKey.toBase58(), walletLabel: 'Dompet B', signedTx: tx2 },
      ];

      const results = await broadcastParallelBatch(mockConnection, tasks);

      expect(results.length).toBe(2);

      // Dompet A harus fulfilled
      expect(results[0]?.status).toBe('fulfilled');
      expect(results[0]?.signature).toContain('5MockSignaturePayer1Success');
      expect(results[0]?.walletLabel).toBe('Dompet A');

      // Dompet B harus rejected dengan pesan ramah slippage tanpa menggagalkan Dompet A
      expect(results[1]?.status).toBe('rejected');
      expect(results[1]?.error).toContain('Slippage terlampaui (0x1770)');
      expect(results[1]?.walletLabel).toBe('Dompet B');
    });
  });

  describe('5. Validasi Permintaan PumpPortal (pumpportal.ts)', () => {
    it('menolak permintaan jika alamat mint tidak valid atau amount tidak positif', async () => {
      const result = await fetchTradeLocalTransaction({
        publicKey: Keypair.generate().publicKey.toBase58(),
        action: 'buy',
        mint: 'invalid_short_mint',
        amount: -5,
        denominatedInSol: true,
        slippage: 10,
        priorityFee: 0.005,
      });

      expect(result.success).toBe(false);
    });
  });
});
