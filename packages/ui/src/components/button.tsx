import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils.js';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-cyan-500 text-zinc-950 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-semibold',
        buy:
          'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-semibold border border-emerald-400/30',
        sell:
          'bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] font-semibold border border-rose-400/30',
        panic:
          'bg-rose-700 hover:bg-rose-600 text-white font-bold border-2 border-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.6)] animate-pulse',
        secondary:
          'bg-zinc-900 text-zinc-200 border border-zinc-800 hover:bg-zinc-800 hover:text-white',
        outline:
          'border border-zinc-700/80 bg-zinc-950/60 text-zinc-300 hover:bg-zinc-900 hover:text-white hover:border-zinc-500',
        ghost:
          'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-100',
        link:
          'text-cyan-400 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-md',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-base rounded-xl',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
