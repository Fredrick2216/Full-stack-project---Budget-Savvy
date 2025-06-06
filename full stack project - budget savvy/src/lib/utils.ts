
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  // Get currency symbol and format
  const currencyFormats: Record<string, { locale: string, symbol: string }> = {
    USD: { locale: "en-US", symbol: "$" },
    EUR: { locale: "de-DE", symbol: "€" },
    GBP: { locale: "en-GB", symbol: "£" },
    JPY: { locale: "ja-JP", symbol: "¥" },
    INR: { locale: "en-IN", symbol: "₹" },
    CAD: { locale: "en-CA", symbol: "C$" },
    AUD: { locale: "en-AU", symbol: "A$" },
    CNY: { locale: "zh-CN", symbol: "¥" },
  };

  const format = currencyFormats[currency] || currencyFormats.USD;
  
  return new Intl.NumberFormat(format.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Generates a random ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Gets a random item from an array
 */
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Formats a date object to a readable string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
}

/**
 * Truncates a string to a specified length and adds ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
