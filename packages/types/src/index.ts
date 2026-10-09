import { z } from 'zod';

// ==============================================================================
// 1. Result Pattern (High Engineering Standard)
// ==============================================================================
export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };

export const Result = {
  ok: <T>(data: T): Result<T, never> => ({ success: true, data }),
  fail: <E = string>(error: E): Result<never, E> => ({ success: false, error }),
};

// ==============================================================================
// 2. Kriptografi & Kubah Dompet (Crypto Vault Schemas)
// ==============================================================================

export const MasterPasswordSchema = z
  .string()
  .min(8, 'Kata sandi master minimal 8 karakter');

export const ImportWalletSchema = z.object({
  label: z.string().min(1, 'Label dompet wajib diisi').max(30),
  privateKeyBase58: z
    .string()
    .min(32, 'Kunci privat Base58 tidak valid')
    .max(90, 'Kunci privat Base58 terlalu panjang'),
});

export type ImportWalletInput = z.infer<typeof ImportWalletSchema>;

export interface EncryptedWalletRecord {
  id: string;
  label: string;
  publicKey: string;
  encryptedPrivateKey: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
  createdAt: number;
}

export interface WalletSessionEntry {
  id: string;
  label: string;
  publicKey: string;
  solBalance: number;
  tokenBalance: number;
  isSelected: boolean;
  lastUpdated?: number;
}

// ==============================================================================
// 3. Mesin Transaksi Solana & PumpPortal (Trade Engine Schemas)
// ==============================================================================

export const TradeActionSchema = z.enum(['buy', 'sell']);
export type TradeAction = z.infer<typeof TradeActionSchema>;

export const PoolTypeSchema = z.enum(['pump', 'raydium']);
export type PoolType = z.infer<typeof PoolTypeSchema>;

export const TradeLocalRequestSchema = z.object({
  publicKey: z.string().min(32).max(44),
  action: TradeActionSchema,
  mint: z.string().min(32).max(44),
  amount: z.number().positive('Jumlah harus lebih besar dari 0'),
  denominatedInSol: z.boolean(),
  slippage: z.number().min(0).max(100),
  priorityFee: z.number().min(0),
  pool: PoolTypeSchema.default('pump'),
});

export type TradeLocalRequest = z.infer<typeof TradeLocalRequestSchema>;

export interface TradeExecutionTask {
  publicKey: string;
  walletLabel: string;
  amount: number;
  denominatedInSol: boolean;
}

export interface BroadcastResult {
  publicKey: string;
  walletLabel?: string;
  status: 'fulfilled' | 'rejected';
  signature?: string;
  error?: string;
  timestamp: number;
}

// ==============================================================================
// 4. Buku Besar Riwayat Transaksi & Realized PnL (Trade Ledger)
// ==============================================================================

export const TradeLedgerEntrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.number(),
  walletPublicKey: z.string(),
  walletLabel: z.string(),
  action: TradeActionSchema,
  tokenMint: z.string(),
  tokenSymbol: z.string().optional(),
  tokenAmount: z.number(),
  solAmount: z.number(),
  pricePerTokenSol: z.number(),
  signature: z.string(),
  costBasisSol: z.number().optional(),
  realizedPnlSol: z.number().optional(),
  realizedPnlPercent: z.number().optional(),
});

export type TradeLedgerEntry = z.infer<typeof TradeLedgerEntrySchema>;

export interface SessionTradeSummary {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePercent: number;
  totalRealizedPnlSol: number;
  averageRoiPercent: number;
}

// ==============================================================================
// 5. Pemantauan Harga & Token Metadata (Market Data)
// ==============================================================================

export interface TokenPriceData {
  mint: string;
  symbol: string;
  name: string;
  priceSol: number;
  priceUsd: number;
  marketCapUsd?: number;
  liquidityUsd?: number;
  volume24h?: number;
  priceChange24h?: number;
  updatedAt: number;
}

// ==============================================================================
// 6. Konstanta Konfigurasi Default (Constants)
// ==============================================================================

export const TRADING_DEFAULTS = {
  SLIPPAGE_PERCENT: 10,
  PRIORITY_FEE_SOL: 0.005,
  RENT_EXEMPT_RESERVE_SOL: 0.005,
  COMPUTE_UNIT_LIMIT: 200000,
  MAX_RETRIES: 3,
} as const;

export const POLLING_INTERVALS = {
  ACTIVE_TAB_MS: 5000,
  BLUR_TAB_MS: 30000,
} as const;

export const CRYPTO_VAULT_CONSTANTS = {
  PBKDF2_ITERATIONS: 100000,
  SALT_BYTE_LENGTH: 16,
  IV_BYTE_LENGTH: 12,
  AES_KEY_LENGTH: 256,
  INACTIVITY_TIMEOUT_MS: 15 * 60 * 1000, // 15 menit
} as const;
