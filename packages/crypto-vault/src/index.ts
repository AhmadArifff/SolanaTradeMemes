export {
  generateSalt,
  generateIv,
  deriveKeyFromPassword,
} from './kdf.js';

export {
  encryptPrivateKey,
  decryptPrivateKey,
} from './cipher.js';

export {
  zeroOutMemory,
  zeroOutBuffers,
  purgeMapOfKeys,
  withSecureKey,
} from './sanitize.js';

export {
  getVaultDB,
  saveEncryptedWallet,
  getAllEncryptedWallets,
  getEncryptedWalletById,
  getEncryptedWalletByPublicKey,
  deleteEncryptedWallet,
  clearAllEncryptedWallets,
  closeVaultDB,
} from './storage.js';

export { CryptoVault } from './vault.js';
