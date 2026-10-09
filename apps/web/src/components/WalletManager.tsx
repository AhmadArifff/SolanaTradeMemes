'use client';

import React, { useState } from 'react';
import { Copy, Check, Trash2, Wallet as WalletIcon, CheckSquare, Square } from 'lucide-react';
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
import { useTerminalStore } from '../store/useTerminalStore';

export const WalletManager: React.FC = () => {
  const {
    wallets,
    toggleWalletSelection,
    selectAllWallets,
    removeWallet,
    isUnlocked,
  } = useTerminalStore();

  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const selectedCount = wallets.filter((w) => w.isSelected).length;
  const totalSol = wallets
    .filter((w) => w.isSelected)
    .reduce((sum, w) => sum + w.solBalance, 0);

  const allSelected = wallets.length > 0 && selectedCount === wallets.length;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <WalletIcon className="w-4 h-4 text-cyan-400" />
          <CardTitle className="text-sm font-mono tracking-wide">
            Manajemen Multi-Dompet ({wallets.length})
          </CardTitle>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <Badge variant="outline" size="sm">
            Terpilih: <span className="text-cyan-400 font-bold ml-1">{selectedCount}</span> / {wallets.length}
          </Badge>
          <Badge variant="neon" size="sm">
            Total SOL: <span className="text-emerald-400 font-bold ml-1">{totalSol.toFixed(4)} SOL</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {wallets.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-xs">
            Belum ada dompet di dalam kubah. Klik tombol{' '}
            <span className="text-cyan-400 font-semibold">&quot;Impor Dompet&quot;</span> di atas untuk
            menambahkan dompet Solana Anda.
          </div>
        ) : (
          <div>
            {/* Toolbar Pilih Semua */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-zinc-950/40 text-xs font-mono">
              <button
                type="button"
                onClick={() => selectAllWallets(!allSelected)}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-cyan-400 transition-colors"
              >
                {allSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                <span>{allSelected ? 'Batalkan Semua' : 'Pilih Semua Dompet'}</span>
              </button>
              <span className="text-[11px] text-zinc-500">
                {isUnlocked ? 'Status: Kunci Siap di RAM' : 'Status: Kubah Terkunci'}
              </span>
            </div>

            {/* Tabel Data Dompet */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">Pilih</TableHead>
                  <TableHead>Label Dompet</TableHead>
                  <TableHead>Public Key Solana</TableHead>
                  <TableHead className="text-right">Saldo SOL</TableHead>
                  <TableHead className="text-right">Saldo Token</TableHead>
                  <TableHead className="w-12 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((wallet) => (
                  <TableRow
                    key={wallet.id}
                    data-state={wallet.isSelected ? 'selected' : undefined}
                    className="cursor-pointer"
                    onClick={() => toggleWalletSelection(wallet.id)}
                  >
                    {/* Checkbox */}
                    <TableCell
                      className="text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWalletSelection(wallet.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={wallet.isSelected}
                        onChange={() => toggleWalletSelection(wallet.id)}
                        className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500/30 cursor-pointer"
                      />
                    </TableCell>

                    {/* Label */}
                    <TableCell className="font-medium text-zinc-100 font-sans text-xs">
                      {wallet.label}
                    </TableCell>

                    {/* Public Key */}
                    <TableCell
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(wallet.publicKey);
                      }}
                      className="text-zinc-400 hover:text-cyan-300 font-mono text-[11px] group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>
                          {wallet.publicKey.slice(0, 4)}...{wallet.publicKey.slice(-4)}
                        </span>
                        {copiedAddress === wallet.publicKey ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500" />
                        )}
                      </div>
                    </TableCell>

                    {/* Saldo SOL */}
                    <TableCell className="text-right font-mono text-emerald-400 font-semibold">
                      {wallet.solBalance.toFixed(4)}
                    </TableCell>

                    {/* Saldo Token */}
                    <TableCell className="text-right font-mono text-cyan-400">
                      {wallet.tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </TableCell>

                    {/* Hapus */}
                    <TableCell
                      className="text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Hapus dompet "${wallet.label}" dari kubah?`)) {
                          removeWallet(wallet.id);
                        }
                      }}
                    >
                      <button
                        type="button"
                        className="text-zinc-600 hover:text-rose-400 transition-colors p-1"
                        title="Hapus Dompet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
