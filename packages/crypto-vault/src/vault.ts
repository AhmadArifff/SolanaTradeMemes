import bs58 from 'bs58';
import {
  Result,
  MasterPasswordSchema,
  ImportWalletSchema,
  type ImportWalletInput,
  type EncryptedWalletRecord,
} from '@repo/types';
import { generateSalt, generateIv, deriveKeyFromPassword } from './kdf.js';
import { encryptPrivateKey, decryptPrivateKey } from './cipher.js';
import { zeroOutMemory, purgeMapOfKeys } from './sanitize.js';
import {
  saveEncryptedWallet,
  getAllEncryptedWallets,
  getEncryptedWalletById,
  deleteEncryptedWallet,
} from './storage.js';

export class CryptoVault {
  private activeDecryptedKeys = new Map<string, Uint8Array>();
  private unlocked = false;

  /**
   * Mengetahui apakah kubah saat ini dalam kondisi terbuka (unlocked) di memori RAM.
   */
  public isUnlocked(): boolean {
    return this.unlocked;
  }

  /**
   * Mendapatkan daftar ID dompet yang kuncinya aktif di memori RAM.
   */
  public getActiveWalletIds(): string[] {
    return Array.from(this.activeDecryptedKeys.keys());
  }

  /**
   * Mengambil referensi byte kunci privat dompet yang aktif di RAM berdasarkan ID dompet.
   * PERHATIAN: Dilarang mengirim atau mengekspos byte ini ke luar runtime browser.
   */
  public getActiveKey(walletId: string): Uint8Array | undefined {
    return this.activeDecryptedKeys.get(walletId);
  }

  /**
   * Mengimpor kunci privat baru ke dalam kubah terenkripsi.
   * Menerima Base58 secret key (64 byte untuk Keypair Solana standar).
   */
  public async importWallet(
    input: ImportWalletInput,
    masterPassword: string
  ): Promise<Result<EncryptedWalletRecord>> {
    // 1. Validasi masukan
    const passwordCheck = MasterPasswordSchema.safeParse(masterPassword);
    if (!passwordCheck.success) {
      return Result.fail(passwordCheck.error.errors[0]?.message ?? 'Kata sandi master tidak valid');
    }

    const inputCheck = ImportWalletSchema.safeParse(input);
    if (!inputCheck.success) {
      return Result.fail(inputCheck.error.errors[0]?.message ?? 'Format data dompet tidak valid');
    }

    let secretKeyBytes: Uint8Array | null = null;

    try {
      // 2. Dekode kunci Base58 ke byte array
      secretKeyBytes = bs58.decode(input.privateKeyBase58);

      // Solana keypair standar adalah 64 byte (32 byte seed + 32 byte public key)
      if (secretKeyBytes.length !== 64) {
        return Result.fail(
          `Panjang kunci privat Solana tidak valid: diharapkan 64 byte, diterima ${secretKeyBytes.length} byte.`
        );
      }

      // 3. Ekstrak public key (32 byte terakhir pada susunan Solana Keypair)
      const publicKeyBytes = secretKeyBytes.subarray(32, 64);
      const publicKey = bs58.encode(publicKeyBytes);

      // 4. Siapkan salt (16 byte) dan IV (12 byte) acak unik
      const salt = generateSalt();
      const iv = generateIv();

      // 5. Turunkan kunci simetris AES-GCM 256-bit dan enkripsi
      const derivedKey = await deriveKeyFromPassword(masterPassword, salt);
      const encryptedPrivateKey = await encryptPrivateKey(secretKeyBytes, derivedKey, iv);

      // 6. Susun rekaman kubah
      const record: EncryptedWalletRecord = {
        id: globalThis.crypto.randomUUID(),
        label: input.label.trim(),
        publicKey,
        encryptedPrivateKey,
        iv,
        salt,
        createdAt: Date.now(),
      };

      // 7. Simpan ke IndexedDB lokal
      await saveEncryptedWallet(record);

      // 8. Jika kubah sedang dalam status unlocked, simpan juga salinan kunci aktif di RAM
      if (this.unlocked) {
        const memoryKeyCopy = new Uint8Array(secretKeyBytes);
        this.activeDecryptedKeys.set(record.id, memoryKeyCopy);
      }

      return Result.ok(record);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : 'Gagal mengimpor dompet ke kubah terenkripsi'
      );
    } finally {
      // 9. Langsung musnahkan buffer sementara kunci privat di RAM
      if (secretKeyBytes) {
        zeroOutMemory(secretKeyBytes);
      }
    }
  }

  /**
   * Membuka kubah dengan kata sandi master.
   * Mendekripsi seluruh dompet yang ada di IndexedDB ke RAM.
   */
  public async unlock(masterPassword: string): Promise<Result<number>> {
    const passwordCheck = MasterPasswordSchema.safeParse(masterPassword);
    if (!passwordCheck.success) {
      return Result.fail(passwordCheck.error.errors[0]?.message ?? 'Kata sandi master tidak valid');
    }

    try {
      const records = await getAllEncryptedWallets();
      if (records.length === 0) {
        this.unlocked = true;
        return Result.ok(0);
      }

      // Bersihkan cache lama jika ada sebelum membuka kembali
      this.lock();

      const newKeysMap = new Map<string, Uint8Array>();

      for (const record of records) {
        const derivedKey = await deriveKeyFromPassword(masterPassword, record.salt);
        const decryptedBytes = await decryptPrivateKey(
          record.encryptedPrivateKey,
          derivedKey,
          record.iv
        );
        newKeysMap.set(record.id, decryptedBytes);
      }

      this.activeDecryptedKeys = newKeysMap;
      this.unlocked = true;

      return Result.ok(records.length);
    } catch (error) {
      this.lock();
      return Result.fail(
        error instanceof Error
          ? error.message
          : 'Kata sandi master salah atau data kubah tidak dapat didekripsi'
      );
    }
  }

  /**
   * Mengunci kembali kubah dan memusnahkan seluruh buffer byte kunci privat di RAM (Zero-out memory).
   */
  public lock(): void {
    purgeMapOfKeys(this.activeDecryptedKeys);
    this.unlocked = false;
  }

  /**
   * Mengekspor kunci privat dompet tertentu kembali ke format Base58.
   * Memerlukan verifikasi ulang kata sandi master.
   */
  public async exportPrivateKey(
    walletId: string,
    masterPassword: string
  ): Promise<Result<string>> {
    const record = await getEncryptedWalletById(walletId);
    if (!record) {
      return Result.fail('Dompet tidak ditemukan di dalam kubah');
    }

    let decryptedBytes: Uint8Array | null = null;
    try {
      const derivedKey = await deriveKeyFromPassword(masterPassword, record.salt);
      decryptedBytes = await decryptPrivateKey(
        record.encryptedPrivateKey,
        derivedKey,
        record.iv
      );
      const base58Key = bs58.encode(decryptedBytes);
      return Result.ok(base58Key);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : 'Kata sandi master salah'
      );
    } finally {
      if (decryptedBytes) {
        zeroOutMemory(decryptedBytes);
      }
    }
  }

  /**
   * Menghapus dompet dari kubah permanen di IndexedDB dan membersihkan kuncinya dari RAM.
   */
  public async removeWallet(walletId: string): Promise<Result<void>> {
    try {
      const activeKey = this.activeDecryptedKeys.get(walletId);
      if (activeKey) {
        zeroOutMemory(activeKey);
        this.activeDecryptedKeys.delete(walletId);
      }
      await deleteEncryptedWallet(walletId);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : 'Gagal menghapus dompet dari penyimpanan'
      );
    }
  }
}
