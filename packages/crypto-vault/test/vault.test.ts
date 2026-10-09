import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import bs58 from 'bs58';
import {
  generateSalt,
  generateIv,
  deriveKeyFromPassword,
  encryptPrivateKey,
  decryptPrivateKey,
  zeroOutMemory,
  zeroOutBuffers,
  CryptoVault,
  clearAllEncryptedWallets,
  closeVaultDB,
} from '../src/index.js';

describe('@repo/crypto-vault - Kubah Kriptografi Terisolasi', () => {
  beforeEach(async () => {
    await clearAllEncryptedWallets();
  });

  afterEach(() => {
    closeVaultDB();
  });

  describe('1. Key Derivation & Random Generator (kdf.ts)', () => {
    it('menghasilkan salt 16-byte dan IV 12-byte acak unik', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const iv1 = generateIv();
      const iv2 = generateIv();

      expect(salt1.length).toBe(16);
      expect(salt2.length).toBe(16);
      expect(iv1.length).toBe(12);
      expect(iv2.length).toBe(12);

      // Pastikan kedua generasi menghasilkan nilai acak berbeda
      expect(salt1).not.toEqual(salt2);
      expect(iv1).not.toEqual(iv2);
    });

    it('menurunkan CryptoKey non-extractable menggunakan PBKDF2', async () => {
      const password = 'SuperSecretMasterPassword123!';
      const salt = generateSalt();

      const key = await deriveKeyFromPassword(password, salt);
      expect(key).toBeDefined();
      expect(key.algorithm.name).toBe('AES-GCM');
      expect(key.extractable).toBe(false);
    });
  });

  describe('2. Enkripsi & Dekripsi Simetris (cipher.ts)', () => {
    it('berhasil melakukan enkripsi dan dekripsi roundtrip secara presisi', async () => {
      const password = 'ValidMasterPassword2026!';
      const salt = generateSalt();
      const iv = generateIv();

      const key = await deriveKeyFromPassword(password, salt);
      const originalSecret = new Uint8Array(64);
      for (let i = 0; i < 64; i++) {
        originalSecret[i] = (i * 7 + 13) % 256;
      }

      // Enkripsi
      const ciphertext = await encryptPrivateKey(originalSecret, key, iv);
      expect(ciphertext.byteLength).toBe(64 + 16); // 64 byte data + 16 byte (128-bit) auth tag

      // Dekripsi dengan kunci yang sama
      const decrypted = await decryptPrivateKey(ciphertext, key, iv);
      expect(decrypted).toEqual(originalSecret);
    });

    it('menolak dekripsi jika kata sandi salah (Gagal Autentikasi Tag)', async () => {
      const correctPassword = 'CorrectMasterPassword123!';
      const wrongPassword = 'WrongMasterPassword999!';
      const salt = generateSalt();
      const iv = generateIv();

      const correctKey = await deriveKeyFromPassword(correctPassword, salt);
      const wrongKey = await deriveKeyFromPassword(wrongPassword, salt);

      const secret = new Uint8Array(64).fill(42);
      const ciphertext = await encryptPrivateKey(secret, correctKey, iv);

      // Dekripsi dengan kunci salah harus melempar error
      await expect(decryptPrivateKey(ciphertext, wrongKey, iv)).rejects.toThrow(
        /Kata sandi master salah atau data kubah rusak/
      );
    });

    it('menolak dekripsi jika ciphertext atau IV mengalami modifikasi (Anti-Tamper)', async () => {
      const password = 'StrictTamperTestPassword!';
      const salt = generateSalt();
      const iv = generateIv();

      const key = await deriveKeyFromPassword(password, salt);
      const secret = new Uint8Array(64).fill(99);
      const ciphertext = await encryptPrivateKey(secret, key, iv);

      // Modifikasi byte pertama ciphertext
      const tamperedBytes = new Uint8Array(ciphertext);
      tamperedBytes[0] = (tamperedBytes[0]! ^ 0xff);

      await expect(
        decryptPrivateKey(tamperedBytes.buffer, key, iv)
      ).rejects.toThrow(/Kata sandi master salah atau data kubah rusak/);
    });
  });

  describe('3. Sanitasi & Pembersihan Memori (sanitize.ts)', () => {
    it('menimpa buffer memori dengan angka nol (zero-out memory)', () => {
      const sensitiveBuffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      zeroOutMemory(sensitiveBuffer);

      expect(sensitiveBuffer).toEqual(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]));
    });

    it('menimpa beberapa buffer sekaligus menggunakan zeroOutBuffers', () => {
      const buf1 = new Uint8Array([10, 20]);
      const buf2 = new Uint8Array([30, 40]);
      zeroOutBuffers(buf1, buf2);

      expect(buf1).toEqual(new Uint8Array([0, 0]));
      expect(buf2).toEqual(new Uint8Array([0, 0]));
    });
  });

  describe('4. Manajemen Kubah Dompet Lengkap (vault.ts)', () => {
    // Siapkan 64 byte dummy Solana keypair
    const dummyKeyBytes = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      dummyKeyBytes[i] = (i + 5) % 256;
    }
    const dummyBase58 = bs58.encode(dummyKeyBytes);
    const expectedPublicKey = bs58.encode(dummyKeyBytes.subarray(32, 64));
    const masterPassword = 'MasterTerminalPassword123#';

    it('berhasil mengimpor dompet, menyimpan terenkripsi, dan menghitung public key dengan benar', async () => {
      const vault = new CryptoVault();

      const importResult = await vault.importWallet(
        {
          label: 'Sniper Alpha 01',
          privateKeyBase58: dummyBase58,
        },
        masterPassword
      );

      expect(importResult.success).toBe(true);
      if (!importResult.success) return;

      expect(importResult.data.label).toBe('Sniper Alpha 01');
      expect(importResult.data.publicKey).toBe(expectedPublicKey);
      expect(importResult.data.encryptedPrivateKey).toBeDefined();
      expect(importResult.data.salt.length).toBe(16);
      expect(importResult.data.iv.length).toBe(12);
    });

    it('menolak impor jika panjang kunci bukan 64 byte', async () => {
      const vault = new CryptoVault();
      const invalidShortKey = bs58.encode(new Uint8Array(32)); // Hanya 32 byte

      const result = await vault.importWallet(
        {
          label: 'Bad Key Wallet',
          privateKeyBase58: invalidShortKey,
        },
        masterPassword
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('diharapkan 64 byte');
      }
    });

    it('berhasil membuka kubah (unlock), mengekspor kunci, dan mengunci kembali (lock memory zeroing)', async () => {
      const vault = new CryptoVault();

      // 1. Impor dompet
      const importResult = await vault.importWallet(
        {
          label: 'Sniper Beta 02',
          privateKeyBase58: dummyBase58,
        },
        masterPassword
      );
      expect(importResult.success).toBe(true);
      if (!importResult.success) return;
      const walletId = importResult.data.id;

      // 2. Buka kubah dengan kata sandi benar
      const unlockResult = await vault.unlock(masterPassword);
      expect(unlockResult.success).toBe(true);
      expect(vault.isUnlocked()).toBe(true);

      // Kunci harus aktif di RAM
      const activeKey = vault.getActiveKey(walletId);
      expect(activeKey).toBeDefined();
      expect(activeKey).toEqual(dummyKeyBytes);

      // 3. Ekspor kunci privat
      const exportResult = await vault.exportPrivateKey(walletId, masterPassword);
      expect(exportResult.success).toBe(true);
      if (exportResult.success) {
        expect(exportResult.data).toBe(dummyBase58);
      }

      // 4. Kunci kubah (Lock)
      vault.lock();
      expect(vault.isUnlocked()).toBe(false);
      expect(vault.getActiveKey(walletId)).toBeUndefined();
    });

    it('menolak unlock jika kata sandi salah dan mengosongkan memori', async () => {
      const vault = new CryptoVault();

      await vault.importWallet(
        {
          label: 'Sniper Gamma 03',
          privateKeyBase58: dummyBase58,
        },
        masterPassword
      );

      const unlockResult = await vault.unlock('WrongPasswordTotally!');
      expect(unlockResult.success).toBe(false);
      expect(vault.isUnlocked()).toBe(false);
      expect(vault.getActiveWalletIds().length).toBe(0);
    });

    it('berhasil menghapus dompet dari kubah permanen', async () => {
      const vault = new CryptoVault();

      const importResult = await vault.importWallet(
        {
          label: 'Sniper Delta 04',
          privateKeyBase58: dummyBase58,
        },
        masterPassword
      );
      if (!importResult.success) return;
      const walletId = importResult.data.id;

      await vault.unlock(masterPassword);
      expect(vault.getActiveKey(walletId)).toBeDefined();

      const removeResult = await vault.removeWallet(walletId);
      expect(removeResult.success).toBe(true);
      expect(vault.getActiveKey(walletId)).toBeUndefined();
    });
  });
});
