import { cache } from 'react';
import type { Locale } from './config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Messages = Record<string, any>;

export const getMessages = cache(async (locale: Locale): Promise<Messages> => {
  try {
    return (await import(`@/messages/${locale}.json`)).default;
  } catch {
    return (await import('@/messages/en.json')).default;
  }
});

/** Dot-path lookup with optional {param} interpolation. For server components. */
export function t(
  messages: Messages,
  key: string,
  params?: Record<string, string>,
): string {
  const value = key.split('.').reduce<unknown>((obj, k) => {
    if (obj && typeof obj === 'object' && k in (obj as Record<string, unknown>)) {
      return (obj as Record<string, unknown>)[k];
    }
    return undefined;
  }, messages);

  if (typeof value !== 'string') return key;

  if (!params) return value;

  let result = value;
  for (const [k, v] of Object.entries(params)) {
    result = result.split(`{${k}}`).join(v);
  }
  return result;
}
