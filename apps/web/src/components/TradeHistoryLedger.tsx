'use client';

import React from 'react';
import {
  History,
  Download,
  Trash2,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Award,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Badge,
} from '@repo/ui';
import { useTradeLedger } from '../hooks/useTradeLedger';

export const TradeHistoryLedger: React.FC = () => {
  const {
    history,
    summary,
    isLoading,
    exportToCsv,
    exportToJson,
    clearHistory,
  } = useTradeLedger();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <CardTitle className="text-sm font-mono tracking-wide">
            Buku Besar Riwayat &amp; Realized PnL ({history.length} Catatan)
          </CardTitle>
        </div>

        {/* Toolbar Export & Clear */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCsv}
            disabled={history.length === 0}
            className="text-xs font-mono h-8"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportToJson}
            disabled={history.length === 0}
            className="text-xs font-mono h-8"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>JSON</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Hapus seluruh riwayat buku besar transaksi dari IndexedDB?')) {
                clearHistory();
              }
            }}
            disabled={history.length === 0}
            className="text-xs font-mono h-8 text-zinc-500 hover:text-rose-400"
            title="Reset Buku Besar"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          {/* Total Realized PnL */}
          <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/50">
            <span className="text-[10px] text-zinc-500 block uppercase">Total Realized PnL</span>
            <div
              className={`text-base font-bold flex items-center gap-1 mt-0.5 ${
                summary.totalRealizedPnlSol >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {summary.totalRealizedPnlSol >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {summary.totalRealizedPnlSol >= 0 ? '+' : ''}
                {summary.totalRealizedPnlSol.toFixed(4)} SOL
              </span>
            </div>
          </div>

          {/* Win Rate */}
          <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/50">
            <span className="text-[10px] text-zinc-500 block uppercase">Win Rate</span>
            <div className="text-base font-bold text-cyan-400 flex items-center gap-1 mt-0.5">
              <Award className="w-4 h-4" />
              <span>{summary.winRatePercent}%</span>
            </div>
          </div>

          {/* Winning vs Losing Trades */}
          <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/50">
            <span className="text-[10px] text-zinc-500 block uppercase">Trades Menang / Kalah</span>
            <div className="text-base font-bold text-zinc-200 mt-0.5">
              <span className="text-emerald-400">{summary.winningTrades}W</span>
              <span className="text-zinc-600 mx-1">/</span>
              <span className="text-rose-400">{summary.losingTrades}L</span>
            </div>
          </div>

          {/* Average ROI */}
          <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/50">
            <span className="text-[10px] text-zinc-500 block uppercase">Rata-Rata ROI</span>
            <div
              className={`text-base font-bold mt-0.5 ${
                summary.averageRoiPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {summary.averageRoiPercent >= 0 ? '+' : ''}
              {summary.averageRoiPercent}%
            </div>
          </div>
        </div>

        {/* Tabel Riwayat Transaksi */}
        {isLoading ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-xs">
            Memuat data buku besar dari IndexedDB...
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-xs">
            Belum ada catatan transaksi. Lakukan eksekusi BUY atau SELL untuk mencatat riwayat buku besar.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Dompet</TableHead>
                <TableHead>Token Mint</TableHead>
                <TableHead className="text-right">Jumlah SOL</TableHead>
                <TableHead className="text-right">Cost Basis</TableHead>
                <TableHead className="text-right">Realized PnL</TableHead>
                <TableHead className="text-center">Explorer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  {/* Waktu */}
                  <TableCell className="text-zinc-400 text-[11px] whitespace-nowrap">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </TableCell>

                  {/* Aksi */}
                  <TableCell>
                    <Badge variant={item.action === 'buy' ? 'buy' : 'sell'} size="sm">
                      {item.action.toUpperCase()}
                    </Badge>
                  </TableCell>

                  {/* Dompet */}
                  <TableCell className="text-zinc-300 font-sans text-xs">
                    {item.walletLabel}
                  </TableCell>

                  {/* Token Mint */}
                  <TableCell className="text-zinc-400 font-mono text-[11px]">
                    {item.tokenMint.slice(0, 4)}...{item.tokenMint.slice(-4)}
                  </TableCell>

                  {/* Jumlah SOL */}
                  <TableCell className="text-right font-mono font-medium text-zinc-200">
                    {item.solAmount.toFixed(4)} SOL
                  </TableCell>

                  {/* Cost Basis */}
                  <TableCell className="text-right font-mono text-zinc-400">
                    {item.costBasisSol !== undefined ? `${item.costBasisSol.toFixed(4)} SOL` : '-'}
                  </TableCell>

                  {/* Realized PnL */}
                  <TableCell className="text-right font-mono">
                    {item.realizedPnlSol !== undefined ? (
                      <span
                        className={`font-bold ${
                          item.realizedPnlSol >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.realizedPnlSol >= 0 ? '+' : ''}
                        {item.realizedPnlSol.toFixed(4)} SOL ({item.realizedPnlPercent}%)
                      </span>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </TableCell>

                  {/* Solscan Link */}
                  <TableCell className="text-center">
                    <a
                      href={`https://solscan.io/tx/${item.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors p-1"
                      title="Lihat di Solscan"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
