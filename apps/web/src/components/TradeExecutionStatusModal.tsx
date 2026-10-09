'use client';

import React from 'react';
import { ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
} from '@repo/ui';
import { useTerminalStore } from '../store/useTerminalStore';

export const TradeExecutionStatusModal: React.FC = () => {
  const {
    isExecutionModalOpen,
    setExecutionModalOpen,
    isExecuting,
    executionResults,
  } = useTerminalStore();

  const fulfilledCount = executionResults.filter((r) => r.status === 'fulfilled').length;
  const rejectedCount = executionResults.filter((r) => r.status === 'rejected').length;

  return (
    <Dialog open={isExecutionModalOpen} onOpenChange={setExecutionModalOpen}>
      <DialogContent className="max-w-xl font-mono">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-base font-bold text-zinc-100">
              Hasil Eksekusi Transaksi Multi-Dompet
            </DialogTitle>
            <div className="flex items-center gap-1.5 text-xs">
              <Badge variant="fulfilled" size="sm">
                {fulfilledCount} Sukses
              </Badge>
              {rejectedCount > 0 && (
                <Badge variant="rejected" size="sm">
                  {rejectedCount} Gagal
                </Badge>
              )}
            </div>
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Penyiaran paralel disalurkan langsung ke Private RPC Solana (Helius/QuickNode).
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 my-2">
          {isExecuting ? (
            <div className="p-8 text-center text-zinc-400 text-xs">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Menandatangani transaksi di RAM dan menyiarkan ke RPC...
            </div>
          ) : executionResults.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-xs">
              Tidak ada hasil eksekusi.
            </div>
          ) : (
            executionResults.map((result, idx) => (
              <div
                key={result.publicKey + idx}
                className={`p-3 rounded-lg border text-xs ${
                  result.status === 'fulfilled'
                    ? 'bg-emerald-950/20 border-emerald-900/40'
                    : 'bg-rose-950/20 border-rose-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-sans font-semibold text-zinc-200">
                    {result.status === 'fulfilled' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{result.walletLabel || 'Dompet'}</span>
                    <span className="font-mono text-[11px] text-zinc-500 font-normal">
                      ({result.publicKey.slice(0, 4)}...{result.publicKey.slice(-4)})
                    </span>
                  </div>
                  <Badge
                    variant={result.status === 'fulfilled' ? 'fulfilled' : 'rejected'}
                    size="sm"
                  >
                    {result.status === 'fulfilled' ? 'SUKSES' : 'GAGAL'}
                  </Badge>
                </div>

                {result.signature && (
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 font-mono">Signature:</span>
                    <a
                      href={`https://solscan.io/tx/${result.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline font-mono"
                    >
                      <span>
                        {result.signature.slice(0, 8)}...{result.signature.slice(-8)}
                      </span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {result.error && (
                  <div className="mt-1 text-[11px] text-rose-300 font-mono bg-rose-950/30 p-2 rounded border border-rose-900/40">
                    {result.error}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExecutionModalOpen(false)}
            className="w-full text-xs font-mono"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
