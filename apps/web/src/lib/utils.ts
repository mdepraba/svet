import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Joins class names, letting a later Tailwind utility override an earlier one
 * for the same property.
 *
 * @param inputs Class values, conditionals included.
 * @returns The merged `className` string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
