import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime";
import { kv } from "@vercel/kv";
import { getAll, get } from '@vercel/edge-config';
import type { AppConfig } from "~/types";
import { env } from "~/env.mjs";

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

  return matches ? matches.length : 0;
}

export enum LogLevels {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export async function cLog(level: LogLevels, range: string, calledBy: string, message: string) {
  const logMsg = `[${range}] (${calledBy}) ${message}`

  const dateStr = `${new Date().toISOString()} `

  switch (level) {
    case LogLevels.ERROR:
      console.error(dateStr, logMsg);
      break;
    case LogLevels.WARN:
      console.warn(dateStr, logMsg);
      break;
    case LogLevels.INFO:
      console.info(dateStr, logMsg);
      break;
    case LogLevels.DEBUG:
      console.debug(dateStr, logMsg);
      break;
    default:
      console.log(dateStr, logMsg);
      break;
  }

  if (env.NODE_ENV !== "development") {
    if (level != LogLevels.DEBUG) {
      const date = new Date().toISOString().split('T')[0] as string
      const key = `logs:${date}`
      const timestamp = Date.now()

      try {
        await kv.zadd(key, { score: timestamp, member: `${dateStr}${logMsg}` })
        await kv.expire(key, 7 * 24 * 60 * 60)
      } catch (err) {
        console.error(err)
      }
    }
  }
}

export const AppConfigKeys = {
  DEV_ENV_PREFIX: "dev_",
  GPT_MODEL: "general_openaiGptModel",
  BASIC_COST_PREFIX: "basicCost_",
  EXCHANGE_RATE_PREFIX: "exchangeRate_",
}

export const getConfigByKey = async (k: string) => {
  const key = env.NODE_ENV === "development" ? `${AppConfigKeys.DEV_ENV_PREFIX}${k}` : k
  const value = await get(key)
  return value
}

export const getAllConfigs = async () => {
  const allConfigs: AppConfig[] = []
  const result = await getAll()
  for (const k of Object.keys(result)) {
    if (env.NODE_ENV === "development" && k.startsWith(AppConfigKeys.DEV_ENV_PREFIX)) {
      allConfigs.push({ key: k.replace(AppConfigKeys.DEV_ENV_PREFIX, ""), value: result[k] as string })
    } else if (env.NODE_ENV !== "development" && !k.startsWith(AppConfigKeys.DEV_ENV_PREFIX)) {
      allConfigs.push({ key: k, value: result[k] as string })
    }
  }

  return allConfigs
}


