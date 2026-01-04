/**
 * Gantt feature - Utility function for className merging
 * Scoped copy of @/lib/utils to keep feature self-contained
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
