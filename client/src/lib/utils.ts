import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency based on currency_decimals
export function formatCurrency(amount: number): string {
  // Convert from minor units to actual amount
  const actualAmount = amount / 100;
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(actualAmount);
}

// Convert actual amount to minor units for API
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

// Format date
export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy');
}

// Format date and time
export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
}

// Get user initials for avatar
export function getUserInitials(username: string, displayName?: string | null): string {
  if (displayName) {
    const names = displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName[0].toUpperCase();
  }
  
  return username[0].toUpperCase();
}

// Get account type label
export function getAccountTypeLabel(type: number): string {
  switch (type) {
    case 0:
      return 'Checking Account';
    case 1:
      return 'Cash';
    case 2:
      return 'Wallet';
    default:
      return 'Unknown';
  }
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
