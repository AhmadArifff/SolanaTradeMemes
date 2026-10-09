'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert } from 'lucide-react';
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

interface UnlockVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnlockVaultModal: React.FC<UnlockVaultModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { unlockVault } = useTerminalStore();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setErrorMsg('Kata sandi master minimal 8 karakter.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await unlockVault(password);
      if (res.success) {
        setPassword('');
        onClose();
      } else {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal membuka kubah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md font-mono">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-cyan-400" />
            </div>
            <DialogTitle className="text-base font-bold text-zinc-100">
              Buka Kubah Kriptografi
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Kunci privat Anda dienkripsi AES-GCM-256 di IndexedDB. Masukkan kata sandi master untuk
            mendekripsinya ke RAM browser sesi ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUnlock} className="space-y-4 my-2">
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
              Kata Sandi Master
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter..."
              autoFocus
            />
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
              variant="default"
              size="sm"
              isLoading={isLoading}
              className="text-xs font-bold"
            >
              <Lock className="w-3.5 h-3.5 mr-1" />
              Buka Kunci
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
