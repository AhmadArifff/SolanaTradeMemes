import { openDB, type IDBPDatabase } from 'idb';
import type { EncryptedWalletRecord } from '@repo/types';

const VAULT_DB_NAME = 'solana_trade_vault';
const VAULT_DB_VERSION = 1;
const WALLETS_STORE_NAME = 'encrypted_wallets';

interface VaultDBSchema {
  [WALLETS_STORE_NAME]: {
    key: string;
    value: EncryptedWalletRecord;
    indexes: {
      by_publicKey: string;
    };
  };
}

let dbInstance: IDBPDatabase<VaultDBSchema> | null = null;

/**
 * Membuka atau menggunakan kembali koneksi IndexedDB untuk kubah dompet terenkripsi.
 */
export async function getVaultDB(): Promise<IDBPDatabase<VaultDBSchema>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<VaultDBSchema>(VAULT_DB_NAME, VAULT_DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(WALLETS_STORE_NAME)) {
        const store = db.createObjectStore(WALLETS_STORE_NAME, {
          keyPath: 'id',
        });
        store.createIndex('by_publicKey', 'publicKey', { unique: true });
      }
    },
  });

  return dbInstance;
}

/**
 * Menyimpan rekaman dompet terenkripsi ke IndexedDB.
 */
export async function saveEncryptedWallet(
  record: EncryptedWalletRecord
): Promise<void> {
  const db = await getVaultDB();
  await db.put(WALLETS_STORE_NAME, record);
}

/**
 * Mengambil seluruh rekaman dompet terenkripsi dari IndexedDB.
 */
export async function getAllEncryptedWallets(): Promise<EncryptedWalletRecord[]> {
  const db = await getVaultDB();
  return db.getAll(WALLETS_STORE_NAME);
}

/**
 * Mengambil rekaman dompet terenkripsi berdasarkan ID unik.
 */
export async function getEncryptedWalletById(
  id: string
): Promise<EncryptedWalletRecord | undefined> {
  const db = await getVaultDB();
  return db.get(WALLETS_STORE_NAME, id);
}

/**
 * Mengambil rekaman dompet terenkripsi berdasarkan alamat Public Key Solana.
 */
export async function getEncryptedWalletByPublicKey(
  publicKey: string
): Promise<EncryptedWalletRecord | undefined> {
  const db = await getVaultDB();
  const tx = db.transaction(WALLETS_STORE_NAME, 'readonly');
  const index = tx.store.index('by_publicKey');
  return index.get(publicKey);
}

/**
 * Menghapus satu rekaman dompet terenkripsi berdasarkan ID.
 */
export async function deleteEncryptedWallet(id: string): Promise<void> {
  const db = await getVaultDB();
  await db.delete(WALLETS_STORE_NAME, id);
}

/**
 * Menghapus seluruh data dompet dari IndexedDB (Reset Vault).
 */
export async function clearAllEncryptedWallets(): Promise<void> {
  const db = await getVaultDB();
  await db.clear(WALLETS_STORE_NAME);
}

/**
 * Menutup koneksi IndexedDB aktif (berguna saat test teardown).
 */
export function closeVaultDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
