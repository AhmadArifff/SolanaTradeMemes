import * as React from 'react';
import { cn } from '../lib/utils.js';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefixNode?: React.ReactNode;
  suffixNode?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, prefixNode, suffixNode, ...props }, ref) => {
    if (prefixNode || suffixNode) {
      return (
        <div className="relative flex items-center w-full">
          {prefixNode && (
            <div className="absolute left-3 flex items-center pointer-events-none text-zinc-500">
              {prefixNode}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 font-mono transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus-visible:border-cyan-500/80 disabled:cursor-not-allowed disabled:opacity-50',
              prefixNode ? 'pl-9' : 'pl-3',
              suffixNode ? 'pr-12' : 'pr-3',
              className
            )}
            ref={ref}
            {...props}
          />
          {suffixNode && (
            <div className="absolute right-3 flex items-center pointer-events-none text-xs font-mono font-medium text-zinc-400">
              {suffixNode}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 font-mono transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus-visible:border-cyan-500/80 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
