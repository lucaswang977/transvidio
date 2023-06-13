import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeFormat(milliseconds: number) {
  const hours = Math.floor(milliseconds / 1000 / 60 / 60).toString().padStart(2, "0");
  const minutes = Math.floor(milliseconds / 1000 / 60 % 60).toString().padStart(2, '0');
  const seconds = Math.floor(milliseconds / 1000 % 3600).toString().padStart(2, '0');
  const millisecondsFormatted = (milliseconds % 1000).toString().padStart(3, '0');

  return `${hours}:${minutes}:${seconds}.${millisecondsFormatted}`;
}
