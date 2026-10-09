import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils.js';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border transition-colors select-none',
  {
    variants: {
      variant: {
        default:
          'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800',
        buy:
          'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
        sell:
          'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)]',
        fulfilled:
          'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
        rejected:
          'bg-rose-500/15 border-rose-500/40 text-rose-300',
        pending:
          'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse',
        neon:
          'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
        outline:
          'border-zinc-700 text-zinc-400 bg-transparent',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  withDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  size,
  withDot,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {withDot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'buy' || variant === 'fulfilled'
              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
              : variant === 'sell' || variant === 'rejected'
              ? 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
              : variant === 'pending'
              ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
              : variant === 'neon'
              ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]'
              : 'bg-zinc-400'
          )}
        />
      )}
      {children}
    </div>
  );
};
