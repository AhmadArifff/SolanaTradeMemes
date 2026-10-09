'use client';

import { useQuery } from '@tanstack/react-query';
import { POLLING_INTERVALS, type TokenPriceData } from '@repo/types';

interface DexScreenerPair {
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string; // Harga dalam SOL
  priceUsd: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: {
    usd?: number;
  };
  volume?: {
    h24?: number;
  };
  priceChange?: {
    h24?: number;
  };
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[] | null;
}

/**
 * Mengambil informasi harga real-time token dari DexScreener API.
 */
async function fetchTokenPriceFromDexScreener(mintAddress: string): Promise<TokenPriceData | null> {
  if (!mintAddress || mintAddress.length < 32) return null;

  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`);
    if (!response.ok) return null;

    const data: DexScreenerResponse = await response.json();
    if (!data.pairs || data.pairs.length === 0) return null;

    // Ambil pair likuiditas tertinggi di Solana
    const bestPair = data.pairs[0]!;

    return {
      mint: mintAddress,
      symbol: bestPair.baseToken.symbol || 'TOKEN',
      name: bestPair.baseToken.name || 'Unknown Token',
      priceSol: parseFloat(bestPair.priceNative) || 0,
      priceUsd: parseFloat(bestPair.priceUsd) || 0,
      marketCapUsd: bestPair.marketCap || bestPair.fdv,
      liquidityUsd: bestPair.liquidity?.usd,
      volume24h: bestPair.volume?.h24,
      priceChange24h: bestPair.priceChange?.h24,
      updatedAt: Date.now(),
    };
  } catch (error) {
    console.error('Gagal mengambil harga token dari DexScreener:', error);
    return null;
  }
}

/**
 * Hook pemantauan harga token dengan polling adaptif:
 * - 5 detik saat browser tab aktif
 * - 30 detik saat browser tab blur/di latar belakang
 */
export function useTokenPrice(mintAddress: string) {
  return useQuery({
    queryKey: ['token-price', mintAddress],
    queryFn: () => fetchTokenPriceFromDexScreener(mintAddress),
    enabled: Boolean(mintAddress && mintAddress.length >= 32),
    staleTime: 3000,
    refetchInterval: () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return POLLING_INTERVALS.BLUR_TAB_MS; // 30.000ms
      }
      return POLLING_INTERVALS.ACTIVE_TAB_MS; // 5.000ms
    },
  });
}
