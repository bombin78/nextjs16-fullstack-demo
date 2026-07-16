import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type TabValue = "dashboard" | "explore" | "builds" | "";

export function getTabValue(pathname: string): TabValue {
  if(pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'dashboard'
  if(pathname === '/builds/explore' || pathname.startsWith('/builds/explore')) return 'explore'
  if(pathname === '/builds' || pathname.startsWith('/builds')) return 'builds'

  return '';
}
