import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | undefined | null) {
  if (!date) return ""
  return format(new Date(date), "PPP", { locale: ar })
}

export function formatDateTime(date: string | Date | undefined | null) {
  if (!date) return ""
  return format(new Date(date), "PPP p", { locale: ar })
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
  }).format(amount)
}
