import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Formats a number as Kenyan Shillings (KES)
 * @param amount - The amount to format
 * @returns Formatted string with KES prefix (e.g., "KSh 15,000.00")
 */
export function formatCurrency(amount: number): string {
    return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}