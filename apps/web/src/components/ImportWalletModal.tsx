'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  KeyRound,
  FileText,
  Clipboard,
  Check,
  AlertCircle,
  Trash2,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Badge,
} from '@repo/ui';
import {
  sanitizeMnemonicInput,
  validateMnemonicPhrase,
  mnemonicToPrivateKeyBase58,
} from '@repo/crypto-vault';
import { useTerminalStore } from '../store/useTerminalStore';

interface ImportWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUnlockModal: () => void;
}

type ImportTab = 'seed' | 'privateKey';
type WordCount = 12 | 24;

export const ImportWalletModal: React.FC<ImportWalletModalProps> = ({
  isOpen,
  onClose,
  onOpenUnlockModal,
}) => {
  const { importWallet, isUnlocked } = useTerminalStore();

  const [activeTab, setActiveTab] = useState<ImportTab>('seed');
  const [wordCount, setWordCount] = useState<WordCount>(12);
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const [walletLabel, setWalletLabel] = useState('');
  const [privateKeyBase58, setPrivateKeyBase58] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pasteSuccessNotice, setPasteSuccessNotice] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sinkronisasi ukuran array kata saat wordCount berubah (12 vs 24)
  useEffect(() => {
    setWords((prev) => {
      if (prev.length === wordCount) return prev;
      if (prev.length < wordCount) {
        return [...prev, ...Array(wordCount - prev.length).fill('')];
      }
      return prev.slice(0, wordCount);
    });
  }, [wordCount]);

  // Reset pesan status saat modal dibuka / ditutup
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setPasteSuccessNotice(null);
    }
  }, [isOpen]);

  /**
   * Logika Sanitasi Cerdas:
   * Mengambil teks mentah (bernomor, dipisah spasi/koma/baris),
   * membersihkan nomor urut 1 s.d. 24, simbol kurung, tanda hubung,
   * lalu mengisi slot input secara berurutan.
   */
  const handleProcessMnemonicText = useCallback((rawText: string) => {
    const sanitizedTokens = sanitizeMnemonicInput(rawText);

    if (sanitizedTokens.length === 0) {
      setErrorMsg('Teks yang ditempel tidak mengandung kata mnemonik valid.');
      return;
    }

    // Deteksi otomatis apakah input berisi 24 kata atau 12 kata
    const targetCount: WordCount = sanitizedTokens.length >= 24 ? 24 : 12;
    if (targetCount !== wordCount) {
      setWordCount(targetCount);
    }

    const newWords = Array(targetCount).fill('');
    for (let i = 0; i < targetCount; i++) {
      newWords[i] = sanitizedTokens[i] || '';
    }

    setWords(newWords);
    setErrorMsg(null);
    setPasteSuccessNotice(
      `${sanitizedTokens.length} kata berhasil disanitasi & didistribusikan secara otomatis.`
    );

    // Auto-focus ke input terakhir atau input kosong pertama
    const firstEmptyIndex = newWords.findIndex((w) => !w);
    if (firstEmptyIndex !== -1 && inputRefs.current[firstEmptyIndex]) {
      inputRefs.current[firstEmptyIndex]?.focus();
    }
  }, [wordCount]);

  /**
   * Handler event paste pada setiap kotak input individu
   */
  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    if (!pastedData) return;

    handleProcessMnemonicText(pastedData);
  };

  /**
   * Tombol Paste Cepat dari Clipboard Peramban
   */
  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleProcessMnemonicText(text);
          return;
        }
      }
      setErrorMsg('Clipboard kosong atau izin akses clipboard ditolak peramban.');
    } catch {
      setErrorMsg('Gagal membaca clipboard. Silakan tempelkan langsung (Ctrl+V) ke dalam salah satu kotak input.');
    }
  };

  const handleWordChange = (index: number, value: string) => {
    // Jika user mengetik spasi, pindah ke input berikutnya
    if (value.includes(' ')) {
      const parts = value.trim().split(/\s+/);
      if (parts.length > 1) {
        handleProcessMnemonicText(value);
        return;
      }
    }

    const clean = value.replace(/[^a-zA-Z]/g, '').toLowerCase();
    const updated = [...words];
    updated[index] = clean;
    setWords(updated);
    setErrorMsg(null);
    setPasteSuccessNotice(null);
  };

  const handleWordKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (index < wordCount - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (e.key === 'Backspace' && !words[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleClearWords = () => {
    setWords(Array(wordCount).fill(''));
    setErrorMsg(null);
    setPasteSuccessNotice(null);
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const label = walletLabel.trim() || `Wallet ${Date.now().toString().slice(-4)}`;

    setIsLoading(true);

    try {
      let finalBase58Key = '';

      if (activeTab === 'seed') {
        const filledWords = words.map((w) => w.trim().toLowerCase());
        const emptyCount = filledWords.filter((w) => !w).length;

        if (emptyCount > 0) {
          throw new Error(`Harap lengkapi semua ${wordCount} kata mnemonik (${emptyCount} kata masih kosong).`);
        }

        const isValid = validateMnemonicPhrase(filledWords);
        if (!isValid) {
          throw new Error('Frase mnemonik tidak valid menurut kamus standar BIP-39. Periksa kembali ejaan kata.');
        }

        // Derivasi Keypair Solana (m/44/501/0/0)
        finalBase58Key = mnemonicToPrivateKeyBase58(filledWords);
      } else {
        // Tab Private Key
        const rawKey = privateKeyBase58.trim();
        if (!rawKey) {
          throw new Error('Kunci privat Solana wajib diisi.');
        }

        // Dukungan format byte array JSON: e.g. [12, 34, 56, ...]
        if (rawKey.startsWith('[') && rawKey.endsWith(']')) {
          try {
            const parsedArray = JSON.parse(rawKey);
            if (Array.isArray(parsedArray) && parsedArray.length === 64) {
              const { Keypair } = await import('@solana/web3.js');
              const kp = Keypair.fromSecretKey(new Uint8Array(parsedArray));
              const bs58 = (await import('bs58')).default;
              finalBase58Key = bs58.encode(kp.secretKey);
            } else {
              throw new Error('Format array byte harus berisi 64 angka byte.');
            }
          } catch {
            throw new Error('Format JSON array byte tidak valid.');
          }
        } else {
          finalBase58Key = rawKey;
        }
      }

      // Simpan dan enkripsi ke IndexedDB melalui Zustand Store
      const result = await importWallet(label, finalBase58Key);

      if (result.success) {
        setWalletLabel('');
        setPrivateKeyBase58('');
        setWords(Array(wordCount).fill(''));
        onClose();
      } else {
        setErrorMsg(result.error);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengimpor dompet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg font-mono bg-zinc-950/95 border-zinc-800 text-zinc-100 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
        <DialogHeader className="space-y-1.5 pb-2 text-center">
          <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Seed phrase or private key
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Kunci Anda akan dienkripsi Web Crypto API (AES-GCM-256) lokal di peramban.
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          <div className="p-4 my-3 rounded-xl bg-amber-950/30 border border-amber-900/50 text-xs text-amber-300 font-mono space-y-3">
            <p className="leading-relaxed">
              Kubah saat ini terkunci. Harap buka kubah terlebih dahulu dengan kata sandi master untuk menambahkan dompet baru.
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                onClose();
                onOpenUnlockModal();
              }}
              className="w-full text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black"
            >
              Buka Kubah Sekarang
            </Button>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-1">
            {/* OKX Style Segmented Tab Switcher */}
            <div className="bg-zinc-900/80 p-1 rounded-xl flex items-center border border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('seed');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 ${
                  activeTab === 'seed'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Seed phrase
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('privateKey');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 ${
                  activeTab === 'privateKey'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Private key
              </button>
            </div>

            {/* Input Nama Label Dompet */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">
                Label Dompet (Opsional)
              </label>
              <Input
                value={walletLabel}
                onChange={(e) => setWalletLabel(e.target.value)}
                placeholder="Contoh: Main Wallet, Sniper 01"
                className="bg-zinc-900/70 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 rounded-xl"
              />
            </div>

            {/* Tampilan Tab 1: Seed Phrase (OKX Layout) */}
            {activeTab === 'seed' && (
              <div className="space-y-3">
                {/* Header Kontrol Word Count & Tombol Paste */}
                <div className="flex items-center justify-between pt-1">
                  <div className="relative inline-flex items-center gap-1 text-xs text-zinc-300">
                    <span className="text-zinc-400">My seed phrase has</span>
                    <div className="relative">
                      <select
                        value={wordCount}
                        onChange={(e) => {
                          const val = Number(e.target.value) as WordCount;
                          setWordCount(val);
                        }}
                        className="appearance-none bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-bold text-xs py-1 pl-2.5 pr-6 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-600"
                      >
                        <option value={12}>12 words</option>
                        <option value={24}>24 words</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      title="Tempelkan daftar kata langsung dari clipboard"
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 flex items-center gap-1.5 transition-colors"
                    >
                      <Clipboard className="w-3 h-3 text-cyan-400" />
                      Paste
                    </button>
                    {words.some((w) => w) && (
                      <button
                        type="button"
                        onClick={handleClearWords}
                        title="Kosongkan seluruh kotak kata"
                        className="px-2 py-1 text-[11px] font-medium rounded-lg bg-zinc-800/80 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-zinc-700/60 flex items-center transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifikasi Sukses Sanitasi Otomatis */}
                {pasteSuccessNotice && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-[11px] text-cyan-300">
                    <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{pasteSuccessNotice}</span>
                  </div>
                )}

                {/* Grid Input 2 Kolom (Sesuai Tampilan OKX Wallet) */}
                <div
                  className={`grid grid-cols-2 gap-2 max-h-[290px] overflow-y-auto pr-1 ${
                    wordCount === 24 ? 'max-h-[340px]' : ''
                  }`}
                >
                  {Array.from({ length: wordCount }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-zinc-900/60 hover:bg-zinc-900/90 focus-within:bg-zinc-900 focus-within:border-zinc-500 border border-zinc-800/80 rounded-xl px-3 py-1.5 transition-colors"
                    >
                      {/* Nomor Urut (Muted Label) */}
                      <span className="w-5 text-right text-[11px] font-mono text-zinc-500 select-none mr-2 font-medium">
                        {index + 1}
                      </span>
                      {/* Pemisah Halus */}
                      <span className="h-3.5 w-[1px] bg-zinc-800 mr-2 shrink-0 select-none" />
                      {/* Kotak Input Teks Kata */}
                      <input
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        value={words[index] || ''}
                        onChange={(e) => handleWordChange(index, e.target.value)}
                        onKeyDown={(e) => handleWordKeyDown(index, e)}
                        onPaste={handleInputPaste}
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full bg-transparent text-xs font-mono text-zinc-100 placeholder:text-zinc-700 focus:outline-none"
                        placeholder="word"
                      />
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-zinc-500 leading-normal">
                  Tips: Anda dapat menempelkan daftar bernomor (contoh: 1. laugh \n 2. hazard) langsung ke dalam kotak manapun.
                </p>
              </div>
            )}

            {/* Tampilan Tab 2: Private Key */}
            {activeTab === 'privateKey' && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      Private Key Solana (Base58 atau Byte Array)
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) setPrivateKeyBase58(text.trim());
                        } catch {
                          setErrorMsg('Gagal membaca clipboard.');
                        }
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                    >
                      <Clipboard className="w-3 h-3" />
                      Paste Key
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={privateKeyBase58}
                    onChange={(e) => {
                      setPrivateKeyBase58(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Masukkan kunci privat Base58 (88 karakter) atau array [1,2,3...]..."
                    className="w-full bg-zinc-900/70 border border-zinc-800 text-xs font-mono text-zinc-100 p-3 rounded-xl focus:border-zinc-500 focus:outline-none resize-none placeholder:text-zinc-600"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Dapat diekspor dari Phantom atau Solflare (Pengaturan &gt; Kelola Akun &gt; Ekspor Kunci Privat).
                  </p>
                </div>
              </div>
            )}

            {/* Pesan Error */}
            {errorMsg && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 font-mono">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Tombol Confirm (Sesuai Tombol Bulat Panjang OKX) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm tracking-wide transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-zinc-200/10 active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    Memproses &amp; Mengenkripsi...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
