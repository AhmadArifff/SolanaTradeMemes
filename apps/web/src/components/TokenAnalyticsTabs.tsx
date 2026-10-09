'use client';

import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  Search,
  Users,
  ArrowUpDown,
  Info,
  TrendingUp,
  TrendingDown,
  Globe,
  MessageCircle,
  Twitter,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import type {
  TokenHolder,
  LiveTokenTrade,
  TokenAboutInfo,
} from '../hooks/useTokenIntelligence';

interface TokenAnalyticsTabsProps {
  holders: TokenHolder[];
  totalHoldersCount?: number;
  isLoadingHolders: boolean;
  liveTrades: LiveTokenTrade[];
  aboutInfo: TokenAboutInfo | null;
  isLoadingAbout: boolean;
  tokenSymbol: string;
  tokenMint: string;
}

export function TokenAnalyticsTabs({
  holders,
  totalHoldersCount,
  isLoadingHolders,
  liveTrades,
  aboutInfo,
  isLoadingAbout,
  tokenSymbol,
  tokenMint,
}: TokenAnalyticsTabsProps) {
  const [activeTab, setActiveTab] = useState<'trades' | 'holders' | 'about'>('trades');
  const [tradeFilter, setTradeFilter] = useState<'all' | 'buys' | 'sells' | 'large'>('all');
  const [holderFilter, setHolderFilter] = useState<'all' | 'profit' | 'loss'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Trades
  const filteredTrades = useMemo(() => {
    return liveTrades.filter((t) => {
      if (tradeFilter === 'buys' && t.type !== 'BUY') return false;
      if (tradeFilter === 'sells' && t.type !== 'SELL') return false;
      if (tradeFilter === 'large' && t.amountUsd < 100) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          t.account.toLowerCase().includes(query) ||
          t.txSignature.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [liveTrades, tradeFilter, searchQuery]);

  // Filter Holders
  const filteredHolders = useMemo(() => {
    return holders.filter((h) => {
      if (holderFilter === 'profit' && !h.isProfit) return false;
      if (holderFilter === 'loss' && h.isProfit) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return h.address.toLowerCase().includes(query);
      }
      return true;
    });
  }, [holders, holderFilter, searchQuery]);

  // Format Helper
  const formatCompact = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="w-full bg-zinc-950/90 border border-zinc-800/80 rounded-xl overflow-hidden shadow-xl backdrop-blur-md mt-4">
      {/* Tab Navigation Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-zinc-800/80 px-4 py-2.5 gap-3 bg-zinc-900/60">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'trades'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Trades
            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.2 rounded-full text-zinc-300">
              {liveTrades.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('holders')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'holders'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Holders
            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.2 rounded-full text-zinc-300">
              {totalHoldersCount || holders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'about'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            About
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'holders'
                ? 'Search holder or wallet...'
                : 'Search wallet or tx...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Sub-Filter Pill Bar */}
      <div className="px-4 py-2 border-b border-zinc-800/50 bg-zinc-950/40 flex items-center justify-between overflow-x-auto text-xs">
        {activeTab === 'trades' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTradeFilter('all')}
              className={`px-2.5 py-0.8 rounded-md font-medium text-[11px] transition-colors ${
                tradeFilter === 'all'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTradeFilter('buys')}
              className={`px-2.5 py-0.8 rounded-md font-medium text-[11px] transition-colors flex items-center gap-1 ${
                tradeFilter === 'buys'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              Buys
            </button>
            <button
              onClick={() => setTradeFilter('sells')}
              className={`px-2.5 py-0.8 rounded-md font-medium text-[11px] transition-colors flex items-center gap-1 ${
                tradeFilter === 'sells'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <TrendingDown className="w-3 h-3 text-rose-400" />
              Sells
            </button>
            <button
              onClick={() => setTradeFilter('large')}
              className={`px-2.5 py-0.8 rounded-md font-medium text-[11px] transition-colors ${
                tradeFilter === 'large'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              ≥ $100
            </button>
          </div>
        )}

        {activeTab === 'holders' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setHolderFilter('all')}
              className={`px-2.5 py-0.8 rounded-md font-medium text-[11px] transition-colors ${
                holderFilter === 'all'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              All Holders ({totalHoldersCount || holders.length})
            </button>
            <button
              onClick={() => setHolderFilter('profit')}
              className={`px-2.5 py-0.8 rounded-md font-medium text-[11px] transition-colors flex items-center gap-1 ${
                holderFilter === 'profit'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              In profit
            </button>
            <button
              onClick={() => setHolderFilter('loss')}
              className={`px-2.5 py-0.8 rounded-md font-medium text-[11px] transition-colors flex items-center gap-1 ${
                holderFilter === 'loss'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              At a loss
            </button>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="text-[11px] text-zinc-400 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Metadata Diverifikasi dari DexScreener & On-Chain Solana
          </div>
        )}

        <div className="text-[10px] text-zinc-500 font-mono hidden md:block">
          Auto-refresh active
        </div>
      </div>

      {/* Tab Content 1: Trades Feed */}
      {activeTab === 'trades' && (
        <div className="overflow-x-auto max-h-[380px] overflow-y-auto font-mono text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 text-[11px] text-zinc-400 bg-zinc-900/40 sticky top-0 backdrop-blur-sm z-10">
                <th className="py-2.5 px-4 font-medium">Account</th>
                <th className="py-2.5 px-3 font-medium">Type</th>
                <th className="py-2.5 px-3 font-medium text-right">Amount (USD)</th>
                <th className="py-2.5 px-3 font-medium text-right">{tokenSymbol}</th>
                <th className="py-2.5 px-3 font-medium text-right">MC</th>
                <th className="py-2.5 px-3 font-medium text-right">Time</th>
                <th className="py-2.5 px-4 font-medium text-right">Txn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {filteredTrades.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-zinc-900/50 transition-colors group text-[11px]"
                >
                  <td className="py-2.5 px-4 font-sans flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500/30 to-purple-500/30 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-200">
                      {t.account.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="text-zinc-200 truncate max-w-[130px]">
                      {t.account}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.type === 'BUY'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-medium ${
                      t.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ${t.amountUsd.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-300">
                    {formatCompact(t.tokenAmount)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-400">
                    ${formatCompact(t.mcUsd)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-500">
                    {getTimeAgo(t.timestamp)}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <a
                      href={`https://solscan.io/tx/${t.txSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-cyan-400 transition-colors inline-flex items-center gap-1 group-hover:text-zinc-300"
                    >
                      <span className="truncate max-w-[50px]">{t.txSignature.substring(0, 6)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-zinc-500">
                    Tidak ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content 2: Holders */}
      {activeTab === 'holders' && (
        <div className="overflow-x-auto max-h-[380px] overflow-y-auto font-mono text-xs">
          {isLoadingHolders ? (
            <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              Mengambil data pemegang on-chain dari Solana RPC...
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 text-[11px] text-zinc-400 bg-zinc-900/40 sticky top-0 backdrop-blur-sm z-10">
                  <th className="py-2.5 px-4 font-medium"># Holder</th>
                  <th className="py-2.5 px-3 font-medium text-right">Held</th>
                  <th className="py-2.5 px-3 font-medium text-right">% Supply</th>
                  <th className="py-2.5 px-3 font-medium text-right">Position</th>
                  <th className="py-2.5 px-3 font-medium text-right">Profit</th>
                  <th className="py-2.5 px-3 font-medium text-right">Avg Entry MC</th>
                  <th className="py-2.5 px-3 font-medium text-right">Bought</th>
                  <th className="py-2.5 px-4 font-medium text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filteredHolders.map((h, idx) => (
                  <tr
                    key={h.address}
                    className="hover:bg-zinc-900/50 transition-colors group text-[11px]"
                  >
                    <td className="py-2.5 px-4 font-sans flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 w-4 font-mono">{idx + 1}</span>
                      {h.profileImage ? (
                        <img
                          src={h.profileImage}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover border border-zinc-700 bg-zinc-800 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500/30 to-blue-500/30 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-200 shrink-0">
                          {(h.userName || h.address).substring(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-zinc-200 font-medium truncate max-w-[130px] flex items-center gap-1.5">
                          {h.userName || `${h.address.substring(0, 4)}...${h.address.substring(h.address.length - 4)}`}
                          {h.isDev && (
                            <span className="px-1 py-0.1 text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-bold">
                              DEV
                            </span>
                          )}
                        </span>
                        {h.userName && (
                          <span className="text-[9px] text-zinc-500 font-mono truncate max-w-[110px]">
                            {h.address.substring(0, 4)}...{h.address.substring(h.address.length - 4)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-200 font-medium">
                      {formatCompact(h.uiAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-300">
                      {h.percentSupply.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-300">
                      ${formatCompact(h.positionUsd)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-medium ${
                        h.profitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {h.profitUsd >= 0
                        ? `+$${formatCompact(h.profitUsd)}`
                        : `-$${formatCompact(Math.abs(h.profitUsd))}`}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-400">
                      {h.avgEntryMc}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-medium">
                      {h.boughtUsd !== undefined ? `$${formatCompact(h.boughtUsd)}` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <a
                        href={`https://solscan.io/account/${h.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab Content 3: About & Project Info */}
      {activeTab === 'about' && (
        <div className="p-5 space-y-4">
          {isLoadingAbout ? (
            <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              Memuat profil proyek...
            </div>
          ) : (
            <>
              {/* Description Box */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-cyan-400" />
                    Tentang {aboutInfo?.name || tokenSymbol} ({tokenSymbol})
                  </h4>
                  {aboutInfo?.dexId && (
                    <span className="px-2 py-0.5 text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full font-mono uppercase">
                      Pool: {aboutInfo.dexId}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {aboutInfo?.description}
                </p>
              </div>

              {/* Official Sources Links */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4">
                <h5 className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
                  Official Sources & Verification
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                  {/* Website */}
                  {aboutInfo?.websites && aboutInfo.websites.length > 0 ? (
                    aboutInfo.websites.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-850 transition-all text-zinc-200"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-medium truncate max-w-[140px]">
                            Website Resmi
                          </span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50 text-zinc-500">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Tidak ada Website</span>
                    </div>
                  )}

                  {/* Twitter / X */}
                  {aboutInfo?.twitter ? (
                    <a
                      href={aboutInfo.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-sky-500/50 hover:bg-zinc-850 transition-all text-zinc-200"
                    >
                      <div className="flex items-center gap-2">
                        <Twitter className="w-3.5 h-3.5 text-sky-400" />
                        <span className="font-medium truncate max-w-[140px]">Twitter / X</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50 text-zinc-500">
                      <Twitter className="w-3.5 h-3.5" />
                      <span>Tidak ada Twitter/X</span>
                    </div>
                  )}

                  {/* Telegram */}
                  {aboutInfo?.telegram ? (
                    <a
                      href={aboutInfo.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-850 transition-all text-zinc-200"
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-medium truncate max-w-[140px]">Telegram Community</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50 text-zinc-500">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Tidak ada Telegram</span>
                    </div>
                  )}

                  {/* Solscan Explorer */}
                  <a
                    href={`https://solscan.io/token/${tokenMint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-850 transition-all text-zinc-200"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                      <span className="font-medium">Solscan Token Explorer</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>

                  {/* Pump.fun Official */}
                  <a
                    href={`https://pump.fun/coin/${tokenMint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-850 transition-all text-zinc-200"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-medium">Halaman Resmi Pump.fun</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
