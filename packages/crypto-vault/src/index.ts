export {
  generateSalt,
  generateIv,
  deriveKeyFromPassword,
} from './kdf';

export {
  encryptPrivateKey,
  decryptPrivateKey,
} from './cipher';

export {
  zeroOutMemory,
  zeroOutBuffers,
  purgeMapOfKeys,
  withSecureKey,
} from './sanitize';

export {
  getVaultDB,
  saveEncryptedWallet,
  getAllEncryptedWallets,
  getEncryptedWalletById,
  getEncryptedWalletByPublicKey,
  deleteEncryptedWallet,
  clearAllEncryptedWallets,
  closeVaultDB,
} from './storage';

export { CryptoVault } from './vault';
