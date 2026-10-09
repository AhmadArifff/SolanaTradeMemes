import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Menggabungkan class CSS Tailwind dengan deduplikasi konflik dan kondisi dinamis.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
