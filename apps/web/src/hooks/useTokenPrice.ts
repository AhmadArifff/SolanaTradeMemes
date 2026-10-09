'use client';

import { useQuery } from '@tanstack/react-query';
import { POLLING_INTERVALS, type TokenPriceData } from '@repo/types';

interface DexScreenerPair {
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken?: {
    address?: string;
    name?: string;
    symbol?: string;
  };
  priceNative: string; // Harga dalam token kuotasi (SOL/WBTC/USDC)
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

let cachedSolUsdPrice = 200;
let lastSolPriceFetchTime = 0;

async function getSolUsdPrice(): Promise<number> {
  const now = Date.now();
  if (now - lastSolPriceFetchTime < 60000 && cachedSolUsdPrice > 0) {
    return cachedSolUsdPrice;
  }
  try {
    const res = await fetch('https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112');
    if (res.ok) {
      const data = await res.json();
      const solPair = data.pairs?.find(
        (p: { quoteToken?: { symbol?: string }; priceUsd?: string }) =>
          p.quoteToken?.symbol === 'USDC' || p.quoteToken?.symbol === 'USDT'
      );
      if (solPair && parseFloat(solPair.priceUsd) > 0) {
        cachedSolUsdPrice = parseFloat(solPair.priceUsd);
        lastSolPriceFetchTime = now;
      }
    }
  } catch {
    // Fallback ke cache sebelumnya
  }
  return cachedSolUsdPrice;
}

/**
 * Mengambil informasi harga real-time token dari DexScreener API
 * dengan memprioritaskan pair likuiditas tertinggi aktif.
 */
async function fetchTokenPriceFromDexScreener(mintAddress: string): Promise<TokenPriceData | null> {
  if (!mintAddress || mintAddress.length < 32) return null;

  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`);
    if (!response.ok) return null;

    const data: DexScreenerResponse = await response.json();
    if (!data.pairs || data.pairs.length === 0) return null;

    // Filter pair valid dan urutkan berdasarkan likuiditas USD tertinggi
    const validPairs = data.pairs
      .filter((p) => p.priceUsd && parseFloat(p.priceUsd) > 0)
      .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

    if (validPairs.length === 0) return null;

    const bestPair = validPairs[0]!;
    const priceUsd = parseFloat(bestPair.priceUsd) || 0;

    // Hitung harga SOL secara akurat
    const solUsd = await getSolUsdPrice();
    let priceSol = 0;
    if (bestPair.quoteToken?.symbol === 'SOL' && bestPair.priceNative) {
      priceSol = parseFloat(bestPair.priceNative) || 0;
    } else if (solUsd > 0 && priceUsd > 0) {
      priceSol = priceUsd / solUsd;
    } else if (bestPair.priceNative) {
      priceSol = parseFloat(bestPair.priceNative) || 0;
    }

    return {
      mint: mintAddress,
      symbol: bestPair.baseToken.symbol || 'TOKEN',
      name: bestPair.baseToken.name || 'Unknown Token',
      priceSol,
      priceUsd,
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
    staleTime: 1500,
    refetchInterval: () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return POLLING_INTERVALS.BLUR_TAB_MS; // 30.000ms
      }
      return 3000; // 3.000ms polling real-time saat tab aktif
    },
  });
}
