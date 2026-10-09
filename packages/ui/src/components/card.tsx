import * as React from 'react';
import { cn } from '../lib/utils.js';

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { glow?: 'cyan' | 'emerald' | 'rose' | 'none' }
>(({ className, glow = 'none', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border border-zinc-800/80 bg-zinc-950/75 backdrop-blur-md text-zinc-100 transition-all duration-200',
      glow === 'cyan' && 'border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      glow === 'emerald' && 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      glow === 'rose' && 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)]',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-5 border-b border-zinc-900/60', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold text-base leading-none tracking-tight text-zinc-100', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs text-zinc-400 mt-1', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-5', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-4 border-t border-zinc-900/80 bg-zinc-950/40', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
