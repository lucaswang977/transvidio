import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeFormat(milliseconds: number, hasHour?: boolean, point?: string) {
  const minutes = Math.floor(milliseconds / 1000 / 60).toString().padStart(2, '0')
  const seconds = Math.floor(milliseconds / 1000 % 60).toString().padStart(2, '0')
  const millisecondsFormatted = Math.floor(milliseconds % 1000).toString().padStart(3, '0')

  if (hasHour && hasHour === true) {
    const hour = Math.floor(milliseconds / 1000 / 60 / 60).toString().padStart(2, '0')
    const newMin = (Math.floor(milliseconds / 1000 / 60) % 60).toString().padStart(2, '0')
    return `${hour}:${newMin}:${seconds}${point ? point : "."}${millisecondsFormatted}`;
  } else {
    return `${minutes}:${seconds}${point ? point : "."}${millisecondsFormatted}`;
  }
}

export function naturalTime(time: Date) {
  dayjs.extend(relativeTime)
  return dayjs(time).fromNow()
}

export function extractLetters(name: string): string {
  let extractedLetters = '';

  if (/[\p{Script=Latin}]/u.test(name)) {
    // Extract two representative Latin letters
    const latinLetters = name.match(/[a-zA-Z]/gu) || [];
    extractedLetters = latinLetters.slice(0, 2).join('');
  } else {
    // Extract one character for non-Latin languages
    const nonLatinCharacters = name.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu);
    extractedLetters = nonLatinCharacters ? nonLatinCharacters[0] : name.charAt(0);
  }

  return extractedLetters;
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }

  const truncated = str.slice(0, maxLength);
  return truncated + '...';
}

export function delay(milliseconds: number) {
  return new Promise<void>(resolve => setTimeout(() => { resolve() }, milliseconds))
}

// eslint-disable-next-line 
export function countWordsInJSONValues(obj: any): number {
  const jsonString = JSON.stringify(obj);

  const noURLString = jsonString.replace(/https?:\/\/[^\s]+/g, '')

  const valueStrings =
    noURLString
      .replace(/"[^"]*":/g, '')
      .split(',')
      .map(s => s.replace(/[\{\}\[\]\"\:\s]+/g, ' '));

  const noHTMLStrings = valueStrings.map(s => s.replace(/<[^>]+>/g, ''));

  const noSpecialCodeStrings = noHTMLStrings.map(s => s.replace(/&nbsp;|\\n|\\r|\\t|\\b|\\f|\\v/g, ' '));

  const noNumberStrings = noSpecialCodeStrings.map(s => s.replace(/\b\d+\b/g, ''));

  const matches = noNumberStrings.join(' ').match(/\b\w+\b/g);
  console.log(JSON.stringify(matches))

  return matches ? matches.length : 0;
}
