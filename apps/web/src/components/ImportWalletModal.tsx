'use client';

import React, { useState } from 'react';
import { PlusCircle, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
} from '@repo/ui';
import { useTerminalStore } from '../store/useTerminalStore';

interface ImportWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUnlockModal: () => void;
}

export const ImportWalletModal: React.FC<ImportWalletModalProps> = ({
  isOpen,
  onClose,
  onOpenUnlockModal,
}) => {
  const { importWallet, isUnlocked } = useTerminalStore();
  const [label, setLabel] = useState('');
  const [privateKeyBase58, setPrivateKeyBase58] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setErrorMsg('Label dompet wajib diisi.');
      return;
    }

    if (!privateKeyBase58.trim()) {
      setErrorMsg('Kunci privat Base58 wajib diisi.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await importWallet(label.trim(), privateKeyBase58.trim());
      if (res.success) {
        setLabel('');
        setPrivateKeyBase58('');
        onClose();
      } else {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengimpor dompet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md font-mono">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <DialogTitle className="text-base font-bold text-zinc-100">
              Impor Dompet Solana Baru
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Kunci privat Anda akan langsung dienkripsi AES-GCM-256 dan disimpan lokal di IndexedDB.
            Tidak pernah ada transmisi kunci ke server Vercel atau luar browser.
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          <div className="p-4 my-2 rounded-lg bg-amber-950/30 border border-amber-900/40 text-xs text-amber-300 font-mono space-y-3">
            <p>
              Kubah sedang terkunci. Buka kubah terlebih dahulu dengan kata sandi master untuk
              mengimpor dompet baru.
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                onClose();
                onOpenUnlockModal();
              }}
              className="w-full text-xs"
            >
              Buka Kubah Sekarang
            </Button>
          </div>
        ) : (
          <form onSubmit={handleImport} className="space-y-4 my-2">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                Label Alias Dompet
              </label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Contoh: Sniper 01, Main Scalper"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                Kunci Privat Solana (Format Base58 - 64 Byte)
              </label>
              <Input
                type="password"
                value={privateKeyBase58}
                onChange={(e) => setPrivateKeyBase58(e.target.value)}
                placeholder="Masukkan Base58 Private Key (88 karakter)..."
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Kunci Phantom/Solflare dapat diekspor dari Pengaturan &gt; Ekspor Kunci Privat.
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/50 text-xs text-rose-300 font-mono">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="buy"
                size="sm"
                isLoading={isLoading}
                className="text-xs font-bold"
              >
                Simpan &amp; Enkripsi
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
